import uuidv4 from "uuid/v4";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import * as yup from "yup";
import { validate, validateTimezone } from "../helpers";

import {
  fetchByKey,
  putByKey,
  updateByKey,
  deleteByKey,
  objectToExpression,
  TableName,
  client as dynamodb
} from "../helpers";
import { TeamQueries } from "./team";

export const UserQueries = {
  fetchUserById: async userId => {
    const user = await fetchByKey({
      PK: userId,
      SK: "user"
    });
    return userObject(user);
  },
  fetchUserByEmail: async email => {
    const input = {
      GSI1PK: "user",
      GSI1SK: email
    };
    const params = {
      TableName,
      IndexName: "GSI1",
      ...objectToExpression("KeyConditionExpression", input)
    };
    const { Items } = await dynamodb.query(params).promise();
    return userObject(Items[0]);
  },
  putUser: async data => {
    const schema = yup.object().shape({
      name: yup.string().min(1),
      email: yup
        .string()
        .email()
        .min(1)
        .test("is-unique", "Email is taken", value => {
          if (value == null) return true;
          return true;
        }),
      password: yup.string().min(6),
      tz: validateTimezone()
    });

    validate(data, schema);

    const { email, password = "", ...input } = data;

    const PK = uuidv4();
    const SK = "user";

    await putByKey({
      PK,
      SK,
      input: {
        GSI1PK: "user",
        GSI1SK: email,
        tz: "America/Los_Angeles",
        password: bcrypt.hashSync(password, 10),
        email,
        ...input
      }
    });

    return UserQueries.fetchUserById(PK);
  },
  updateUser: async ({ id: userId, ...input }) => {
    const user = await updateByKey({
      PK: userId,
      SK: "user",
      input
    });
    return userObject(user);
  },
  deleteUser: async ({ id: userId }) => {
    await deleteByKey(userId);
    return { id: userId };
  },
  createUserWithTeam: async data => {
    const schema = yup.object().shape({
      name: yup.string().min(1),
      email: yup
        .string()
        .email()
        .min(1),
      password: yup.string().min(6),
      tz: validateTimezone(),
      teamName: yup.string().min(1, "Team name must be at least 1 characters")
    });

    validate(data, schema);

    const { email, password = "", teamName, ...input } = data;
    const user = await UserQueries.putUser({
      email,
      password,
      ...input
    });
    const team = await TeamQueries.putTeam({ name: teamName });
    await TeamQueries.addUserToTeam({ user, team });
    user.team = team;
    return user;
  }
};

// User Helpers
export const userObject = user => {
  if (user == null) return null;

  return {
    jwt: jsonwebtoken.sign({ id: user.PK, email: user.email }, "JWTSECRET"),
    validPassword: password => bcrypt.compareSync(password, user.password),
    teamId: user.GSI2PK,
    email: user.GSI1SK,
    ...user
  };
};

export default {
  UserQueries,
  userObject
};

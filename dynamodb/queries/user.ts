import uuidv4 from "uuid/v4";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import * as yup from "yup";
import { validate, validateTimezone } from "../../lib/validate";
import {
  makeUpdateExpression,
  makeKeyConditionExpression,
  TableName,
  client as DocumentClient
} from "../helpers";
import * as Team from "./team";

export interface UserType {
  id: string;
  jwtWithOptions: (options: Record<string, string>) => string;
  validPassword: (password: string) => boolean;
  email: string;
  jwt: string;
  teamId: string;
  team: object;
}

export const fetchUserById = async (userId: string) => {
  const params = {
    TableName,
    Key: {
      PK: userId,
      SK: "user"
    }
  };
  const { Item: user } = await DocumentClient.get(params).promise();
  return userObject(user);
};
export const fetchUserByEmail = async (email: string) => {
  const params = {
    TableName,
    IndexName: "GSI1",
    ...makeKeyConditionExpression({
      GSI1PK: "user",
      GSI1SK: email
    })
  };
  const { Items = [] } = await DocumentClient.query(params).promise();
  const user = Items[0];
  return userObject(user);
};
export const createUser = async (data: Record<string, string>) => {
  await validate(data, userInputSchema);

  const { email, password = "", ...input } = data;

  const PK = uuidv4();
  const SK = "user";

  const params = {
    TableName,
    Item: {
      PK,
      SK,
      id: PK,
      GSI1PK: "user",
      GSI1SK: email,
      tz: "America/Los_Angeles",
      password: bcrypt.hashSync(password, 10),
      email,
      ...input
    }
  };

  await DocumentClient.put(params).promise();
  return fetchUserById(PK);
};
export const updateUser = async (data: Record<string, string>) => {
  await validate(data, userInputSchema);

  const { id: userId, password, ...input } = data;

  if (password != null) {
    input.password = bcrypt.hashSync(password, 10);
  }

  const params = {
    TableName,
    Key: {
      PK: userId,
      SK: "user"
    },
    ...makeUpdateExpression(input),
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: user } = await DocumentClient.update(params).promise();
  return userObject(user);
};
export const deleteUser = async ({ id: userId }: { id: string }) => {
  const params = {
    TableName,
    Key: {
      PK: userId,
      SK: "user"
    }
  };

  return DocumentClient.delete(params).promise();
};
export const createUserWithTeam = async (data: Record<string, string>) => {
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

  await validate(data, schema);

  const { email, password = "", teamName, ...input } = data;
  const user = await createUser({
    email,
    password,
    ...input
  });

  if (user != null) {
    const team = await Team.createTeam({ name: teamName });
    if (team != null) {
      await Team.addUserToTeam({ user, team });
      user.team = team;
    }
  }

  return user;
};

export const userObject = (
  user: Record<string, string> | undefined
): UserType | null => {
  if (user == null) return null;

  return {
    jwtWithOptions: (options: Record<string, string>) =>
      jsonwebtoken.sign(
        { id: user.PK, email: user.email, options },
        "JWTSECRET"
      ),
    jwt: jsonwebtoken.sign({ id: user.PK, email: user.email }, "JWTSECRET"),
    validPassword: (password: string) =>
      bcrypt.compareSync(password, user.password),
    id: user.PK,
    teamId: user.GSI2PK,
    email: user.GSI1SK,
    team: {},
    ...user
  };
};

const userInputSchema = yup.object().shape({
  name: yup.string().min(1),
  email: yup
    .string()
    .email()
    .min(1)
    .test("is-unique", "Email is taken", async value => {
      if (value == null) return true;
      const user = await fetchUserByEmail(value);
      return user == null;
    }),
  password: yup.string().min(6),
  tz: validateTimezone()
});

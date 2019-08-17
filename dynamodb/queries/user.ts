import uuidv4 from "uuid/v4";
import bcrypt from "bcryptjs";

import * as yup from "yup";
import { validate, validateTimezone } from "../../lib/validate";
import {
  makeUpdateExpression,
  makeKeyConditionExpression,
  TableName,
  client as DocumentClient
} from "../helpers";
import { makeUser } from "../make-user";
import * as Team from "./team";
import {
  CreateUserInput,
  CreateUserWithTeamInput,
  UpdateUserInput,
  User
} from "../types";

export const fetchUserById = async (userId: string): Promise<User | null> => {
  const params = {
    TableName,
    Key: {
      PK: userId,
      SK: "user"
    }
  };
  const { Item: user } = await DocumentClient.get(params).promise();
  if (user == null) return null;

  return makeUser(user as User);
};
export const fetchUserByEmail = async (email: string): Promise<User | null> => {
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
  if (user == null) return null;

  return makeUser(user as User);
};
export const createUser = async (
  data: CreateUserInput
): Promise<User | null> => {
  await validate(data, userInputSchema);

  const { email, password, ...input } = data;

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
      password: password && bcrypt.hashSync(password.toString(), 10),
      email,
      ...input
    }
  };

  await DocumentClient.put(params).promise();
  const user = fetchUserById(PK);
  return user;
};
export const updateUser = async (data: UpdateUserInput): Promise<User> => {
  await validate(data, userInputSchema);

  const { id: userId, ...input } = data;

  if (input.password != null) {
    input.password = bcrypt.hashSync(input.password.toString(), 10);
  }

  const { name, email, password, tz } = input;

  const params = {
    TableName,
    Key: {
      PK: userId,
      SK: "user"
    },
    ...makeUpdateExpression({
      name,
      email,
      password,
      tz
    }),
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: user } = await DocumentClient.update(params).promise();
  return makeUser(user as User);
};
export const deleteUser = async ({
  id: userId
}: {
  id: string;
}): Promise<User> => {
  const params = {
    TableName,
    Key: {
      PK: userId,
      SK: "user"
    }
  };

  const { Attributes: user } = await DocumentClient.delete(params).promise();
  return makeUser(user as User);
};
export const createUserWithTeam = async (
  data: CreateUserWithTeamInput
): Promise<User> => {
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

  return user as User;
};
const userInputSchema = yup.object().shape({
  name: yup.string().min(1),
  email: yup
    .string()
    .email()
    .min(1)
    .test(
      "is-unique",
      "Email is taken",
      async (value): Promise<boolean> => {
        if (value == null) return true;
        const user = await fetchUserByEmail(value);
        return user == null;
      }
    ),
  password: yup.string().min(6),
  tz: validateTimezone()
});

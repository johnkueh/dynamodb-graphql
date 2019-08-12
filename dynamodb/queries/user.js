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
  client as DocumentClient
} from "../helpers";
import * as Team from "./team";

export const fetchUserById = async userId => {
  const user = await fetchByKey({
    PK: userId,
    SK: "user"
  });
  return userObject(user);
};
export const fetchUserByEmail = async email => {
  const input = {
    GSI1PK: "user",
    GSI1SK: email
  };
  const params = {
    TableName,
    IndexName: "GSI1",
    ...objectToExpression("KeyConditionExpression", input)
  };
  const { Items } = await DocumentClient.query(params).promise();
  return userObject(Items[0]);
};
export const putUser = async data => {
  await validate(data, userInputSchema);

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

  return fetchUserById(PK);
};
export const updateUser = async data => {
  await validate(data, userInputSchema);

  const { id: userId, password, ...input } = data;
  const params = {
    PK: userId,
    SK: "user",
    input
  };

  if (password != null) {
    params.input.password = bcrypt.hashSync(password, 10);
  }

  const user = await updateByKey(params);
  return userObject(user);
};
export const deleteUser = async ({ id: userId }) => {
  await deleteByKey(userId);
  return { id: userId };
};
export const createUserWithTeam = async data => {
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
  const user = await putUser({
    email,
    password,
    ...input
  });
  const team = await Team.putTeam({ name: teamName });
  await Team.addUserToTeam({ user, team });
  user.team = team;
  return user;
};
export const userObject = user => {
  if (user == null) return null;

  return {
    jwtWithOptions: options =>
      jsonwebtoken.sign(
        { id: user.PK, email: user.email, options },
        "JWTSECRET"
      ),
    jwt: jsonwebtoken.sign({ id: user.PK, email: user.email }, "JWTSECRET"),
    validPassword: password => bcrypt.compareSync(password, user.password),
    teamId: user.GSI2PK,
    email: user.GSI1SK,
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

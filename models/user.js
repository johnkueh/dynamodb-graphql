import uuidv4 from "uuid/v4";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { dynamodb } from "../lib/dynamodb-client";
import {
  generateCRUD,
  generatedUUID,
  objectToExpression
} from "../lib/dyna-helper";

const crud = generateCRUD({
  Key: {
    PK: generatedUUID,
    SK: "user"
  }
});

export const fetchById = async id => {
  const user = await crud.fetchById(id);
  return {
    ...customFields(user),
    ...user
  };
};

export const fetchByEmail = async email => {
  const input = {
    GSI1PK: "user",
    GSI1SK: email
  };
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: "GSI1",
    ...objectToExpression("KeyConditionExpression", input)
  };

  const { Items } = await dynamodb.query(params).promise();
  const user = Items[0];

  if (user == null) return null;

  return {
    ...customFields(user),
    ...user
  };
};

export const create = async ({ name, email, password }) => {
  const user = await crud.create({
    name,
    email,
    GSI1PK: "user",
    GSI1SK: email,
    tz: "America/Los_Angeles",
    password: bcrypt.hashSync(password, 10)
  });
  return {
    ...customFields(user),
    ...user
  };
};

export const update = async input => {
  const user = await crud.update(input);
  return {
    ...customFields(user),
    ...user
  };
};

export const destroy = async id => {
  await crud.delete(id);

  return {
    id
  };
};

const customFields = user => ({
  jwt: jsonwebtoken.sign({ id: user.PK, email: user.email }, "JWTSECRET"),
  validPassword: password => bcrypt.compareSync(password, user.password),
  teamId: user.GSI2SK
});

export default {
  fetchById,
  fetchByEmail,
  create,
  update,
  destroy
};

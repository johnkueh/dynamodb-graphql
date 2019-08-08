import AWS from "aws-sdk";
import uuidv4 from "uuid/v4";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { dynamodb } from "../lib/dynamodb-client";

export const getById = async id => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: id,
      SK: "user"
    }
  };
  const { Item: user } = await dynamodb.get(params).promise();

  if (user == null) return null;

  return userObject(user);
};

export const getByEmail = async email => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :type and GSI1SK = :email",
    ExpressionAttributeValues: {
      ":type": "user",
      ":email": email
    }
  };

  const { Items } = await dynamodb.query(params).promise();
  const user = Items[0];

  if (user == null) return null;

  return userObject(user);
};

export const create = async ({ name, email, password }) => {
  const id = uuidv4();
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: id,
      SK: "user",
      GSI1PK: "user",
      GSI1SK: email,
      id,
      name,
      email,
      tz: "America/Los_Angeles",
      password: bcrypt.hashSync(password, 10)
    }
  };
  await dynamodb.put(params).promise();
  const user = await getById(id);
  return user;
};

export const update = async input => {
  const updateKeys = Object.keys(input);
  const updateExpressions = [];
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};
  updateKeys.forEach(key => {
    updateExpressions.push(`#${key} = :${key}`);
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = input[key];
  });
  const UpdateExpression = `set ${updateExpressions.join(", ")}`;

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: input.id,
      SK: "user"
    },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: user } = await dynamodb.update(params).promise();
  return user;
};

export const destroy = async id => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: id,
      SK: "user"
    }
  };

  await dynamodb.delete(params).promise();
  return {
    id
  };
};

const getJwt = ({ id, email }) => {
  return jsonwebtoken.sign({ id, email }, "JWTSECRET");
};
const validPassword = (password, hashedPassword) =>
  bcrypt.compareSync(password, hashedPassword);
const userObject = user => ({
  jwt: getJwt({ id: user.PK, email: user.email }),
  validPassword: password => validPassword(password, user.password),
  teamId: user.GSI2SK,
  ...user
});

export default {
  getById,
  getByEmail,
  create,
  update,
  destroy
};

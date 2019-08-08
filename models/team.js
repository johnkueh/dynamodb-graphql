import uuidv4 from "uuid/v4";
import { dynamodb } from "../lib/dynamodb-client";

export const getById = async id => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: id,
      SK: "team"
    }
  };
  const { Item: team } = await dynamodb.get(params).promise();

  if (team == null) return null;

  return team;
};

export const create = async ({ name }) => {
  const id = uuidv4();
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: id,
      SK: "team",
      id,
      name
    }
  };
  await dynamodb.put(params).promise();
  const team = await getById(id);
  return team;
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
      SK: "team"
    },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: team } = await dynamodb.update(params).promise();
  return team;
};

export const getUsers = async id => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: "GSI2",
    KeyConditionExpression: "GSI2PK = :type and GSI2SK = :teamId",
    ExpressionAttributeValues: {
      ":type": "teamUser",
      ":teamId": id
    }
  };

  const { Items } = await dynamodb.query(params).promise();
  return Items;
};

export const addUser = async ({ teamId, userId }) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: userId,
      SK: "user"
    },
    UpdateExpression: "set #GSI2PK = :GSI2PK, #GSI2SK = :GSI2SK",
    ExpressionAttributeNames: {
      "#GSI2PK": "GSI2PK",
      "#GSI2SK": "GSI2SK"
    },
    ExpressionAttributeValues: {
      ":GSI2PK": "teamUser",
      ":GSI2SK": teamId
    },
    ReturnValues: "ALL_NEW"
  };
  const { Attributes: user } = await dynamodb.update(params).promise();
  return user;
};

export default {
  getById,
  create,
  update,
  getUsers,
  addUser
};

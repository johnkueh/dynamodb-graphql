import { dynamodb } from "../lib/dynamodb-client";

export const TableName = process.env.DYNAMODB_TABLE;
export const client = dynamodb;

// DynamoDB Helpers
export const fetchByKey = async ({ PK, SK }) => {
  const params = {
    TableName,
    Key: {
      PK,
      SK
    }
  };
  const { Item: object } = await dynamodb.get(params).promise();
  if (object == null) return null;
  return object;
};

export const putByKey = async ({ PK, SK, input }) => {
  const params = {
    TableName,
    Item: {
      PK,
      SK,
      id: PK,
      ...input
    }
  };
  return dynamodb.put(params).promise();
};

export const putAndFetchByKey = async ({ PK, SK, input }) => {
  await putByKey({
    PK,
    SK,
    input
  });
  return fetchByKey({
    PK,
    SK
  });
};

export const updateByKey = async ({ PK, SK, input }) => {
  const params = {
    TableName,
    Key: {
      PK,
      SK
    },
    ...objectToExpression("UpdateExpression", input),
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: object } = await dynamodb.update(params).promise();
  return object;
};

export const deleteByKey = async ({ PK, SK }) => {
  const params = {
    TableName,
    Key: {
      PK,
      SK
    }
  };

  return dynamodb.delete(params).promise();
};

export const objectToExpression = (type, input) => {
  const keys = Object.keys(input);
  const expressions = [];
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};
  keys.forEach(key => {
    expressions.push(`#${key} = :${key}`);
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = input[key];
  });

  let Expression = ``;

  switch (type) {
    case "UpdateExpression":
      Expression = `set ${expressions.join(", ")}`;
      break;
    case "KeyConditionExpression":
      Expression = `${expressions.join(" and ")}`;
      break;
    default:
  }

  return {
    [type]: Expression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};

export default {
  fetchByKey,
  putByKey,
  putAndFetchByKey,
  updateByKey,
  deleteByKey,
  objectToExpression
};

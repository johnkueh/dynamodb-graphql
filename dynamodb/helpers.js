import { DocumentClient } from "../lib/dynamodb-client";

export const TableName = process.env.DYNAMODB_TABLE;
export const client = DocumentClient;
export const makeUpdateExpression = input => {
  const keys = Object.keys(input);
  const expressions = [];
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};
  keys.forEach(key => {
    expressions.push(`#${key} = :${key}`);
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = input[key];
  });

  const UpdateExpression = `set ${expressions.join(", ")}`;
  return {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};
export const makeKeyConditionExpression = input => {
  const keys = Object.keys(input);
  const expressions = [];
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};
  keys.forEach(key => {
    expressions.push(`#${key} = :${key}`);
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = input[key];
  });

  const KeyConditionExpression = `${expressions.join(" and ")}`;
  return {
    KeyConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};

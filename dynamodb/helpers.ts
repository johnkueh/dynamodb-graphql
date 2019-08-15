import { DocumentClient } from "../lib/dynamodb-client";

interface InputObject {
  [key: string]: string;
}

export const TableName = process.env.DYNAMODB_TABLE || "dynamodb-table";
export const client = DocumentClient;
export const makeUpdateExpression = (input: InputObject) => {
  const keys = Object.keys(input);
  const expressions = [] as Array<String>;
  const ExpressionAttributeNames = {} as Record<string, string>;
  const ExpressionAttributeValues = {} as Record<string, string>;
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
export const makeKeyConditionExpression = (input: InputObject) => {
  const keys = Object.keys(input);
  const expressions = [] as Array<String>;
  const ExpressionAttributeNames = {} as Record<string, string>;
  const ExpressionAttributeValues = {} as Record<string, string>;
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

import { DocumentClient } from "../lib/dynamodb-client";
import { Input } from "./types";

interface ExpressionAttributeNames {
  [key: string]: string;
}
interface ExpressionAttributeValues {
  [key: string]: string | boolean | number;
}

export const TableName = process.env.DYNAMODB_TABLE || "dynamodb-table";
export const client = DocumentClient;
export const makeUpdateExpression = (input: Input) => {
  const keys = Object.keys(input);
  const expressions = [] as Array<String>;
  const ExpressionAttributeNames = {} as ExpressionAttributeNames;
  const ExpressionAttributeValues = {} as ExpressionAttributeValues;
  keys.forEach(key => {
    const inputKey = input[key];
    if (inputKey != null) {
      expressions.push(`#${key} = :${key}`);
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = inputKey;
    }
  });

  const UpdateExpression = `set ${expressions.join(", ")}`;
  return {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};
export const makeKeyConditionExpression = (input: Input) => {
  const keys = Object.keys(input);
  const expressions = [] as Array<String>;
  const ExpressionAttributeNames = {} as ExpressionAttributeNames;
  const ExpressionAttributeValues = {} as ExpressionAttributeValues;
  keys.forEach(key => {
    const inputKey = input[key];
    if (inputKey != null) {
      expressions.push(`#${key} = :${key}`);
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = inputKey;
    }
  });

  const KeyConditionExpression = `${expressions.join(" and ")}`;
  return {
    KeyConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};

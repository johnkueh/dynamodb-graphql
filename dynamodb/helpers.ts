import { DocumentClient } from "../lib/dynamodb-client";

interface ExpressionInput {
  [key: string]: string | boolean | null | undefined;
}

interface ExpressionAttributeNames {
  [key: string]: string;
}
interface ExpressionAttributeValues {
  [key: string]: string | boolean | number;
}

interface ExpressionAttributesObject {
  ExpressionAttributeNames: ExpressionAttributeNames;
  ExpressionAttributeValues: ExpressionAttributeValues;
}

interface ExpressionObject extends ExpressionAttributesObject {
  expressions: string[];
}

interface UpdateExpressionObject extends ExpressionAttributesObject {
  UpdateExpression: string;
}

interface KeyConditionExpressionObject extends ExpressionAttributesObject {
  KeyConditionExpression: string;
}

export const TableName = process.env.DYNAMODB_TABLE || "dynamodb-table";
export const client = DocumentClient;

const makeExpressions = (input: ExpressionInput): ExpressionObject => {
  const keys = Object.keys(input);
  const expressions: string[] = [];
  const ExpressionAttributeNames: ExpressionAttributeNames = {};
  const ExpressionAttributeValues: ExpressionAttributeValues = {};
  keys.forEach((key): void => {
    const inputKey = input[key];
    if (inputKey != null) {
      expressions.push(`#${key} = :${key}`);
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = inputKey;
    }
  });

  return {
    expressions,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};
export const makeUpdateExpression = (
  input: ExpressionInput
): UpdateExpressionObject => {
  const {
    expressions,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  } = makeExpressions(input);
  const UpdateExpression = `set ${expressions.join(", ")}`;

  return {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};
export const makeKeyConditionExpression = (
  input: ExpressionInput
): KeyConditionExpressionObject => {
  const {
    expressions,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  } = makeExpressions(input);

  const KeyConditionExpression = `${expressions.join(" and ")}`;
  return {
    KeyConditionExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  };
};

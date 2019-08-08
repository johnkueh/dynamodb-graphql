import * as yup from "yup";
import capitalize from "lodash/capitalize";
import moment from "moment-timezone";
import { DocumentClient } from "../lib/dynamodb-client";
import ValidationErrors from "../lib/validation-errors";

export const TableName = process.env.DYNAMODB_TABLE;
export const client = DocumentClient;

// DynamoDB Helpers
export const fetchByKey = async ({ PK, SK }) => {
  const params = {
    TableName,
    Key: {
      PK,
      SK
    }
  };
  const { Item: object } = await DocumentClient.get(params).promise();
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
  return DocumentClient.put(params).promise();
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

  const { Attributes: object } = await DocumentClient.update(params).promise();
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

  return DocumentClient.delete(params).promise();
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

export const validate = async (data, schema) => {
  try {
    await schema.validate(data, { abortEarly: false });
  } catch (error) {
    const { name, inner } = error;
    const errors = {};
    inner.forEach(({ path, message }) => {
      errors[path] = capitalize(message);
    });
    throw ValidationErrors(errors);
  }
};

export const validateTimezone = () =>
  yup.string().test("is-valid", "Timezone is not valid", value => {
    // Dont run the test if value is undefined
    if (value == null) return true;

    return moment.tz.names().find(name => name === value);
  });

export default {
  fetchByKey,
  putByKey,
  putAndFetchByKey,
  updateByKey,
  deleteByKey,
  objectToExpression,
  validate,
  validateTimezone
};

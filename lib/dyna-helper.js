import uuidv4 from "uuid/v4";
import { dynamodb } from "./dynamodb-client";

export const generatedUUID = {
  key: "id",
  type: "generatedUUID"
};

export const generateCRUD = mapping => {
  const fetchById = async id => {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: id,
        SK: mapping.Key.SK
      }
    };
    const { Item: object } = await dynamodb.get(params).promise();
    if (object == null) return null;
    return object;
  };
  const create = async input => {
    const generatedUUID = uuidv4();
    const PK =
      mapping.Key.PK.type === "generatedUUID"
        ? generatedUUID
        : input[mapping.Key.PK];
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        PK,
        SK: mapping.Key.SK,
        id: PK,
        ...input
      }
    };
    await dynamodb.put(params).promise();
    const user = await fetchById(PK);
    return user;
  };
  return {
    fetchById,
    create,
    update: async input => {
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          PK: input.id,
          SK: mapping.Key.SK
        },
        ...objectToExpression("UpdateExpression", input),
        ReturnValues: "ALL_NEW"
      };

      const { Attributes: object } = await dynamodb.update(params).promise();
      return object;
    },
    delete: async id => {
      const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          PK: id,
          SK: mapping.Key.SK
        }
      };

      await dynamodb.delete(params).promise();
      return {
        id
      };
    }
  };
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

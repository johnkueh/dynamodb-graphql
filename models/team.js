import { dynamodb } from "../lib/dynamodb-client";
import { generateCRUD, generatedUUID } from "../lib/dyna-helper";

const crud = generateCRUD({
  Key: {
    PK: generatedUUID,
    SK: "team"
  }
});

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
  ...crud,
  getUsers,
  addUser
};

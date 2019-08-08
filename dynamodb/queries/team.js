import uuidv4 from "uuid/v4";
import moment from "moment";
import {
  fetchByKey,
  putAndFetchByKey,
  updateByKey,
  deleteByKey,
  TableName,
  client as DocumentClient
} from "../helpers";
import { userObject } from "./user";

export const TeamQueries = {
  fetchTeamById: async teamId => {
    return fetchByKey({
      PK: teamId,
      SK: "team"
    });
  },
  putTeam: async input => {
    const PK = uuidv4();
    const SK = "team";
    return putAndFetchByKey({
      PK,
      SK,
      input
    });
  },
  updateTeam: ({ id: teamId, ...input }) => {
    return updateByKey({
      PK: teamId,
      SK: "team",
      input
    });
  },
  deleteTeam: async ({ id: teamId }) => {
    await deleteByKey(teamId);
    return { id: teamId };
  },
  fetchTeamUsers: async ({ teamId }) => {
    const params = {
      TableName,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :teamId",
      ExpressionAttributeValues: {
        ":teamId": teamId
      }
    };

    const { Items } = await DocumentClient.query(params).promise();
    return Items;
  },
  addUserToTeam: async ({ user, team }) => {
    const params = {
      TableName,
      Key: {
        PK: user.id,
        SK: "user"
      },
      UpdateExpression: "set #GSI2PK = :GSI2PK, #GSI2SK = :GSI2SK",
      ExpressionAttributeNames: {
        "#GSI2PK": "GSI2PK",
        "#GSI2SK": "GSI2SK"
      },
      ExpressionAttributeValues: {
        ":GSI2PK": team.id,
        ":GSI2SK": moment().toISOString()
      },
      ReturnValues: "ALL_NEW"
    };
    const { Attributes } = await DocumentClient.update(params).promise();
    user.teamId = team.id;
    return Attributes;
  },
  removeUserFromTeam: async ({ userId, teamId }) => {
    const params = {
      TableName,
      Key: {
        PK: userId,
        SK: "user"
      },
      UpdateExpression: "remove GSI2PK, GSI2SK",
      ReturnValues: "ALL_NEW"
    };
    const { Attributes } = await DocumentClient.update(params).promise();
    return userObject(Attributes);
  }
};

export default {
  TeamQueries
};

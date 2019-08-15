import uuidv4 from "uuid/v4";
import moment from "moment";
import {
  makeUpdateExpression,
  makeKeyConditionExpression,
  TableName,
  client as DocumentClient
} from "../helpers";
import { userObject, UserType } from "./user";

interface Team extends Record<string, string> {}

interface AddUserToTeamInput {
  user: UserType;
  team: Team;
}

export const fetchTeamById = async (teamId: string) => {
  const params = {
    TableName,
    Key: {
      PK: teamId,
      SK: "team"
    }
  };
  const { Item: object } = await DocumentClient.get(params).promise();
  return object;
};
export const createTeam = async (data: Record<string, string>) => {
  const uuid = uuidv4();
  const params = {
    TableName,
    Item: {
      PK: uuid,
      SK: "team",
      id: uuid,
      ...data
    }
  };

  await DocumentClient.put(params).promise();
  return fetchTeamById(uuid);
};
export const updateTeam = async (data: Record<string, string>) => {
  const { id: teamId, ...input } = data;
  const params = {
    TableName,
    Key: {
      PK: teamId,
      SK: "team"
    },
    ...makeUpdateExpression(input),
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: object } = await DocumentClient.update(params).promise();
  return object;
};
export const deleteTeam = async ({ id: teamId }: { id: string }) => {
  const params = {
    TableName,
    Key: {
      PK: teamId,
      SK: "team"
    }
  };

  return DocumentClient.delete(params).promise();
};
export const fetchTeamUsers = async ({ teamId }: { teamId: string }) => {
  const params = {
    TableName,
    IndexName: "GSI2",
    ...makeKeyConditionExpression({
      GSI2PK: teamId
    })
  };

  const { Items } = await DocumentClient.query(params).promise();
  return Items;
};
export const addUserToTeam = async ({ user, team }: AddUserToTeamInput) => {
  const params = {
    TableName,
    Key: {
      PK: user.id,
      SK: "user"
    },
    ...makeUpdateExpression({
      GSI2PK: team.id,
      GSI2SK: moment().toISOString()
    }),
    ReturnValues: "ALL_NEW"
  };
  const { Attributes } = await DocumentClient.update(params).promise();
  user.teamId = team.id;
  user.team = team;
  return Attributes;
};
export const removeUserFromTeam = async ({ userId }: { userId: string }) => {
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
};

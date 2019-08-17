import uuidv4 from "uuid/v4";
import ValidationErrors from "../../lib/validation-errors";
import {
  TableName,
  makeKeyConditionExpression,
  client as DocumentClient
} from "../helpers";
import {
  Culture,
  CultureInput,
  AddCultureToTeamInput,
  AddCulturesToTeamInput,
  RemoveCultureInput
} from "../types";

export const fetchCultureById = async (cultureId: string): Promise<Culture> => {
  const params = {
    TableName,
    Key: {
      PK: cultureId,
      SK: "culture"
    }
  };
  const { Item: object } = await DocumentClient.get(params).promise();
  return object as Culture;
};
export const createCulture = async (input: CultureInput): Promise<Culture> => {
  const { name, position } = input;
  const uuid = uuidv4();
  const SK = "culture";

  const params = {
    TableName,
    Item: {
      PK: uuid,
      SK,
      id: uuid,
      GSI1PK: "culture",
      GSI1SK: `${position}|${name}|`,
      ...input
    }
  };
  await DocumentClient.put(params).promise();
  return fetchCultureById(uuid);
};
export const fetchCultures = async (): Promise<Culture[]> => {
  const params = {
    TableName,
    IndexName: "GSI1",
    ...makeKeyConditionExpression({
      GSI1PK: "culture"
    })
  };

  const { Items } = await DocumentClient.query(params).promise();
  return Items as Culture[];
};
export const fetchCultureForTeam = async (
  teamId: string
): Promise<Culture[]> => {
  const params = {
    TableName,
    KeyConditionExpression: "#PK = :PK AND begins_with(#SK, :SK)",
    ExpressionAttributeNames: {
      "#PK": "PK",
      "#SK": "SK"
    },
    ExpressionAttributeValues: {
      ":PK": teamId,
      ":SK": "teamCulture|"
    }
  };

  const { Items } = await DocumentClient.query(params).promise();
  return Items as Culture[];
};
export const addCultureToTeam = async (
  input: AddCultureToTeamInput
): Promise<void> => {
  const { cultureId, teamId, position } = input;
  const culture = await fetchCultureById(cultureId);

  if (culture == null)
    throw ValidationErrors({
      culture: "Culture not found"
    });

  const PK = teamId;

  const params = {
    TableName,
    Item: {
      PK,
      SK: `teamCulture|${position}|${culture.id}`,
      id: PK,
      name: culture.name,
      ...input
    }
  };
  await DocumentClient.put(params).promise();
};
export const addCulturesToTeam = async ({
  cultureIds,
  teamId
}: AddCulturesToTeamInput): Promise<void> => {
  await Promise.all(
    cultureIds.map(
      (cultureId, idx): Promise<void> => {
        return addCultureToTeam({
          cultureId,
          teamId,
          position: idx + 1
        });
      }
    )
  );
};
export const removeCultureFromTeam = async (
  input: RemoveCultureInput
): Promise<void> => {
  const { cultureId, teamId, position } = input;
  const params = {
    TableName,
    Key: {
      PK: teamId,
      SK: `teamCulture|${position}|${cultureId}`
    }
  };

  await DocumentClient.delete(params).promise();
};
export const removeCulturesFromTeam = async (teamId: string): Promise<void> => {
  const teamCultureValues = await fetchCultureForTeam(teamId);

  await Promise.all(
    teamCultureValues.map(
      ({ cultureId, position }): Promise<void> => {
        return removeCultureFromTeam({
          cultureId,
          position,
          teamId
        });
      }
    )
  );
};

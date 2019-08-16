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
  AddCultureInput,
  RemoveCultureInput,
  AddCulturesInput
} from "../types";

export const fetchCultureById = async (cultureId: string) => {
  const params = {
    TableName,
    Key: {
      PK: cultureId,
      SK: "culture"
    }
  };
  const { Item: object } = await DocumentClient.get(params).promise();
  return object;
};
export const createCulture = async (input: CultureInput) => {
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
export const fetchCultures = async () => {
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
export const fetchCultureForTeam = async (teamId: string) => {
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
export const addCultureToTeam = async (input: AddCultureInput) => {
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
  return DocumentClient.put(params).promise();
};
export const addCulturesToTeam = async ({
  cultureIds,
  teamId
}: AddCulturesInput) => {
  await Promise.all(
    cultureIds.map((cultureId, idx) => {
      return addCultureToTeam({
        cultureId,
        teamId,
        position: idx + 1
      });
    })
  );
};
export const removeCultureFromTeam = async (input: RemoveCultureInput) => {
  const { cultureId, teamId, position } = input;
  const params = {
    TableName,
    Key: {
      PK: teamId,
      SK: `teamCulture|${position}|${cultureId}`
    }
  };

  return DocumentClient.delete(params).promise();
};
export const removeCulturesFromTeam = async (teamId: string) => {
  const teamCultureValues = await fetchCultureForTeam(teamId);

  if (teamCultureValues == null) return;

  await Promise.all(
    teamCultureValues.map(({ cultureId, position }) => {
      return removeCultureFromTeam({
        cultureId,
        position,
        teamId
      });
    })
  );
};

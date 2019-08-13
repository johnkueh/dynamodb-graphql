import uuidv4 from "uuid/v4";
import {
  TableName,
  makeKeyConditionExpression,
  client as DocumentClient
} from "../helpers";

export const fetchCultureById = async cultureId => {
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

export const createCulture = async input => {
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
export const fetchCultures = async data => {
  const params = {
    TableName,
    IndexName: "GSI1",
    ...makeKeyConditionExpression({
      GSI1PK: "culture"
    })
  };

  const { Items } = await DocumentClient.query(params).promise();
  return Items;
};
export const fetchCultureForTeam = async teamId => {
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
  return Items;
};
export const addCultureToTeam = async input => {
  const { cultureId, teamId, position } = input;
  const culture = await fetchCultureById(cultureId);
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
export const addCulturesToTeam = async ({ cultureIds, teamId }) => {
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
export const removeCultureFromTeam = async input => {
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
export const removeCulturesFromTeam = async teamId => {
  const teamCultureValues = await fetchCultureForTeam(teamId);
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

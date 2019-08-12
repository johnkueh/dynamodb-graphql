import uuidv4 from "uuid/v4";
import * as yup from "yup";
import {
  fetchByKey,
  putByKey,
  putAndFetchByKey,
  updateByKey,
  deleteByKey,
  TableName,
  validate,
  client as DocumentClient
} from "../helpers";

export const putCulture = async input => {
  const { name, position } = input;
  const PK = uuidv4();
  const SK = "culture";
  return putAndFetchByKey({
    PK,
    SK,
    input: {
      GSI1PK: "culture",
      GSI1SK: `${position}|${name}|`,
      ...input
    }
  });
};
export const fetchCultureById = async cultureId => {
  return fetchByKey({
    PK: cultureId,
    SK: "culture"
  });
};
export const fetchCultures = async data => {
  const params = {
    TableName,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :type",
    ExpressionAttributeValues: {
      ":type": "culture"
    }
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
  return putByKey({
    PK: teamId,
    SK: `teamCulture|${position}|${culture.id}`,
    input: {
      cultureId: culture.id,
      name: culture.name,
      position
    }
  });
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
  return deleteByKey({
    PK: teamId,
    SK: `teamCulture|${position}|${cultureId}`
  });
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

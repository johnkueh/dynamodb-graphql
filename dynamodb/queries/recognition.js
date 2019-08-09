import uuidv4 from "uuid/v4";
import moment from "moment";
import {
  fetchByKey,
  putByKey,
  putAndFetchByKey,
  updateByKey,
  deleteByKey,
  TableName,
  client as DocumentClient
} from "../helpers";

export const Queries = {
  putCulture: async input => {
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
  },
  fetchCultureById: async cultureId => {
    return fetchByKey({
      PK: cultureId,
      SK: "culture"
    });
  },
  fetchCultures: async data => {
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
  },
  culture: {
    fetchForTeam: async teamId => {
      const params = {
        TableName,
        KeyConditionExpression: "#PK = :PK AND begins_with(#SK, :SK)",
        ExpressionAttributeNames: {
          "#PK": "PK",
          "#SK": "SK"
        },
        ExpressionAttributeValues: {
          ":PK": teamId,
          ":SK": "culture|"
        }
      };

      const { Items } = await DocumentClient.query(params).promise();
      return Items;
    },
    addToTeam: async input => {
      const { cultureId, teamId, position } = input;
      const culture = await Queries.fetchCultureById(cultureId);
      return putByKey({
        PK: teamId,
        SK: `culture|${position}`,
        input: {
          id: cultureId,
          name: culture.name
        }
      });
    },
    removeFromTeam: async input => {
      const { position, teamId } = input;
      return deleteByKey({
        PK: teamId,
        SK: `culture|${position}`
      });
    }
  },
  responses: {
    fetchCountsForAllCultures: async () => {},
    fetchCountsForTeamCultures: async teamId => {},
    fetchCountsForUserCultures: async userId => {},
    fetchCountForCultureId: async cultureId => {},

    fetchCountsForAllEmojis: async () => {},
    fetchCountsForTeamEmojis: async teamId => {},
    fetchCountsForUserEmojis: async userId => {},
    fetchCountForEmoji: async emoji => {}
  }
};

export default {
  Queries
};

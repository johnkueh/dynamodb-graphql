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
          ":SK": "teamCulture|"
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
        SK: `teamCulture|${position}|${culture.id}`,
        input: {
          cultureId: culture.id,
          name: culture.name,
          position
        }
      });
    },
    addAllToTeam: async ({ cultureIds, teamId }) => {
      await Promise.all(
        cultureIds.map((cultureId, idx) => {
          return Queries.culture.addToTeam({
            cultureId,
            teamId,
            position: idx + 1
          });
        })
      );
    },
    removeAllFromTeam: async teamId => {
      const teamCultureValues = await Queries.culture.fetchForTeam(teamId);
      await Promise.all(
        teamCultureValues.map(({ cultureId, position }) => {
          return Queries.culture.removeFromTeam({
            cultureId,
            position,
            teamId
          });
        })
      );
    },
    removeFromTeam: async input => {
      const { cultureId, teamId, position } = input;
      return deleteByKey({
        PK: teamId,
        SK: `teamCulture|${position}|${cultureId}`
      });
    }
  },
  responses: {
    // fetchCountsForAllCultures: async () => {},
    // fetchCountsForTeamCultures: async teamId => {},
    // fetchCountsForUserCultures: async userId => {},
    // fetchCountForCultureId: async cultureId => {},

    // fetchCountsForAllEmojis: async () => {},
    // fetchCountsForTeamEmojis: async teamId => {},
    // fetchCountsForUserEmojis: async userId => {},
    // fetchCountForEmoji: async emoji => {}
    fetchById: async () => {},
    put: async data => {
      const { userId, teamId, sentAt, ...input } = data;
      const PK = uuidv4();
      const SK = `response`;
      return putAndFetchByKey({
        PK,
        SK,
        input: {
          GSI1PK: `response_${teamId}`,
          GSI1SK: sentAt,
          GSI2PK: `response_${userId}`,
          GSI2SK: sentAt,
          sentAt,
          userId,
          teamId,
          ...input
        }
      });
    },
    update: async () => {},
    user: {
      fetchByDateRange: async ({ userId, fromDate, toDate }) => {}
    },
    team: {
      fetchByDateRange: async ({ teamId, fromDate, toDate }) => {
        const params = {
          TableName,
          IndexName: "GSI1",
          KeyConditionExpression:
            "GSI1PK = :teamResponseId AND GSI1SK between :fromDate AND :toDate",
          ExpressionAttributeValues: {
            ":teamResponseId": `response_${teamId}`,
            ":fromDate": fromDate,
            ":toDate": toDate
          }
        };

        const { Items } = await DocumentClient.query(params).promise();
        // console.log(Items);
        return Items;
      }
    }
  }
};

export default {
  Queries
};

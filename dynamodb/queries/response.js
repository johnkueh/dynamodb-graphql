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

export const fetchResponseById = async responseId => {
  return fetchByKey({
    PK: responseId,
    SK: "response"
  });
};
export const putResponse = async data => {
  const { userId, teamId, sentAt, ...input } = data;
  const PK = uuidv4();
  const SK = `response`;
  return putAndFetchByKey({
    PK,
    SK,
    input: {
      GSI1PK: `response|${teamId}`,
      GSI1SK: sentAt,
      GSI2PK: `response|${userId}`,
      GSI2SK: sentAt,
      sentAt,
      userId,
      teamId,
      ...input
    }
  });
};
export const updateResponse = async ({ id: responseId, ...input }) => {
  const schema = yup.object().shape({
    feeling: yup.string().oneOf(["HAPPY", "NEUTRAL", "SAD"])
  });

  await validate(input, schema);

  return updateByKey({
    PK: responseId,
    SK: "response",
    input
  });
};
export const fetchResponsesForUserByDateRange = async ({
  userId,
  fromDate,
  toDate
}) => {};
export const fetchResponsesForTeamByDateRange = async ({
  teamId,
  fromDate,
  toDate
}) => {
  const params = {
    TableName,
    IndexName: "GSI1",
    KeyConditionExpression:
      "GSI1PK = :teamResponseId AND GSI1SK between :fromDate AND :toDate",
    ExpressionAttributeValues: {
      ":teamResponseId": `response|${teamId}`,
      ":fromDate": fromDate,
      ":toDate": toDate
    }
  };

  const { Items } = await DocumentClient.query(params).promise();
  return Items;
};

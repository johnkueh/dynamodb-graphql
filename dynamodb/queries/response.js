import uuidv4 from "uuid/v4";
import * as yup from "yup";
import { validate } from "../../lib/validate";
import {
  TableName,
  makeUpdateExpression,
  client as DocumentClient
} from "../helpers";

export const fetchResponseById = async responseId => {
  const params = {
    TableName,
    Key: {
      PK: responseId,
      SK: "response"
    }
  };
  const { Item: object } = await DocumentClient.get(params).promise();
  return object;
};
export const putResponse = async data => {
  const { userId, teamId, sentAt, ...input } = data;
  const PK = uuidv4();
  const SK = "response";
  const params = {
    TableName,
    Item: {
      PK,
      SK,
      id: PK,
      GSI1PK: `${SK}|${teamId}`,
      GSI1SK: sentAt,
      GSI2PK: `${SK}|${userId}`,
      GSI2SK: sentAt,
      sentAt,
      userId,
      teamId,
      ...input
    }
  };
  await DocumentClient.put(params).promise();
  return fetchResponseById(PK);
};
export const updateResponse = async ({ id: responseId, ...input }) => {
  const schema = yup.object().shape({
    feeling: yup.string().oneOf(["HAPPY", "NEUTRAL", "SAD"])
  });

  await validate(input, schema);

  const params = {
    TableName,
    Key: {
      PK: responseId,
      SK: "response"
    },
    ...makeUpdateExpression(input),
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: object } = await DocumentClient.update(params).promise();
  return object;
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

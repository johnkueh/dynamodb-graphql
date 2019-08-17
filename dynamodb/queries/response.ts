import uuidv4 from "uuid/v4";
import * as yup from "yup";
import { validate } from "../../lib/validate";
import {
  TableName,
  makeUpdateExpression,
  client as DocumentClient
} from "../helpers";
import {
  Response,
  CreateResponseInput,
  UpdateResponseInput,
  FetchResponsesForTeamByDateRangeInput
} from "../types";

export const fetchResponseById = async (
  responseId: string
): Promise<Response> => {
  const params = {
    TableName,
    Key: {
      PK: responseId,
      SK: "response"
    }
  };
  const { Item: object } = await DocumentClient.get(params).promise();
  return object as Response;
};
export const createResponse = async (
  data: CreateResponseInput
): Promise<Response> => {
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
export const updateResponse = async (
  data: UpdateResponseInput
): Promise<Response> => {
  const { id: responseId, ...input } = data;

  const schema = yup.object().shape({
    feeling: yup.string().oneOf(["HAPPY", "NEUTRAL", "SAD"])
  });

  await validate(input, schema);

  const { sentAt, submittedAt, feeling } = input;

  const params = {
    TableName,
    Key: {
      PK: responseId,
      SK: "response"
    },
    ...makeUpdateExpression({
      sentAt,
      submittedAt,
      feeling
    }),
    ReturnValues: "ALL_NEW"
  };

  const { Attributes: object } = await DocumentClient.update(params).promise();
  return object as Response;
};
export const fetchResponsesForTeamByDateRange = async (
  input: FetchResponsesForTeamByDateRangeInput
): Promise<Response[]> => {
  const { teamId, fromDate, toDate } = input;
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
  return Items as Response[];
};

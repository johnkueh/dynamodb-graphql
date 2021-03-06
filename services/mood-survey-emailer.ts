import { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";
import AWS from "aws-sdk";
import moment from "moment";
import { SES } from "../lib/ses-client";
import { Queries } from "../dynamodb/queries";

interface HandlerResponse {
  statusCode: number;
  body: string;
}

export const handler = async (
  event: DynamoDBStreamEvent
): Promise<HandlerResponse> => {
  await Promise.all(
    event.Records.map((record): Promise<void> => processRecord(record))
  );
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Success"
    })
  };
};

const processRecord = async (record: DynamoDBRecord): Promise<void> => {
  const { eventName, dynamodb } = record;

  if (dynamodb == null) return;
  if (dynamodb.NewImage == null) return;

  const { userId, teamId, PK, SK } = AWS.DynamoDB.Converter.unmarshall(
    dynamodb.NewImage
  );

  if (eventName !== "INSERT") return;
  if (!userId || !teamId || !PK || !SK) return;
  if (!SK.includes("response")) return;

  const user = await Queries.fetchUserById(userId);
  const team = await Queries.fetchTeamById(teamId);

  if (team == null || user == null) return;

  const params = {
    Destination: {
      ToAddresses: [user.email]
    },
    Source: "Vibejar <support@vibejar.com>",
    Template: "DailyMoodSurveyEmailTemplate",
    TemplateData: JSON.stringify({
      companyName: team.name
    })
  };

  await SES.sendTemplatedEmail(params).promise();
  await Queries.updateResponse({
    id: PK,
    sentAt: moment().toISOString()
  });
};

export default {
  handler
};

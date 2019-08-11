import AWS from "aws-sdk";
import moment from "moment";
import { SES } from "../lib/ses-client";
import { Queries } from "../dynamodb/queries";

export const handler = async event => {
  await Promise.all(event.Records.map(record => processRecord(record)));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Success"
    })
  };
};

const processRecord = async record => {
  const { eventName, eventSource, dynamodb } = record;
  if (eventName === "INSERT") {
    const record = AWS.DynamoDB.Converter.unmarshall(dynamodb.NewImage);
    const { userId, teamId, PK } = record;
    const user = await Queries.fetchUserById(userId);
    const team = await Queries.fetchTeamById(teamId);
    const params = {
      Destination: {
        ToAddresses: [user.email]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `How was work at ${team.name} today? Rate your day`
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "[Test] How was work today?"
        }
      },
      Source: "Vibejar <support@vibejar.com>"
    };

    await SES.sendEmail(params).promise();
    await Queries.responses.update({
      id: PK,
      sentAt: moment().toISOString()
    });
  }
};

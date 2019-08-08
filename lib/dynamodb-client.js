import AWS from "aws-sdk";

const local = process.env.IS_OFFLINE || process.env.NODE_ENV === "test";

AWS.config.update(
  local
    ? {
        region: "local",
        endpoint: "http://localhost:8000"
      }
    : {}
);

export const DynamoDB = new AWS.DynamoDB();
export const DocumentClient = new AWS.DynamoDB.DocumentClient();

export default {
  DynamoDB,
  DocumentClient
};

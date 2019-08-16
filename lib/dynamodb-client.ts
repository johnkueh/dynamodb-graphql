import AWS from "aws-sdk";

const local = process.env.IS_OFFLINE || process.env.NODE_ENV === "test";
const config = local
  ? {
      region: "localhost",
      endpoint: "http://localhost:8000"
    }
  : {};

export const DynamoDB = new AWS.DynamoDB(config);
export const DocumentClient = new AWS.DynamoDB.DocumentClient(config);

export default {
  DynamoDB,
  DocumentClient
};

import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

const local = process.env.IS_OFFLINE || process.env.NODE_ENV === "test";
const config = local
  ? {
      endpoint: "http://localhost:8000"
    }
  : {};

export const DynamoDB = new AWS.DynamoDB(config);
export const DocumentClient = new AWS.DynamoDB.DocumentClient(config);

export default {
  DynamoDB,
  DocumentClient
};

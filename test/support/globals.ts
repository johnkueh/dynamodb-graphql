import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import { DocumentClient } from "../../lib/dynamodb-client";

beforeAll(() => {});

beforeEach(async () => {
  // Clears every row in local test database
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    ProjectionExpression: "#PK, #SK",
    ExpressionAttributeNames: {
      "#PK": "PK",
      "#SK": "SK"
    }
  };

  const { Items = [] } = await DocumentClient.scan(params).promise();

  // Create a delete request for each row
  const deleteRequests = Items.map(({ SK, PK }) => {
    return {
      DeleteRequest: {
        Key: { PK, SK }
      }
    };
  });

  // Group requests in to batch (DynamoDB has a max size for batch requests)
  const batchSize = 15;
  const deleteRequestGroups = deleteRequests.reduce((current, item, index) => {
    const groupIndex = Math.floor(index / batchSize);
    if (!current[groupIndex]) {
      current[groupIndex] = [];
    }
    current[groupIndex].push(item);
    return current;
  }, []);

  const requests = deleteRequestGroups.map(group => {
    const batchDeleteParams = {
      RequestItems: {
        [process.env.DYNAMODB_TABLE]: deleteRequests
      }
    };
    return DocumentClient.batchWrite(batchDeleteParams).promise();
  });

  // Run all groups in parallel
  await Promise.all(requests);
});

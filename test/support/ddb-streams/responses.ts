export const dbbStreamForInsertedResponse = response => {
  const {
    SK,
    PK,
    GSI1PK,
    GSI1SK,
    teamId,
    id,
    GSI2PK,
    GSI2SK,
    sentAt,
    feeling,
    submittedAt,
    userId
  } = response;
  return {
    Records: [
      {
        eventID: "f46f92dd4ba53e6e1912f5edeac68cf4",
        eventName: "INSERT",
        eventVersion: "1.1",
        eventSource: "aws:dynamodb",
        awsRegion: "us-east-1",
        dynamodb: {
          ApproximateCreationDateTime: 1565433118,
          Keys: {
            SK: { S: SK },
            PK: { S: PK }
          },
          NewImage: {
            GSI1PK: { S: GSI1PK },
            GSI2SK: { S: GSI2SK },
            GSI1SK: { S: GSI1SK },
            teamId: { S: teamId },
            SK: { S: SK },
            GSI2PK: { S: GSI2PK },
            PK: { S: PK },
            sentAt: { S: sentAt },
            userId: { S: userId }
          },
          SequenceNumber: "1520900000000005234843303",
          SizeBytes: 192,
          StreamViewType: "NEW_AND_OLD_IMAGES"
        },
        eventSourceARN:
          "arn:aws:dynamodb:us-east-1:xxx:table/dynamodb-graphql-test/stream/2017-02-21T12:05:33.650"
      }
    ]
  };
};

export default {
  dbbStreamForInsertedResponse
};

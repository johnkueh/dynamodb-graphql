export const RESPONSE_INSERT = {
  Records: [
    {
      eventID: "f46f92dd4ba53e6e1912f5edeac68cf4",
      eventName: "INSERT",
      eventVersion: "1.1",
      eventSource: "aws:dynamodb",
      awsRegion: "us-east-1",
      dynamodb: [
        {
          ApproximateCreationDateTime: 1565433118,
          Keys: {
            SK: { S: "response|2019-08-12|user_id" },
            PK: { S: "123123" }
          },
          NewImage: {
            GSI1PK: { S: "response|team_id" },
            GSI2SK: { S: "2019-08-12" },
            GSI1SK: { S: "2019-08-12" },
            teamId: { S: "team_id" },
            SK: { S: "response|2019-08-12|user_id" },
            GSI2PK: { S: "response|user_id" },
            PK: { S: "123123" },
            sentAt: { S: "2019-08-12" },
            userId: { S: "user_id" }
          },
          SequenceNumber: "1520900000000005234843303",
          SizeBytes: 192,
          StreamViewType: "NEW_AND_OLD_IMAGES"
        }
      ],
      eventSourceARN:
        "arn:aws:dynamodb:us-east-1:xxx:table/dynamodb-graphql-test/stream/2017-02-21T12:05:33.650"
    }
  ]
};

export default {
  RESPONSE_INSERT
};

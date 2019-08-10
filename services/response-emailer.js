export const handler = (event, context, callback) => {
  const { Records } = event;
  Records.forEach(({ eventName, eventSource, dynamodb }) => {
    console.log(eventName, eventSource, dynamodb);
  });

  return callback(null, {
    statusCode: 200,
    body: "Successfully received events"
  });
};

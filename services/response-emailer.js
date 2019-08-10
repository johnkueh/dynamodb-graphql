export const handler = (event, context, callback) => {
  console.log("Received Event...", event);
  return callback(null, {
    statusCode: 200,
    body: "Successfully received events"
  });
};

import { rule } from "graphql-shield";
import { Queries } from "../dynamodb/queries";

export const responseExists = rule()(async (parent, args, ctx) => {
  const responseId = args.id || args.input.id;
  const response = await Queries.responses.fetchById(responseId);

  return response != null;
});

export default {
  responseExists
};

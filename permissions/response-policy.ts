import { rule } from "graphql-shield";
import { Queries } from "../dynamodb/queries";

export const responseExists = rule()(
  async (parent, args): Promise<boolean> => {
    const responseId = args.id || args.input.id;
    const response = await Queries.fetchResponseById(responseId);

    return response != null;
  }
);

export default {
  responseExists
};

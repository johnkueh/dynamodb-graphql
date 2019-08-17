import { createTestClient } from "apollo-server-testing";
import { makeServer } from "../../services/graphql";
import { Context } from "../../dynamodb/types";

interface Input {
  [key: string]: string | boolean | number | null | string[];
}

interface Query {
  query: string;
  context?: Context;
  variables?: {
    [key: string]: string | Input;
  };
}

export const query = ({ context, query: gql, variables }: Query) => {
  const handler = context
    ? makeServer({ context })
    : makeServer({ context: {} });
  const { query: apolloQuery } = createTestClient(handler);
  return apolloQuery({
    query: gql,
    variables
  });
};

export default { query };

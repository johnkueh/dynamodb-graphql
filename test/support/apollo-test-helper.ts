import { createTestClient } from "apollo-server-testing";
import { makeServer } from "../../services/graphql";

export const query = ({ context, query: gql, variables }) => {
  const handler = makeServer({ context });
  const { query: apolloQuery } = createTestClient(handler);
  return apolloQuery({
    query: gql,
    variables
  });
};

export default { query };

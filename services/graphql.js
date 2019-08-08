import { ApolloServer, gql } from "apollo-server-lambda";
import { makeSchema } from "nexus";
import { applyMiddleware } from "graphql-middleware";
import jsonwebtoken from "jsonwebtoken";
import * as types from "../schema";
import User from "../models/user";

const schema = applyMiddleware(
  makeSchema({
    types,
    outputs: false,
    shouldGenerateArtifacts: false
  })
);

const userContext = async ({ event }) => {
  let user = null;

  const { Authorization } = event.headers;
  if (Authorization) {
    const jwt = Authorization.replace("Bearer ", "");
    const { id } = jsonwebtoken.verify(jwt, "JWTSECRET");
    if (id) {
      user = await User.getById(id);
    }
  }

  return {
    user
  };
};

export const makeServer = ({ context }) =>
  new ApolloServer({
    introspection: true,
    playground: true,
    schema,
    context
  });

const server = makeServer({ context: userContext });

export const handler = server.createHandler({
  cors: {
    origin: "*"
  }
});

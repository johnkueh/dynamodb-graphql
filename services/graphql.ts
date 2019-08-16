import { join } from "path";
import { ApolloServer } from "apollo-server-lambda";
import { makeSchema } from "nexus";
import { applyMiddleware } from "graphql-middleware";
import jsonwebtoken from "jsonwebtoken";
import * as types from "../schema";
import { permissions } from "../permissions";
import { Queries } from "../dynamodb/queries";
import {
  VerifiedToken,
  LambdaArguments,
  UserContext,
  ServerContext
} from "../dynamodb/types";

const schema = applyMiddleware(
  makeSchema({
    types,
    outputs: {
      schema: join(__dirname, "../../generated/schema.graphql"),
      typegen: join(__dirname, "../../generated/types.d.ts")
    },
    typegenAutoConfig: {
      sources: [
        {
          source: join(__dirname, "../../dynamodb/types.ts"),
          alias: "t"
        }
      ]
    }
  }),
  permissions
);

const userContext = async ({
  event
}: LambdaArguments): Promise<UserContext> => {
  let user = null;

  const { Authorization } = event.headers;
  if (Authorization) {
    const jwt = Authorization.replace("Bearer ", "");
    const { id } = jsonwebtoken.verify(jwt, "JWTSECRET") as VerifiedToken;
    if (id) {
      user = await Queries.fetchUserById(id);
    }
  }

  return {
    user
  };
};

export const makeServer = ({ context }: ServerContext) => {
  return new ApolloServer({
    introspection: true,
    playground: true,
    schema,
    context
  });
};

export const handler = makeServer({ context: userContext }).createHandler({
  cors: {
    origin: "*"
  }
});

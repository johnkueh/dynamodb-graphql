import { objectType, asNexusMethod } from "nexus";
import { GraphQLDateTime } from "graphql-iso-date";
import * as user from "./user";

export const GQLDateTime = asNexusMethod(GraphQLDateTime, "dateTime");

export const DeletedType = objectType({
  name: "DeletePayload",
  definition(t) {
    t.int("count");
  }
});

export default {
  user
};

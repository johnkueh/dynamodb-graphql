import { objectType, asNexusMethod } from "nexus";
import { GraphQLDateTime } from "graphql-iso-date";
import * as user from "./user";
import * as team from "./team";

export const GQLDateTime = asNexusMethod(GraphQLDateTime, "dateTime");

export const DeletedType = objectType({
  name: "DeletePayload",
  definition(t) {
    t.id("id");
  }
});

export default {
  user,
  team
};

import { objectType, decorateType } from "nexus";
import { GraphQLDateTime } from "graphql-iso-date";
import * as user from "./user";
import * as team from "./team";
import * as response from "./response";
import * as cultureValue from "./cultureValue";

export const GQLDateTime = decorateType(GraphQLDateTime, {
  rootTyping: "DateTime",
  asNexusMethod: "dateTime"
});

export const DeletedType = objectType({
  name: "DeletePayload",
  definition(t) {
    t.id("id");
  }
});

export default {
  user,
  team,
  response,
  cultureValue
};

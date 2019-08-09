import { objectType, queryField } from "nexus";
import { Queries } from "../dynamodb/queries";

export const CultureValueType = objectType({
  name: "CultureValue",
  definition(t) {
    t.id("id");
    t.string("name");
  }
});

export const CultureValuesQuery = queryField("cultureValues", {
  type: CultureValueType,
  list: true,
  resolve: async (parent, args, ctx) => {
    return Queries.fetchCultures();
  }
});

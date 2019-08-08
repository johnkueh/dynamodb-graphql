import {
  objectType,
  inputObjectType,
  queryField,
  mutationField,
  arg
} from "nexus";
import { Queries } from "../dynamodb/queries";

export const TeamType = objectType({
  name: "Team",
  definition(t) {
    t.id("id");
    t.string("name");
    t.list.field("users", {
      type: "User",
      resolve: async ({ id: teamId }) => {
        return Queries.fetchTeamUsers({ teamId });
      }
    });
  }
});

export const TeamQuery = queryField("team", {
  type: TeamType,
  resolve: async (parent, args, ctx) => {
    return Queries.fetchTeamById(ctx.user.teamId);
  }
});

export const UpdateTeamInputType = inputObjectType({
  name: "UpdateTeamInput",
  definition(t) {
    t.string("id");
    t.string("name");
  }
});

export const UpdateTeamMutation = mutationField("updateTeam", {
  type: TeamType,
  args: {
    input: arg({
      type: UpdateTeamInputType,
      required: true
    })
  },
  resolve: async (parent, { input }, ctx) => {
    const team = await Queries.updateTeam({
      id: ctx.user.teamId,
      ...input
    });
    return team;
  }
});

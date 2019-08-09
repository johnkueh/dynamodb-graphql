import {
  objectType,
  inputObjectType,
  queryField,
  mutationField,
  arg,
  stringArg
} from "nexus";
import { isEmpty, difference } from "lodash";
import { Queries } from "../dynamodb/queries";

export const TeamType = objectType({
  name: "Team",
  definition(t) {
    t.id("id");
    t.string("name");
    t.string("emoji");
    t.boolean("moods");
    t.boolean("recognition");
    t.list.field("users", {
      type: "User",
      resolve: async ({ id: teamId }) => {
        return Queries.fetchTeamUsers({ teamId });
      }
    });
    t.list.field("cultureValues", {
      type: "CultureValue",
      resolve: async ({ id: teamId }) => {
        return Queries.culture.fetchForTeam(teamId);
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
    t.string("emoji");
    t.boolean("moods");
    t.boolean("recognition");
    t.list.string("cultureValueIds");
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
  resolve: async (
    parent,
    { input: anInput, input: { id: teamId, cultureValueIds, ...input } },
    ctx
  ) => {
    if (!isEmpty(input)) {
      await Queries.updateTeam({
        id: teamId,
        ...input
      });
    }

    if (cultureValueIds != null) {
      await Queries.culture.removeAllFromTeam(teamId);
      await Queries.culture.addAllToTeam({
        cultureIds: cultureValueIds,
        teamId
      });
    }

    return Queries.fetchTeamById(teamId);
  }
});

export const AddTeamUserInputType = inputObjectType({
  name: "AddTeamUserInput",
  definition(t) {
    t.string("name");
    t.string("email");
  }
});

export const AddTeamUserMutation = mutationField("addTeamUser", {
  type: TeamType,
  args: {
    input: arg({
      type: AddTeamUserInputType,
      required: true
    })
  },
  resolve: async (parent, { input }, ctx) => {
    const user = await Queries.putUser(input);
    const team = await Queries.fetchTeamById(ctx.user.teamId);
    await Queries.addUserToTeam({ user, team });
    return team;
  }
});

export const RemoveTeamUserMutation = mutationField("removeTeamUser", {
  type: TeamType,
  args: {
    id: stringArg({
      required: true
    })
  },
  resolve: async (parent, { id }, ctx) => {
    const team = await Queries.fetchTeamById(ctx.user.teamId);
    await Queries.removeUserFromTeam({ userId: id, teamId: ctx.user.teamId });
    return team;
  }
});

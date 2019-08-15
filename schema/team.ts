import {
  objectType,
  inputObjectType,
  queryField,
  mutationField,
  arg,
  stringArg
} from "nexus";
import { isEmpty } from "lodash";
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
        return Queries.fetchCultureForTeam(teamId);
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
    if (!isEmpty(input) && teamId != null) {
      await Queries.updateTeam({
        id: teamId,
        ...input
      });
    }

    if (teamId != null && cultureValueIds != null) {
      await Queries.removeCulturesFromTeam(teamId);
      await Queries.addCulturesToTeam({
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
  nullable: true,
  args: {
    input: arg({
      type: AddTeamUserInputType,
      required: true
    })
  },
  resolve: async (parent, { input }, ctx) => {
    const user = await Queries.createUser(input);
    const team = await Queries.fetchTeamById(ctx.user.teamId);

    if (user != null && team != null) {
      await Queries.addUserToTeam({ user, team });
    }

    if (team == null) return null;

    return team;
  }
});

export const UpdateTeamUserInputType = inputObjectType({
  name: "UpdateTeamUserInput",
  definition(t) {
    t.string("id");
    t.string("tz");
  }
});

export const UpdateTeamUserMutation = mutationField("updateTeamUser", {
  type: "User",
  args: {
    input: arg({
      type: UpdateTeamUserInputType,
      required: true
    })
  },
  resolve: async (parent, { input }, ctx) => {
    return Queries.updateUser(input);
  }
});

export const RemoveTeamUserMutation = mutationField("removeTeamUser", {
  type: TeamType,
  nullable: true,
  args: {
    id: stringArg({
      required: true
    })
  },
  resolve: async (parent, { id }, ctx) => {
    if (id != null) {
      await Queries.removeUserFromTeam({ userId: id });
    }

    const team = await Queries.fetchTeamById(ctx.user.teamId);
    return team;
  }
});

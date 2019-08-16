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
      nullable: true,
      resolve: async ({ id: teamId }) => {
        return Queries.fetchTeamUsers({ teamId });
      }
    });
    t.list.field("cultureValues", {
      type: "CultureValue",
      nullable: true,
      resolve: async ({ id: teamId }) => {
        return Queries.fetchCultureForTeam(teamId);
      }
    });
  }
});

export const TeamQuery = queryField("team", {
  type: TeamType,
  nullable: true,
  resolve: async (parent, args, ctx) => {
    const teamId = ctx.user && ctx.user.teamId;
    if (teamId == null) return null;

    return Queries.fetchTeamById(teamId);
  }
});

export const UpdateTeamInputType = inputObjectType({
  name: "UpdateTeamInput",
  definition(t) {
    t.string("id", { required: true });
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
  resolve: async (parent, data) => {
    const {
      input: { id: teamId, cultureValueIds, ...input }
    } = data;

    if (!isEmpty(input)) {
      await Queries.updateTeam({
        id: teamId,
        ...input
      });
    }

    if (cultureValueIds != null) {
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
    t.string("name", { required: true });
    t.string("email", { required: true });
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
    const teamId = ctx.user && ctx.user.teamId;
    if (teamId == null) return null;

    const user = await Queries.createUser(input);
    const team = await Queries.fetchTeamById(teamId);

    if (user != null && team != null) {
      await Queries.addUserToTeam({ user, team });
    }

    return team;
  }
});

export const UpdateTeamUserInputType = inputObjectType({
  name: "UpdateTeamUserInput",
  definition(t) {
    t.string("id", { required: true });
    t.string("tz", { required: true });
  }
});

export const UpdateTeamUserMutation = mutationField("updateTeamUser", {
  type: "User",
  nullable: true,
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
    const teamId = ctx.user && ctx.user.teamId;
    if (teamId == null) return null;

    if (id != null) {
      await Queries.removeUserFromTeam({ userId: id });
    }

    const team = await Queries.fetchTeamById(teamId);
    return team;
  }
});

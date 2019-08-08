import {
  objectType,
  inputObjectType,
  queryField,
  mutationField,
  arg,
  stringArg
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
    // const { name, email } = input;
    // const { user } = ctx;

    // const team = await Team.query().findById(user.teamId);
    // await team.$relatedQuery('users').insert({
    //   name,
    //   email
    // });

    // return user.$relatedQuery('team');
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
    await Queries.removeUserFromTeam({
      userId: id,
      teamId: ctx.user.teamId
    });
    return team;
  }
});

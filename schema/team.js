import { isEmpty, difference } from "lodash";
import {
  objectType,
  inputObjectType,
  queryField,
  mutationField,
  arg,
  stringArg
} from "nexus";
import Team from "../models/team";

export const TeamType = objectType({
  name: "Team",
  definition(t) {
    t.id("id");
    t.string("name");
    t.list.field("users", {
      type: "User",
      resolve: async ({ id: teamId }) => {
        return Team.getUsers(teamId);
      }
    });
  }
});

export const TeamQuery = queryField("team", {
  type: TeamType,
  resolve: async (parent, args, ctx) => {
    return Team.getById(ctx.user.teamId);
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
    const team = await Team.update({
      id: ctx.user.teamId,
      ...input
    });

    // if (cultureValueIds != null) {
    //   const teamCultureValues = await team.$relatedQuery('cultureValues');
    //   const relateIds = difference(cultureValueIds, teamCultureValues.map(({ id }) => id));
    //   const unrelateIds = difference(teamCultureValues.map(({ id }) => id), cultureValueIds);

    //   await team
    //     .$relatedQuery('cultureValues')
    //     .where('cultureValues.id', 'IN', unrelateIds)
    //     .unrelate();
    //   await team.$relatedQuery('cultureValues').relate(relateIds);
    // }

    return team;
  }
});

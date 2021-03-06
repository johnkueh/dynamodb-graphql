import { rule } from "graphql-shield";
import { Queries } from "../dynamodb/queries";

export const canManageTeamUser = rule()(
  async (parent, args, ctx): Promise<boolean> => {
    const userId = args.id || args.input.id;
    const user = await Queries.fetchUserById(userId);
    if (!user) return false;

    return user.teamId === ctx.user.teamId;
  }
);

export const canManageTeam = rule()(
  async (parent, args, ctx): Promise<boolean> => {
    const teamId = args.id || args.input.id;
    const userTeamId = ctx.user.teamId;
    return teamId === userTeamId;
  }
);

export default {
  canManageTeamUser,
  canManageTeam
};

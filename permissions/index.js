import { allow, and, not, shield } from "graphql-shield";
import ValidationErrors from "../lib/validation-errors";
import { isAuthenticated } from "./is-authenticated";
import { isMyself } from "./user-policy";
import { canManageTeam, canManageTeamUser } from "./team-policy";

export const permissions = shield(
  {
    Query: {
      "*": isAuthenticated,
      team: isAuthenticated,
      // responses: and(isAuthenticated),
      cultureValues: allow
    },
    Mutation: {
      "*": isAuthenticated,
      login: allow,
      signup: allow,
      // forgotPassword: allow,
      // resetPassword: allow,
      // updateResponse: responseExists, // No isAuthenticated so that able to update from clicking email without logging in
      updateTeam: and(isAuthenticated, canManageTeam),
      // updateTeamUser: and(isAuthenticated, canManageTeamUser),
      removeTeamUser: and(isAuthenticated, canManageTeamUser, not(isMyself))
    }
  },
  {
    fallbackError: ValidationErrors({
      auth: "You are not authorized to perform this action"
    })
  }
);

export default {
  permissions
};

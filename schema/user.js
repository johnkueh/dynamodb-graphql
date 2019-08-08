import {
  arg,
  objectType,
  inputObjectType,
  queryField,
  mutationField
} from "nexus";
import ValidationErrors from "../lib/validation-errors";
import { Queries } from "../dynamodb/queries";

export const UserType = objectType({
  name: "User",
  definition(t) {
    t.id("id");
    t.string("email");
    t.string("name");
    t.string("tz");
    t.field("team", {
      type: "Team",
      resolve: async ({ teamId }) => {
        return Queries.fetchTeamById(teamId);
      }
    });
  }
});

export const AuthPayloadType = objectType({
  name: "AuthPayload",
  definition(t) {
    t.string("jwt");
    t.field("user", { type: UserType });
  }
});

export const SignupInputType = inputObjectType({
  name: "SignupInput",
  definition(t) {
    t.string("name", { required: true });
    t.string("email", { required: true });
    t.string("password", { required: true });
    t.string("teamName", { required: true });
  }
});

export const SignupMutation = mutationField("signup", {
  type: AuthPayloadType,
  args: {
    input: arg({
      type: SignupInputType,
      required: true
    })
  },
  resolve: async (parent, { input }) => {
    const user = await Queries.putUser(input);
    const team = await Queries.putTeam({ name: input.teamName });
    await Queries.addUserToTeam({
      user,
      team
    });
    return {
      jwt: user.jwt,
      user
    };
  }
});

export const MeQuery = queryField("me", {
  type: UserType,
  resolve: async (parent, args, ctx) => {
    if (ctx.user) return ctx.user;

    throw ValidationErrors({
      auth: "You are not authorized to perform this action"
    });
  }
});

export const LoginInputType = inputObjectType({
  name: "LoginInput",
  definition(t) {
    t.string("email", { required: true });
    t.string("password", { required: true });
  }
});

export const LoginMutation = mutationField("login", {
  type: AuthPayloadType,
  args: {
    input: arg({
      type: LoginInputType,
      required: true
    })
  },
  resolve: async (parent, { input }) => {
    const { email, password } = input;
    const user = await Queries.fetchUserByEmail(email);
    if (user && user.validPassword(password)) {
      return {
        jwt: user.jwt,
        user
      };
    }

    throw ValidationErrors({
      auth: "Please check your credentials and try again."
    });
  }
});

export const UpdateUserInputType = inputObjectType({
  name: "UpdateUserInput",
  definition(t) {
    t.string("name", { required: false });
    t.string("email", { required: false });
    t.string("password", { required: false });
  }
});

export const UpdateUserMutation = mutationField("updateUser", {
  type: UserType,
  args: {
    input: arg({
      type: UpdateUserInputType,
      required: true
    })
  },
  resolve: async (parent, { input }, ctx) => {
    return Queries.updateUser({
      id: ctx.user.id,
      ...input
    });
  }
});

export const DeleteUserInputType = inputObjectType({
  name: "DeleteUserInput",
  definition(t) {
    t.string("id", { required: true });
  }
});

export const DeleteUserMutation = mutationField("deleteUser", {
  type: "DeletePayload",
  args: {
    input: arg({
      type: DeleteUserInputType,
      required: true
    })
  },
  resolve: async (parent, { input }, ctx) => {
    const user = await Queries.deleteUser(input.id);
    return user;
  }
});

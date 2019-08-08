import {
  arg,
  objectType,
  inputObjectType,
  queryField,
  mutationField
} from "nexus";
import ValidationErrors from "../lib/validation-errors";
import User from "../models/user";
import Team from "../models/team";

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
        return Team.getById(teamId);
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
    const user = await User.create(input);
    const team = await Team.create({ name: input.teamName });
    await Team.addUser({
      userId: user.id,
      teamId: team.id
    });
    user.teamId = team.id;
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
    const user = await User.getByEmail(email);
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
    return User.update({
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
    const user = await User.destroy(input.id);
    return user;
  }
});

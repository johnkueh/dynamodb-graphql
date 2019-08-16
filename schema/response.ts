import {
  objectType,
  inputObjectType,
  queryField,
  mutationField,
  arg
} from "nexus";
import moment from "moment";
import { Queries } from "../dynamodb/queries";

export const ResponseType = objectType({
  name: "Response",
  definition(t) {
    t.string("userId");
    t.string("id", { nullable: true });
    t.string("sentAt", { nullable: true });
    t.string("submittedAt", { nullable: true });
    t.string("feeling", { nullable: true });
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: async parent => {
        if (parent.userId == null) return null;

        return Queries.fetchUserById(parent.userId);
      }
    });
  }
});

export const ResponsesFilterInputType = inputObjectType({
  name: "ResponsesFilterInput",
  definition(t) {
    t.string("from", { required: true });
    t.string("to", { required: true });
  }
});

export const ResponsesQuery = queryField("responses", {
  type: ResponseType,
  list: true,
  args: {
    input: arg({
      type: ResponsesFilterInputType,
      required: true
    })
  },
  resolve: async (parent, args, ctx) => {
    const { from, to } = args.input;
    const teamId = ctx.user && ctx.user.teamId;
    if (teamId == null) return [];

    return Queries.fetchResponsesForTeamByDateRange({
      teamId,
      fromDate: from,
      toDate: to
    });
  }
});

export const UpdateResponseInputType = inputObjectType({
  name: "UpdateResponseInput",
  definition(t) {
    t.string("id", { required: true });
    t.string("feeling");
  }
});

export const UpdateResponsePayloadType = objectType({
  name: "UpdateResponsePayload",
  definition(t) {
    t.string("jwt");
    t.field("response", {
      type: "Response"
    });
  }
});

export const UpdateResponseMutation = mutationField("updateResponse", {
  type: UpdateResponsePayloadType,
  nullable: true,
  args: {
    input: arg({
      type: UpdateResponseInputType,
      required: true
    })
  },
  resolve: async (parent, data) => {
    const { id, feeling } = data.input;
    const response = await Queries.updateResponse({
      id,
      feeling,
      submittedAt: moment().toISOString()
    });

    if (response == null) return null;
    if (response.userId == null) return null;

    const user = await Queries.fetchUserById(response.userId);

    if (user == null) return null;

    return {
      jwt: user.jwtWithOptions({
        expiresIn: "1h" // We want this token to expire quickly
      }),
      response
    };
  }
});

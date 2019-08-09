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
    t.string("id", { nullable: true });
    t.dateTime("sentAt", { nullable: true });
    t.dateTime("submittedAt", { nullable: true });
    t.string("feeling", { nullable: true });
    t.field("user", {
      type: "User",
      resolve: async parent => {
        return Queries.fetchUserById(parent.userId);
      }
    });
  }
});

export const ResponsesFilterInputType = inputObjectType({
  name: "ResponsesFilterInput",
  definition(t) {
    t.string("from");
    t.string("to");
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
    return Queries.responses.team.fetchByDateRange({
      teamId: ctx.user.teamId,
      fromDate: from,
      toDate: to
    });
  }
});

export const UpdateResponseInputType = inputObjectType({
  name: "UpdateResponseInput",
  definition(t) {
    t.string("id");
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
  args: {
    input: arg({
      type: UpdateResponseInputType,
      required: true
    })
  },
  resolve: async (parent, { input }) => {
    const response = await Queries.responses.update({
      submittedAt: moment().toISOString(),
      ...input
    });
    const user = await Queries.fetchUserById(response.userId);
    const jwt = user.jwtWithOptions({
      expiresIn: "1h" // We want this token to expire quickly
    });

    return {
      jwt,
      response
    };
  }
});

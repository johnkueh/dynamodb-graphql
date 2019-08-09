import { UserQueries } from "./user";
import { TeamQueries } from "./team";
import { Queries as RecognitionQueries } from "./recognition";

export const Queries = {
  ...UserQueries,
  ...TeamQueries,
  ...RecognitionQueries
};

export default {
  Queries
};

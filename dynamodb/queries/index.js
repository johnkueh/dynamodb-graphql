import { UserQueries } from "./user";
import { TeamQueries } from "./team";

export const Queries = {
  ...UserQueries,
  ...TeamQueries
};

export default {
  Queries
};

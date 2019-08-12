import * as User from "./user";
import * as Team from "./team";
import * as Culture from "./culture";
import * as Response from "./response";

export const Queries = {
  ...User,
  ...Team,
  ...Culture,
  ...Response
};

export default {
  Queries
};

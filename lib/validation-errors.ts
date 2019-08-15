import { UserInputError } from "apollo-server-lambda";

const ValidationErrors = (errors: Record<string, string>) =>
  new UserInputError("ValidationError", { errors });

export default ValidationErrors;

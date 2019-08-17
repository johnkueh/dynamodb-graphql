import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "./types";

export const makeUser = (user: User): User => {
  return {
    id: user.PK,
    teamId: user.GSI2PK,
    email: user.GSI1SK,
    jwtWithOptions: (options: Record<string, string>): string =>
      jsonwebtoken.sign(
        { id: user.PK, email: user.email, options },
        "JWTSECRET"
      ),
    jwt: jsonwebtoken.sign({ id: user.PK, email: user.GSI1SK }, "JWTSECRET"),
    validPassword: (password: string): boolean => {
      if (user.password == null) return false;
      return bcrypt.compareSync(password, user.password);
    },
    ...user
  };
};

export default {
  makeUser
};

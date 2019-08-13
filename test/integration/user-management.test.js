import "../support/globals";
import { query as performQuery } from "../support/apollo-test-helper";
import { Queries } from "../../dynamodb/queries";

describe("Signing up", () => {
  const SIGNUP = `
  mutation($input: SignupInput!) {
    signup(input: $input) {
      jwt
      user {
        id
        name
        email
        team {
          id
          name
        }
      }
    }
  }
  `;

  it("is not able to signup with missing fields", async () => {
    const res = await performQuery({
      query: SIGNUP,
      variables: {
        input: {
          name: "",
          email: "dummy+user@testom",
          password: "pass",
          teamName: "Test team"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is not able to signup with missing team name", async () => {
    const res = await performQuery({
      query: SIGNUP,
      variables: {
        input: {
          name: "Kent Choe",
          email: "dummy+user@test.com",
          password: "password",
          teamName: ""
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is not able to signup with taken email", async () => {
    const existingUser = await Queries.createUser({
      name: "Old Mcdonald",
      email: "old@mcdonald.com",
      password: "happymeal"
    });

    const res = await performQuery({
      query: SIGNUP,
      variables: {
        input: {
          email: existingUser.email,
          name: "Test User",
          password: "testpassword",
          teamName: "Test team"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is able to signup successfully", async () => {
    const res = await performQuery({
      query: SIGNUP,
      variables: {
        input: {
          email: "john@doe.com",
          name: "John Doe",
          password: "password",
          teamName: "Test team"
        }
      }
    });

    expect(res).toMatchSnapshot({
      data: {
        signup: {
          jwt: expect.any(String),
          user: {
            id: expect.any(String),
            team: {
              id: expect.any(String)
            }
          }
        }
      }
    });
  });
});

describe("Logging in", () => {
  const LOGIN = `
  mutation($input: LoginInput!) {
    login(input: $input) {
      jwt
      user {
        name
        email
      }
    }
  }
  `;
  it("is not able to login with wrong credentials", async () => {
    const res = await performQuery({
      query: LOGIN,
      variables: {
        input: {
          email: "john@doe.com",
          password: "wrongpassword"
        }
      }
    });
    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is able to login with correct credentials", async () => {
    await Queries.createUser({
      name: "Jedi Knight",
      email: "jedi@knight.com",
      password: "youshallnotpass"
    });

    const res = await performQuery({
      query: LOGIN,
      variables: {
        input: {
          email: "jedi@knight.com",
          password: "youshallnotpass"
        }
      }
    });

    expect(res).toMatchSnapshot({
      data: {
        login: {
          jwt: expect.any(String)
        }
      }
    });
  });
});

describe("Fetching user profile", () => {
  let user;
  beforeEach(async () => {
    user = await Queries.createUser({
      name: "John Doe",
      email: "john@doe.com",
      password: "password"
    });
  });

  it("is not able to fetch user profile without credentials", async () => {
    const res = await performQuery({
      query: `
      query {
        me {
          name
          email
        }
      }
    `
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is able to fetch user profile with credentials", async () => {
    const res = await performQuery({
      context: { user },
      query: `
      query {
        me {
          name
          email
        }
      }
    `
    });

    expect(res).toMatchSnapshot({
      data: {
        me: {
          email: expect.any(String)
        }
      }
    });
  });
});

describe("Updating user profile", () => {
  let user;
  const UPDATE_USER = `
  mutation($input: UpdateUserInput!) {
    updateUser(input: $input) {
      name
      email
    }
  }
  `;
  beforeEach(async () => {
    user = await Queries.createUser({
      name: "John Doe",
      email: "john@doe.com",
      password: "password"
    });
  });

  it("fails to update with invalid fields", async () => {
    const res = await performQuery({
      context: { user },
      query: UPDATE_USER,
      variables: {
        input: {
          name: "",
          email: "hel@per",
          password: "abc"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("can update with valid fields", async () => {
    const res = await performQuery({
      context: { user },
      query: UPDATE_USER,
      variables: {
        input: {
          name: "New Doe",
          email: "new@doe.com"
        }
      }
    });
    expect(res).toMatchSnapshot();
  });

  it("can update password", async () => {
    const res = await performQuery({
      context: { user },
      query: UPDATE_USER,
      variables: {
        input: {
          password: "newpassword"
        }
      }
    });
    expect(res).toMatchSnapshot();

    const updatedUser = await Queries.fetchUserById(user.id);
    expect(updatedUser.validPassword("newpassword")).toBe(true);
  });

  it("fails to update with taken email", async () => {
    await Queries.createUser({
      name: "Death Toll",
      email: "taken@email.com",
      password: "deathishere",
      teamName: "Kroll"
    });

    const res = await performQuery({
      context: { user },
      query: UPDATE_USER,
      variables: {
        input: {
          email: "taken@email.com"
        }
      }
    });
    expect(JSON.stringify(res)).toMatchSnapshot();
  });
});

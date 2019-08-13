import moment from "moment";
import jsonwebtoken from "jsonwebtoken";
import "../support/globals";
import { query as performQuery } from "../support/apollo-test-helper";
import { Queries } from "../../dynamodb/queries";

describe("Fetching culture values", () => {
  const query = `
    query {
      cultureValues {
        name
      }
    }
  `;
  beforeEach(async () => {
    await Queries.createCulture({ name: "Teamwork", position: 1 });
    await Queries.createCulture({ name: "Integrity", position: 2 });
    await Queries.createCulture({ name: "Helpful", position: 3 });
  });

  it("can fetch culture values without auth", async () => {
    const res = await performQuery({
      query
    });

    expect(res).toMatchSnapshot();
  });
});

describe("viewing responses", () => {
  let user;
  let user2;
  const query = `
    query($input: ResponsesFilterInput!) {
      responses(input: $input) {
        feeling
        user {
          email
        }
      }
    }
    `;

  beforeEach(async () => {
    user = await Queries.createUserWithTeam({
      name: "Darth Vader",
      email: "darth@vader.com",
      password: "password",
      teamName: "Star Wars"
    });

    await Queries.createResponse({
      sentAt: moment("2018-05-10").toISOString(),
      submittedAt: moment("2018-05-10").toISOString(),
      userId: user.id,
      teamId: user.teamId,
      feeling: "HAPPY"
    });

    user2 = await Queries.createUser({
      name: "Anakin Skywalker",
      email: "anakin@skywalker.com",
      password: "password"
    });

    await Queries.addUserToTeam({
      user: user2,
      team: user.team
    });

    await Queries.createResponse({
      sentAt: moment("2018-05-11").toISOString(),
      submittedAt: moment("2018-05-11").toISOString(),
      userId: user2.id,
      teamId: user2.team.id,
      feeling: "HAPPY"
    });
  });

  it("not able to list responses if not logged in", async () => {
    const res = await performQuery({
      query,
      variables: {
        input: {
          from: "",
          to: ""
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is able to list responses belonging to team", async () => {
    // This user's response shouldnt appear because its not in the user's team
    const otherTeamUser = await Queries.createUserWithTeam({
      name: "Tom n Jerry",
      email: "tom@jerry.com",
      password: "password",
      teamName: "Disney"
    });

    await Queries.createResponse({
      sentAt: moment("2018-05-10").toISOString(),
      submittedAt: moment("2018-05-10").toISOString(),
      userId: otherTeamUser.id,
      teamId: otherTeamUser.team.id,
      feeling: "HAPPY"
    });

    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          from: moment("2018-05-01").toISOString(),
          to: moment("2018-06-01").toISOString()
        }
      }
    });

    expect(res).toMatchSnapshot();
  });

  it("only show responses in the filtered dates", async () => {
    // This response entry shouldnt appear because its not in the filtered month
    await Queries.createResponse({
      sentAt: moment("2018-01-10").toISOString(),
      submittedAt: moment("2018-01-10").toISOString(),
      userId: user.id,
      teamId: user.team.id,
      feeling: "SAD"
    });

    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          from: moment("2018-05-01").toISOString(),
          to: moment("2018-06-01").toISOString()
        }
      }
    });

    expect(res).toMatchSnapshot();
  });
});

describe("submitting responses", () => {
  let user;
  let response;
  const query = `
    mutation($input: UpdateResponseInput!) {
      updateResponse(input: $input) {
        response {
          feeling
          submittedAt
        }
        jwt
      }
    }
  `;
  beforeEach(async () => {
    user = await Queries.createUserWithTeam({
      name: "Darth Vader",
      email: "darth@vader.com",
      password: "password",
      teamName: "Star Wars"
    });
    response = await Queries.createResponse({
      sentAt: moment("2018-05-10").toISOString(),
      userId: user.id,
      teamId: user.teamId,
      feeling: "HAPPY"
    });
  });

  it("is able to update response without logged in", async () => {
    expect(response.submittedAt).toBeUndefined();

    const res = await performQuery({
      query,
      variables: {
        input: {
          id: response.id,
          feeling: "HAPPY"
        }
      }
    });

    const decoded = jsonwebtoken.verify(
      res.data.updateResponse.jwt,
      "JWTSECRET"
    );

    expect(decoded).toEqual({
      id: expect.any(String),
      iat: expect.any(Number),
      email: user.email,
      options: {
        expiresIn: "1h"
      }
    });

    expect(res).toMatchSnapshot({
      data: {
        updateResponse: {
          jwt: expect.any(String),
          response: {
            submittedAt: expect.any(String)
          }
        }
      }
    });
  });

  it("is not able to update response with invalid id", async () => {
    const res = await performQuery({
      query,
      variables: {
        input: {
          id: "12312313",
          feeling: "HAPPY"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is not able to update response without feeling", async () => {
    const res = await performQuery({
      query,
      variables: {
        input: {
          id: response.id,
          feeling: ""
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is not able to update response with invalid feeling", async () => {
    const res = await performQuery({
      query,
      variables: {
        input: {
          id: response.id,
          feeling: "FU"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });
});

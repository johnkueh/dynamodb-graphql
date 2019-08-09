import moment from "moment";
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
    await Queries.putCulture({ name: "Teamwork", position: 1 });
    await Queries.putCulture({ name: "Integrity", position: 2 });
    await Queries.putCulture({ name: "Helpful", position: 3 });
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
        submittedAt
        sentAt
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

    await Queries.responses.put({
      sentAt: moment("2018-05-10").toISOString(),
      submittedAt: moment("2018-05-10").toISOString(),
      userId: user.id,
      teamId: user.teamId,
      feeling: "HAPPY"
    });

    user2 = await Queries.putUser({
      name: "Anakin Skywalker",
      email: "anakin@skywalker.com",
      password: "password"
    });

    await Queries.addUserToTeam({
      user: user2,
      team: user.team
    });

    await Queries.responses.put({
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

    await Queries.responses.put({
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
    await Queries.responses.put({
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

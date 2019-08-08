import { query as performQuery } from "../support/apollo-test-helper";
import { Queries } from "../../dynamodb/queries";

describe("Fetching team", () => {
  let user;
  let team;
  const query = `
    query {
      team {
        id
        name
        users {
          id
          email
          name
        }
      }
    }
  `;
  beforeEach(async () => {
    user = await Queries.putUser({
      name: "John Doe",
      email: "john@doe.com",
      password: "password"
    });
    team = await Queries.putTeam({ name: "Cool team" });
    await Queries.addUserToTeam({
      user,
      team
    });
  });

  it("is able to fetch own team", async () => {
    const res = await performQuery({
      query,
      context: { user }
    });

    expect(res).toMatchSnapshot({
      data: {
        team: {
          id: expect.any(String),
          users: [
            {
              id: expect.any(String)
            }
          ]
        }
      }
    });
  });
});

describe("Updating team", () => {
  let user;
  let team;
  const query = `
    mutation($input: UpdateTeamInput!) {
      updateTeam(input: $input) {
        id
        name
      }
    }
  `;
  beforeEach(async () => {
    user = await Queries.putUser({
      name: "John Doe",
      email: "john@doe.com",
      password: "password"
    });
    team = await Queries.putTeam({ name: "Cool team" });
    await Queries.addUserToTeam({
      user,
      team
    });
  });

  it("is able to update own team", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          id: team.id,
          name: "Updated team"
        }
      }
    });

    expect(team.id).toEqual(res.data.updateTeam.id);
    expect(res).toMatchSnapshot({
      data: {
        updateTeam: {
          id: expect.any(String)
        }
      }
    });
  });
});

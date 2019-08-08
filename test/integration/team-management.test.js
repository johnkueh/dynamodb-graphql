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
          id: expect.any(String)
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

describe("Listing team users", () => {
  let user;
  let team;

  const query = `
    query {
      team {
        name
        users {
          name
          email
          tz
        }
      }
    }
  `;
  beforeEach(async () => {
    user = await Queries.putUser({
      name: "John 1",
      email: "john1@doe.com",
      password: "password"
    });
    const user2 = await Queries.putUser({
      name: "John 2",
      email: "john2@doe.com",
      password: "password"
    });
    const user3 = await Queries.putUser({
      name: "John 3",
      email: "john3@doe.com",
      password: "password"
    });

    team = await Queries.putTeam({ name: "Cool team" });
    await Queries.addUserToTeam({ user, team });
    await Queries.addUserToTeam({ user: user2, team });
    await Queries.addUserToTeam({ user: user3, team });

    // User not belonging to this team
    const otherUser = await Queries.putUser({
      name: "Next Doe",
      email: "next@doe.com",
      password: "password"
    });
    const otherTeam = await Queries.putTeam({ name: "Next team" });
    await Queries.addUserToTeam({
      user: otherUser,
      team: otherTeam
    });
  });

  it("able to get only own team users", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        id: team.id
      }
    });

    expect(res).toMatchSnapshot({
      data: {
        team: {
          users: [
            { email: expect.any(String) },
            { email: expect.any(String) },
            { email: expect.any(String) }
          ]
        }
      }
    });
  });
});

describe("Adding team users", () => {
  let user;
  const query = `
    mutation($input: AddTeamUserInput!) {
      addTeamUser(input: $input) {
        users {
          name
          email
          tz
        }
      }
    }
  `;
  beforeEach(async () => {
    user = await Queries.putUser({
      name: "John 1",
      email: "john1@doe.com",
      password: "password"
    });
    const team = await Queries.putTeam({ name: "Cool team" });
    await Queries.addUserToTeam({ user, team });
  });

  // it('unable to add team member with existing email', async () => {
  //   await factory.create('user', { email: 'test@user.com' });
  //   const res = await performQuery({
  //     context: { user },
  //     query,
  //     variables: {
  //       input: {
  //         name: 'Dummy user',
  //         email: 'test@user.com'
  //       }
  //     }
  //   });

  //   expect(res.errors[0].extensions).toMatchSnapshot();
  // });

  // it('unable to add team member with missing fields', async () => {
  //   const res = await performQuery({
  //     context: { user },
  //     query,
  //     variables: {
  //       input: {
  //         name: '',
  //         email: 'dummy+user@testom'
  //       }
  //     }
  //   });

  //   expect(res.errors[0].extensions).toMatchSnapshot();
  // });

  it("able to add team members", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          name: "New member",
          email: "darth@vader.com"
        }
      }
    });

    expect(res).toMatchSnapshot();
  });
});

describe("Removing team users", () => {
  let user;
  let team;
  const query = `
    mutation($id: String!) {
      removeTeamUser(id: $id) {
        name
        users {
          name
          email
        }
      }
    }
  `;
  beforeEach(async () => {
    user = await Queries.putUser({
      name: "John 1",
      email: "john1@doe.com",
      password: "password"
    });
    team = await Queries.putTeam({ name: "Cool team" });
    await Queries.addUserToTeam({ user, team });
  });

  // it("not able to remove other team's members", async () => {
  //   const otherTeamUser = await factory.create('userWithTeam');

  //   const res = await performQuery({
  //     context: { user },
  //     query,
  //     variables: {
  //       id: otherTeamUser.id
  //     }
  //   });

  //   expect(res.errors[0].extensions).toMatchSnapshot();
  // });

  it("able to remove team members", async () => {
    const teamUser = await Queries.putUser({
      name: "John 2",
      email: "john2@doe.com",
      password: "password"
    });
    await Queries.addUserToTeam({ user: teamUser, team });

    const res = await performQuery({
      context: { user },
      query,
      variables: {
        id: teamUser.id
      }
    });

    expect(res).toMatchSnapshot();
  });

  // it('not able to remove oneself from own team', async () => {
  //   const res = await performQuery({
  //     context: { user },
  //     query,
  //     variables: {
  //       id: user.id
  //     }
  //   });

  //   expect(res.errors[0].extensions).toMatchSnapshot();
  // });
});

import "../support/globals";
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
    user = await Queries.createUserWithTeam({
      name: "Foo Manchu",
      email: "foo@manchu.com",
      password: "foomanchu",
      teamName: "Chinese Ancient"
    });
    team = user.team;
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

  it("is able to fetch cultureValues", async () => {
    const culture = await Queries.putCulture({
      name: "Teamwork",
      position: 1
    });
    await Queries.addCultureToTeam({
      teamId: user.team.id,
      cultureId: culture.id,
      position: 1
    });

    const res = await performQuery({
      query: `
      query {
        team {
          name
          cultureValues {
            name
          }
        }
      }
    `,
      context: { user },
      variables: {
        id: user.team.id
      }
    });

    expect(res).toMatchSnapshot();
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
    user = await Queries.createUserWithTeam({
      name: "Baby Panda",
      email: "baby@panda.com",
      password: "password",
      teamName: "Bamboo Forest"
    });
    team = user.team;
  });

  it("is not able to update not own team", async () => {
    const otherTeam = await Queries.putTeam({ name: "Darth Valley Knights" });

    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          id: otherTeam.id,
          name: "Updated team"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("is able to update own team", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          id: team.id,
          name: "Shadow forest"
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

  it("is able to update team features", async () => {
    const res = await performQuery({
      context: { user },
      query: `
      mutation($input: UpdateTeamInput!) {
        updateTeam(input: $input) {
          id
          moods
          recognition
        }
      }
    `,
      variables: {
        input: {
          id: user.team.id,
          moods: false,
          recognition: false
        }
      }
    });

    expect(res).toMatchSnapshot({
      data: {
        updateTeam: {
          id: expect.any(String)
        }
      }
    });
  });

  it("is able to update team emoji", async () => {
    const res = await performQuery({
      context: { user },
      query: `
      mutation($input: UpdateTeamInput!) {
        updateTeam(input: $input) {
          id
          name
          emoji
        }
      }
    `,
      variables: {
        input: {
          id: user.team.id,
          emoji: "🌮"
        }
      }
    });

    expect(res).toMatchSnapshot({
      data: {
        updateTeam: {
          id: expect.any(String),
          emoji: "🌮"
        }
      }
    });
  });

  describe("managing team cultureValues", () => {
    const UPDATE_CULTURE_VALUES = `
      mutation($input: UpdateTeamInput!) {
        updateTeam(input: $input) {
          name
          cultureValues {
            name
          }
        }
      }
    `;

    it("is able to add team cultureValues", async () => {
      const teamwork = await Queries.putCulture({
        name: "Teamwork",
        position: 1
      });
      const efficiency = await Queries.putCulture({
        name: "Efficiency",
        position: 2
      });

      const res = await performQuery({
        context: { user },
        query: UPDATE_CULTURE_VALUES,
        variables: {
          input: {
            id: user.team.id,
            cultureValueIds: [teamwork.id, efficiency.id]
          }
        }
      });

      expect(res).toMatchSnapshot();
    });

    it("is able to remove team cultureValues", async () => {
      const teamwork = await Queries.putCulture({
        name: "Teamwork",
        position: 1
      });
      const efficiency = await Queries.putCulture({
        name: "Efficiency",
        position: 2
      });
      await Queries.addCultureToTeam({
        teamId: user.team.id,
        cultureId: teamwork.id,
        position: 1
      });
      await Queries.addCultureToTeam({
        teamId: user.team.id,
        cultureId: efficiency.id,
        position: 2
      });

      const res = await performQuery({
        context: { user },
        query: UPDATE_CULTURE_VALUES,
        variables: {
          input: {
            id: user.team.id,
            cultureValueIds: [teamwork.id]
          }
        }
      });

      expect(res).toMatchSnapshot();
    });

    it.skip("is able to remove all team cultureValues", async () => {
      // const teamwork = await factory.create('cultureValue', { name: 'Teamwork' });
      // const efficiency = await factory.create('cultureValue', { name: 'Efficiency' });
      // await user.team.$relatedQuery('cultureValues').relate([teamwork.id, efficiency.id]);

      const res = await performQuery({
        context: { user },
        query: UPDATE_CULTURE_VALUES,
        variables: {
          input: {
            id: user.team.id,
            cultureValueIds: []
          }
        }
      });

      expect(res).toMatchSnapshot({
        data: {
          updateTeam: {
            id: expect.any(String)
          }
        }
      });
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
    user = await Queries.createUserWithTeam({
      name: "Russell Crowe",
      email: "russell@crowe.com",
      password: "password",
      teamName: "Gladiators"
    });
    team = user.team;

    const user2 = await Queries.putUser({
      name: "Maxwell Crowe",
      email: "maxwell@crowe.com",
      password: "password"
    });
    const user3 = await Queries.putUser({
      name: "Shannon Crowe",
      email: "shannon@crowe.com",
      password: "password"
    });

    await Queries.addUserToTeam({ user: user2, team });
    await Queries.addUserToTeam({ user: user3, team });

    // User not belonging to this team
    await Queries.createUserWithTeam({
      name: "Skylar Nightcrow",
      email: "skylar@nightcrow.com",
      password: "password",
      teamName: "The Shining"
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

    expect(res).toMatchSnapshot();
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
    user = await Queries.createUserWithTeam({
      name: "Rowan Atkinson",
      email: "rowan@atkinson.com",
      password: "password",
      teamName: "Mr Bean"
    });
  });

  it("unable to add team member with existing email", async () => {
    await Queries.putUser({
      name: "Tester joe",
      email: "test@user.com",
      password: "password"
    });
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          name: "Dummy user",
          email: "test@user.com"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("unable to add team member with missing fields", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          name: "",
          email: "dummy+user@testom"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("able to add team members", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          name: "Felicity Atkinson",
          email: "felicity@atkinson.com"
        }
      }
    });

    expect(res).toMatchSnapshot();
  });
});

describe("Updating team users", () => {
  let user;
  const query = `
    mutation($input: UpdateTeamUserInput!) {
      updateTeamUser(input: $input) {
        name
        tz
      }
    }
  `;
  beforeEach(async () => {
    user = await Queries.createUserWithTeam({
      name: "Allen Key",
      email: "allen@key.com",
      password: "password",
      teamName: "New Zealand"
    });
  });

  it("not able to update not own team members", async () => {
    const otherUser = await Queries.createUserWithTeam({
      name: "Nolan Key",
      email: "nolan@key.com",
      password: "password",
      teamName: "Australia"
    });
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          id: otherUser.id,
          tz: "Australia/Sydney"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("not able to update with invalid timezone", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          id: user.id,
          tz: "Weird/Zone"
        }
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("able to update own team members", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        input: {
          id: user.id,
          tz: "Australia/Sydney"
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
    user = await Queries.createUserWithTeam({
      name: "Gru Evilson",
      email: "gru@evilson.com",
      password: "password",
      teamName: "Despicable Me"
    });
    team = user.team;
  });

  it("not able to remove other team's members", async () => {
    const otherTeamUser = await Queries.createUserWithTeam({
      name: "Thanos Son",
      email: "thanos@son.com",
      password: "thanos",
      teamName: "Immortals"
    });

    const res = await performQuery({
      context: { user },
      query,
      variables: {
        id: otherTeamUser.id
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });

  it("able to remove team members", async () => {
    const teamUser = await Queries.putUser({
      name: "Minion 1",
      email: "minion1@despicable.com",
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

  it("not able to remove oneself from own team", async () => {
    const res = await performQuery({
      context: { user },
      query,
      variables: {
        id: user.id
      }
    });

    expect(JSON.stringify(res)).toMatchSnapshot();
  });
});

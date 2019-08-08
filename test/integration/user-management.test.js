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

    expect(res.errors[0].extensions).toMatchSnapshot();
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

    expect(res.errors[0].extensions).toMatchSnapshot();
  });

  // it('is not able to signup with taken email', async () => {
  //   const existingUser = await factory.create('user');

  //   const res = await performQuery({
  //     query: SIGNUP,
  //     variables: {
  //       input: {
  //         email: existingUser.email,
  //         name: 'Test User',
  //         password: 'testpassword',
  //         teamName: 'Test team'
  //       }
  //     }
  //   });

  //   expect(res.errors[0].extensions).toMatchSnapshot();
  // });

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
    expect(res.errors[0].extensions).toMatchSnapshot();
  });

  it("is able to login with correct credentials", async () => {
    await Queries.putUser({
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
    user = await Queries.putUser({
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

    expect(res.errors[0].extensions).toMatchSnapshot();
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
  beforeEach(async () => {
    user = await Queries.putUser({
      name: "John Doe",
      email: "john@doe.com",
      password: "password"
    });
  });

  // it('fails to update with invalid fields', async () => {
  //   const res = await performQuery({
  //     context: { user },
  //     query: UPDATE_USER,
  //     variables: {
  //       input: {
  //         name: '',
  //         email: 'hel@per',
  //         password: 'abc'
  //       }
  //     }
  //   });

  //   expect(res.errors[0].extensions).toMatchSnapshot();
  // });

  it("can update with valid fields", async () => {
    const res = await performQuery({
      context: { user },
      query: `
      mutation($input: UpdateUserInput!) {
        updateUser(input: $input) {
          name
          email
        }
      }
      `,
      variables: {
        input: {
          name: "New Doe",
          email: "new@doe.com"
        }
      }
    });
    expect(res).toMatchSnapshot();
  });

  // it('can update password', async () => {
  //   const res = await performQuery({
  //     context: { user },
  //     query: UPDATE_USER,
  //     variables: {
  //       input: {
  //         password: 'newpassword'
  //       }
  //     }
  //   });
  //   expect(res.data).toEqual({
  //     updateUser: {
  //       email: user.email,
  //       name: user.name
  //     }
  //   });

  //   const updatedUser = await User.query().findById(user.id);
  //   expect(updatedUser.validPassword('newpassword')).toBe(true);
  // });

  // it('fails to update with taken email', async () => {
  //   await factory.create('user', {
  //     email: 'taken@email.com'
  //   });

  //   const res = await performQuery({
  //     context: { user },
  //     query: UPDATE_USER,
  //     variables: {
  //       input: {
  //         email: 'taken@email.com'
  //       }
  //     }
  //   });
  //   expect(res.errors[0].extensions).toMatchSnapshot();
  // });
});

// describe('Deleting user', () => {
//   let user;
//   beforeEach(async () => {
//     user = await factory.create('user');
//   });

//   it('is able to delete user successfully', async () => {
//     const res = await performQuery({
//       context: { user },
//       query: DELETE_USER
//     });

//     expect(res).toMatchSnapshot({
//       data: {
//         deleteUser: {
//           id: expect.any(String)
//         }
//       }
//     });

//     const deletedUser = await User.query().findById(user.id);
//     expect(deletedUser).toBeUndefined();
//   });
// });

// describe('Requesting password reset', () => {
//   let user;
//   beforeEach(async () => {
//     user = await factory.create('user');
//   });

//   it('is not able to request forgot password if user doesnt exist', async () => {
//     const spy = jest.spyOn(sendgrid, 'sendEmail');

//     const res = await performQuery({
//       query: FORGOT_PASSWORD,
//       variables: {
//         input: {
//           email: 'weird+user@email.com'
//         }
//       }
//     });

//     expect(spy).not.toHaveBeenCalled();
//     expect(res).toMatchSnapshot();
//   });

//   it('is able to request forgot password successfully', async () => {
//     expect(user.resetPasswordToken).toBeUndefined();

//     const spy = jest.spyOn(sendgrid, 'sendEmail');
//     const res = await performQuery({
//       query: FORGOT_PASSWORD,
//       variables: {
//         input: {
//           email: user.email
//         }
//       }
//     });

//     const updatedUser = await User.query().findById(user.id);
//     expect(updatedUser.resetPasswordToken).toEqual(expect.any(String));

//     expect(spy).toHaveBeenCalled();
//     expect(res).toMatchSnapshot();
//   });
// });

// describe('Resetting password', () => {
//   let user;
//   beforeEach(async () => {
//     user = await factory.create('user');
//   });

//   it('is not able to reset password with mismatched password', async () => {
//     const res = await performQuery({
//       query: RESET_PASSWORD,
//       variables: {
//         input: {
//           password: 'newpassword',
//           repeatPassword: 'newpasswordtypo',
//           token: 'RESET-PASSWORD-TOKEN'
//         }
//       }
//     });

//     expect(res.errors[0].extensions).toMatchSnapshot();
//   });

//   it('is not able to reset password with missing token', async () => {
//     const res = await performQuery({
//       query: RESET_PASSWORD,
//       variables: {
//         input: {
//           password: 'newpassword',
//           repeatPassword: 'newpassword',
//           token: ''
//         }
//       }
//     });

//     expect(res.errors[0].extensions).toMatchSnapshot();
//   });

//   it('is not able to reset password with wrong token', async () => {
//     const res = await performQuery({
//       query: RESET_PASSWORD,
//       variables: {
//         input: {
//           password: 'newpassword',
//           repeatPassword: 'newpassword',
//           token: 'RESET-PASSWORD-TOKEN-WRONG'
//         }
//       }
//     });

//     expect(res.errors[0].extensions).toMatchSnapshot();
//   });

//   it('is able to reset password with correct token', async () => {
//     await User.query()
//       .findById(user.id)
//       .patch({
//         resetPasswordToken: 'RESET-TOKEN'
//       });

//     const res = await performQuery({
//       query: RESET_PASSWORD,
//       variables: {
//         input: {
//           password: 'newpassword',
//           repeatPassword: 'newpassword',
//           token: 'RESET-TOKEN'
//         }
//       }
//     });

//     expect(res).toMatchSnapshot();

//     const updatedUser = await User.query().findById(user.id);
//     expect(updatedUser.validPassword('newpassword')).toEqual(true);
//   });
// });

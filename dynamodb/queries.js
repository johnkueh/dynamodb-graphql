import uuidv4 from "uuid/v4";
import bcrypt from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import {
  fetchByKey,
  putByKey,
  putAndFetchByKey,
  updateByKey,
  deleteByKey,
  objectToExpression,
  TableName,
  client as dynamodb
} from "./helpers";

export const Queries = {
  fetchUserById: async userId => {
    const user = await fetchByKey({
      PK: userId,
      SK: "user"
    });
    return userObject(user);
  },
  fetchUserByEmail: async email => {
    const input = {
      GSI1PK: "user",
      GSI1SK: email
    };
    const params = {
      TableName,
      IndexName: "GSI1",
      ...objectToExpression("KeyConditionExpression", input)
    };
    const { Items } = await dynamodb.query(params).promise();
    return userObject(Items[0]);
  },
  putUser: async ({ email, password, ...input }) => {
    const PK = uuidv4();
    const SK = "user";
    await putByKey({
      PK,
      SK,
      input: {
        GSI1PK: "user",
        GSI1SK: email,
        tz: "America/Los_Angeles",
        password: bcrypt.hashSync(password, 10),
        ...input
      }
    });
    return Queries.fetchUserById(PK);
  },
  updateUser: async ({ id: userId, ...input }) => {
    const user = await updateByKey({
      PK: userId,
      SK: "user",
      input
    });
    return userObject(user);
  },
  deleteUser: async ({ id: userId }) => {
    await deleteByKey(userId);
    return { id: userId };
  },
  fetchTeamById: async teamId => {
    return fetchByKey({
      PK: teamId,
      SK: "team"
    });
  },
  putTeam: async input => {
    const PK = uuidv4();
    const SK = "team";
    return putAndFetchByKey({
      PK,
      SK,
      input
    });
  },
  updateTeam: ({ id: teamId, ...input }) => {
    return updateByKey({
      PK: teamId,
      SK: "team",
      input
    });
  },
  deleteTeam: async ({ id: teamId }) => {
    await deleteByKey(teamId);
    return { id: teamId };
  },
  fetchTeamUsers: async ({ teamId }) => {
    const params = {
      TableName,
      IndexName: "GSI2",
      KeyConditionExpression: "GSI2PK = :type and GSI2SK = :teamId",
      ExpressionAttributeValues: {
        ":type": "teamUser",
        ":teamId": id
      }
    };

    const { Items } = await dynamodb.query(params).promise();
    return Items;
  },
  addUserToTeam: async ({ user, team }) => {
    const params = {
      TableName,
      Key: {
        PK: user.id,
        SK: "user"
      },
      UpdateExpression: "set #GSI2PK = :GSI2PK, #GSI2SK = :GSI2SK",
      ExpressionAttributeNames: {
        "#GSI2PK": "GSI2PK",
        "#GSI2SK": "GSI2SK"
      },
      ExpressionAttributeValues: {
        ":GSI2PK": "teamUser",
        ":GSI2SK": team.id
      },
      ReturnValues: "ALL_NEW"
    };
    const { Attributes } = await dynamodb.update(params).promise();
    user.teamId = team.id;
    return Attributes;
  }
};

// User Helpers
const userObject = user => {
  if (user == null) return null;

  return {
    jwt: jsonwebtoken.sign({ id: user.PK, email: user.email }, "JWTSECRET"),
    validPassword: password => bcrypt.compareSync(password, user.password),
    teamId: user.GSI2SK,
    email: user.GSI1SK,
    ...user
  };
};

export default {
  Queries
};

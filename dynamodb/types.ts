import { APIGatewayProxyEvent } from "aws-lambda";

export interface User extends DynamodbItem {
  email: string;
  jwt: string;
  password: string;
  name?: string;
  tz?: string;
  teamId?: string;
  team?: Team;
  jwtWithOptions: JwtWithOptionsFunc;
  validPassword: ValidPasswordFunc;
}

export interface Team extends DynamodbItem {
  name: string;
  emoji: string;
  moods: boolean;
  recognition: boolean;
  users?: User[];
}

export interface Response extends DynamodbItem {
  submittedAt?: string;
  sentAt?: string;
  userId?: string;
  user?: User;
}

export interface Culture extends DynamodbItem {
  name?: string;
  teamId: string;
  cultureId: string;
  position: number;
}

export interface CultureValue extends Culture {}

export interface AddUserToTeamInput {
  user: User;
  team: Team;
}

export interface CultureInput {
  name: string;
  position: number;
}

export interface CreateResponseInput {
  userId: string;
  teamId: string;
  sentAt: string;
}

export interface UpdateResponseInput {
  id: string;
  submittedAt?: string;
  sentAt?: string;
  feeling?: string;
}

export interface FetchresponsesForTeamByDateRangeInput {
  teamId: string;
  fromDate: string;
  toDate: string;
}

export interface AddCultureToTeamInput {
  cultureId: string;
  teamId: string;
  position: number;
}

export interface RemoveCultureInput extends AddCultureToTeamInput {}

export interface AddCulturesToTeamInput {
  cultureIds: string[];
  teamId: string;
}

export interface CreateTeamInput {
  name: string;
  emoji?: string;
  moods?: boolean;
  recognition?: boolean;
}

export interface UpdateTeamInput {
  id: string;
  name?: string;
  emoji?: string;
  moods?: boolean;
  recognition?: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  tz: string;
}

export interface CreateUserWithTeamInput extends CreateUserInput {
  teamName: string;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  tz?: string;
}

export interface VerifiedToken {
  id: string;
  email: string;
}

export interface LambdaArguments {
  event: APIGatewayProxyEvent;
}

export interface UserContext {
  user: object | null;
}

export interface ServerContext {
  context: object;
}

export interface DynamodbItem {
  id: string;
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
}

type ItemProperty = string | boolean | number | undefined | null;
type JwtWithOptionsFunc = (options: Record<string, string>) => string;
type ValidPasswordFunc = (password: string) => boolean;

export interface Input {
  [key: string]: ItemProperty;
}

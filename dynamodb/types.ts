import { APIGatewayProxyEvent } from "aws-lambda";

// Response
export interface Response extends DynamodbItem {
  submittedAt?: string;
  sentAt?: string;
  userId?: string;
  user?: User;
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
  feeling?: string | null;
}
export interface FetchResponsesForTeamByDateRangeInput {
  teamId: string;
  fromDate: string;
  toDate: string;
}

// Culture
export interface Culture extends DynamodbItem {
  name?: string;
  teamId: string;
  cultureId: string;
  position: number;
}
export type CultureValue = Culture;
export interface CultureInput {
  name: string;
  position: number;
}
export interface AddCultureToTeamInput {
  cultureId: string;
  teamId: string;
  position: number;
}
export type RemoveCultureInput = AddCultureToTeamInput;
export interface AddCulturesToTeamInput {
  cultureIds: string[];
  teamId: string;
}

// Team
export interface Team extends DynamodbItem {
  name: string;
  emoji: string;
  moods: boolean;
  recognition: boolean;
  users?: User[];
}
export interface CreateTeamInput {
  name: string;
  emoji?: string;
  moods?: boolean;
  recognition?: boolean;
}
export interface UpdateTeamInput {
  id: string;
  name?: string | null;
  emoji?: string | null;
  moods?: boolean | null;
  recognition?: boolean | null;
  cultureValueIds?: string[];
}
export interface AddUserToTeamInput {
  user: User;
  team: Team;
}

// User
export interface User extends DynamodbItem {
  email: string;
  jwt: string;
  password: string;
  name?: string;
  tz?: string;
  teamId?: string;
  team?: Team;
  jwtWithOptions?: JwtWithOptionsFunc;
  validPassword?: ValidPasswordFunc;
}
export interface CreateUserInput {
  email: string;
  name: string;
  password?: string;
  tz?: string;
}
export interface UpdateUserInput {
  id: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  password?: string | null | undefined;
  tz?: string | null | undefined;
}
export interface CreateUserWithTeamInput extends CreateUserInput {
  teamName: string;
}
export interface VerifiedToken {
  id: string;
  email: string;
}

// Apollo server
export interface LambdaArguments {
  event: APIGatewayProxyEvent;
}
export interface Context {
  user: User | null;
}
export interface MakeServer {
  context: object;
}

// DynamoDB
export interface DynamodbItem {
  id: string;
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
}

type JwtWithOptionsFunc = (options: Record<string, string>) => string;
type ValidPasswordFunc = (password: string) => boolean;

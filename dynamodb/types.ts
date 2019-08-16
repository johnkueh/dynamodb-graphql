import { APIGatewayProxyEvent } from "aws-lambda";

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
  [key: string]: ItemProperty | Team | JwtWithOptionsFunc | ValidPasswordFunc;
}

export interface Team extends DynamodbItem {
  name: string;
  emoji: string;
  moods: boolean;
  recognition: boolean;
  users?: User[];
  [key: string]: ItemProperty | User[];
}

export interface Response extends DynamodbItem {
  sentAt?: string;
  userId?: string;
  user?: User;
  [key: string]: ItemProperty | User;
}

export interface Culture extends DynamodbItem {
  teamId: string;
  cultureId: string;
  position: number;
  [key: string]: ItemProperty;
}
export interface CultureValue extends Culture {
  name?: string;
}

export interface AddUserToTeamInput {
  user: User;
  team: Team;
}

export interface CultureInput {
  name?: string;
  position?: number;
}
export interface AddCultureInput {
  cultureId: string;
  teamId: string;
  position: number;
}

export interface RemoveCultureInput extends AddCultureInput {}

export interface AddCulturesInput {
  cultureIds: string[];
  teamId: string;
}

export interface UpdateTeamInput extends Input {
  id: string;
}

export interface TeamResponseByDateRangeInput {
  teamId: string;
  fromDate: string | undefined | null;
  toDate: string | undefined | null;
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

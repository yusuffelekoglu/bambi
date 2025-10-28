import type { IUser } from "./user";
export interface IAccount {
  id: string; //PK
  userId: IUser["id"];
  accountId?: string;
  providerId?: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: Date;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

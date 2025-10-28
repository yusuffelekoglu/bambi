import { IUser } from "./user";

export interface ISession {
  token: string;
  id: number; //PK
  userId: IUser["id"];
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

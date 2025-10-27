import type { IUser } from "./user";

export interface IPost {
  id: number; //PK
  title: string;
  body: string;
  authorId: IUser["id"];
  publishedAt?: Date;
  tags: string[];
}

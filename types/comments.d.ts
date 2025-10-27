import type { IPost } from "./post";
import type { IUser } from "./user";

export interface IComment {
  id: number; //PK
  postId: IPost["id"];
  authorId: IUser["id"];
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

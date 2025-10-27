export interface IUser {
  id: number; //UNIQUE
  username: string; //PK
  email: string; //UNIQUE
  createdAt: Date;
  updatedAt: Date;
}
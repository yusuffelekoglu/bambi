export interface IUser {
  id: string; //PK
  email: string; //UNIQUE
  name: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

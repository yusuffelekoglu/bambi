export interface IVerification {
    id: string; //PK
    identifier: string;
    value: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt?: Date;
}
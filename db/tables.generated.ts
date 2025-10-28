import { defineTable, column } from "astro:db";

export const User = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    email: column.text({ unique: true }),
    name: column.text(),
    emailVerified: column.boolean(),
    image: column.text({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

export const Session = defineTable({
  columns: {
    token: column.text(),
    id: column.number({ primaryKey: true }),
    userId: column.text({ references: () => User.columns.id }),
    expiresAt: column.date(),
    ipAddress: column.text({ optional: true }),
    userAgent: column.text({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

export const Account = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ references: () => User.columns.id }),
    accountId: column.text({ optional: true }),
    providerId: column.text({ optional: true }),
    accessToken: column.text({ optional: true }),
    refreshToken: column.text({ optional: true }),
    idToken: column.text({ optional: true }),
    expiresAt: column.date({ optional: true }),
    password: column.text({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

export const Verification = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    identifier: column.text(),
    value: column.text(),
    expiresAt: column.date(),
    createdAt: column.date(),
    updatedAt: column.date({ optional: true }),
  },
});

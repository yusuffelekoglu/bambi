import { defineTable, column } from "astro:db";

export const User = defineTable({
  columns: {
    id: column.number({ unique: true }),
    username: column.text({ primaryKey: true }),
    email: column.text({ unique: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

export const Post = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    title: column.text(),
    body: column.text(),
    authorId: column.number({ references: () => User.columns.id }),
    publishedAt: column.date({ optional: true }),
    tags: column.json(),
  },
});

export const Comment = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    postId: column.number({ references: () => Post.columns.id }),
    authorId: column.number({ references: () => User.columns.id }),
    content: column.text(),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

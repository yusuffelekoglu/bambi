import { db, User } from "astro:db";
// https://astro.build/db/seed
export default async function seed() {
  await db.insert(User).values([
    {
      id: 1,
      username: "alice",
      email: "alice@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      username: "bob",
      email: "bob@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

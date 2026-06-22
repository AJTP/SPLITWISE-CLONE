const { PrismaClient } = require("@prisma/client");
const app = require("../../app");

const prisma = new PrismaClient();

async function cleanDb() {
  await prisma.settlement.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
}

let tokenA, tokenB, userAId, userBId;

beforeEach(async () => {
  await cleanDb();

  const resA = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      name: "User A",
      email: "a@example.com",
      password: "password123",
    },
  });
  tokenA = resA.json().token;
  userAId = resA.json().user.id;

  const resB = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      name: "User B",
      email: "b@example.com",
      password: "password123",
    },
  });
  tokenB = resB.json().token;
  userBId = resB.json().user.id;
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await app.close();
});

describe("POST /users", () => {
  it("returns 201 with created user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "User C", email: "c@example.com" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("User C");
    expect(res.json().id).toBeDefined();
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "User D", email: "d@example.com" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /users", () => {
  it("returns the users", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/users",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    const users = res.json();
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe("User A");
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/users",
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /users/:id", () => {
  it("returns 200 with the user data", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/users",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "User C", email: "c@example.com" },
    });
    const userId = created.json().id;

    const res = await app.inject({
      method: "GET",
      url: `/users/${userId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(userId);
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/users/${userAId}`,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("PUT /users/:id", () => {
  it("returns 200 with updated user data", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/users/${userAId}`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Updated User A", email: "updated@example.com" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Updated User A");
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/users/${userAId}`,
      payload: { name: "Updated User A", email: "updated@example.com" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("DELETE /users/:id", () => {
  it("returns 204 when user is deleted", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/users",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "To Delete", email: "to.delete@example.com" },
    });
    const userId = created.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/users/${userId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it("returns 404 when user does not exist", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/users/nonexistent-id`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/users/${userAId}`,
    });
    expect(res.statusCode).toBe(401);
  });
});

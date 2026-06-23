const bcryptjs = require("bcryptjs");
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

let adminToken, userToken, userAId, userBId;

beforeEach(async () => {
  await cleanDb();

  // Create an ADMIN user directly (register always creates USER role)
  const hashedPassword = await bcryptjs.hash("adminpass123", 10);
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  const adminLogin = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "admin@example.com", password: "adminpass123" },
  });
  adminToken = adminLogin.json().token;

  // Regular USER via register
  const resA = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      name: "User A",
      email: "a@example.com",
      password: "password123",
    },
  });
  userToken = resA.json().token;
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
  userBId = resB.json().user.id;
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await app.close();
});

describe("POST /users", () => {
  it("returns 201 with created user (admin)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: "User C", email: "c@example.com" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("User C");
    expect(res.json().id).toBeDefined();
  });

  it("returns 403 for non-admin user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/users",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: "User C", email: "c@example.com" },
    });
    expect(res.statusCode).toBe(403);
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
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /users", () => {
  it("returns the users (admin)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/users",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const users = res.json();
    // admin + userA + userB
    expect(users.length).toBeGreaterThanOrEqual(2);
  });

  it("returns 403 for non-admin user", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/users",
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(403);
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
  it("returns 200 with the user data (admin)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/users/${userAId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(userAId);
  });

  it("returns 403 for non-admin user", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/users/${userAId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(403);
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
  it("returns 200 with updated user data (admin)", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/users/${userAId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: "Updated User A", email: "updated@example.com" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Updated User A");
  });

  it("returns 403 for non-admin user", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/users/${userAId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: "Hacked", email: "hacked@example.com" },
    });
    expect(res.statusCode).toBe(403);
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
  it("returns 204 when user is deleted (admin)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/users",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: "To Delete", email: "to.delete@example.com" },
    });
    const userId = created.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/users/${userId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it("returns 403 for non-admin user", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/users/${userBId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 when user does not exist", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/users/nonexistent-id`,
      headers: { authorization: `Bearer ${adminToken}` },
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

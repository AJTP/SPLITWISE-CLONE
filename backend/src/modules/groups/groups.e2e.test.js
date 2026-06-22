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

describe("POST /groups", () => {
  it("returns 201 with created group", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Trip", description: "Holiday trip" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("Trip");
    expect(res.json().id).toBeDefined();
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/groups",
      payload: { name: "Trip" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /groups", () => {
  it("returns only the groups the user belongs to", async () => {
    await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Group A" },
    });
    await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { name: "Group B" },
    });

    const res = await app.inject({
      method: "GET",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    const groups = res.json();
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Group A");
  });
});

describe("GET /groups/:id", () => {
  it("returns 200 when user is a member", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "My Group" },
    });
    const groupId = created.json().id;

    const res = await app.inject({
      method: "GET",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(groupId);
  });

  it("returns 403 when user is not a member", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "My Group" },
    });
    const groupId = created.json().id;

    const res = await app.inject({
      method: "GET",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("DELETE /groups/:id", () => {
  it("returns 204 when member deletes the group", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "To Delete" },
    });
    const groupId = created.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it("returns 403 when non-member tries to delete", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Protected" },
    });
    const groupId = created.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /groups/:id/members", () => {
  let groupId;

  beforeEach(async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Group" },
    });
    groupId = created.json().id;
  });

  it("returns 201 when adding a new member", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { userId: userBId },
    });
    expect(res.statusCode).toBe(201);
  });

  it("returns 409 when user is already a member", async () => {
    await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { userId: userBId },
    });
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { userId: userBId },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 403 when non-member tries to add someone", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { userId: userAId },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /groups/:id/members", () => {
  it("returns list of members (creator included)", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Group" },
    });
    const groupId = created.json().id;

    const res = await app.inject({
      method: "GET",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    const members = res.json();
    expect(members).toHaveLength(1);
    expect(members[0].user.email).toBe("a@example.com");
  });
});

describe("DELETE /groups/:id/members/:userId", () => {
  it("returns 204 when removing an existing member", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Group" },
    });
    const groupId = created.json().id;

    await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { userId: userBId },
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}/members/${userBId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(204);
  });

  it("returns 404 when removing a non-member", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/groups",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { name: "Group" },
    });
    const groupId = created.json().id;

    const res = await app.inject({
      method: "DELETE",
      url: `/groups/${groupId}/members/${userBId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

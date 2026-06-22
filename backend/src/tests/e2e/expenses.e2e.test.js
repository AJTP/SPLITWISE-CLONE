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

let tokenA, tokenB, userAId, userBId, groupId;

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

  const resGroup = await app.inject({
    method: "POST",
    url: "/groups",
    headers: { authorization: `Bearer ${tokenA}` },
    payload: { name: "Test Group" },
  });
  groupId = resGroup.json().id;

  await app.inject({
    method: "POST",
    url: `/groups/${groupId}/members`,
    headers: { authorization: `Bearer ${tokenA}` },
    payload: { userId: userBId },
  });
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await app.close();
});

describe("POST /groups/:id/expenses (EQUAL split)", () => {
  it("returns 201 with expense and participants", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        description: "Dinner",
        amount: 60,
        splitType: "EQUAL",
        participants: [{ userId: userAId }, { userId: userBId }],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.description).toBe("Dinner");
    expect(body.participants).toHaveLength(2);
    expect(body.paidBy.email).toBe("a@example.com");
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      payload: {
        description: "Dinner",
        amount: 60,
        participants: [{ userId: userAId }],
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when non-member creates expense", async () => {
    const resC = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "User C",
        email: "c@example.com",
        password: "password123",
      },
    });
    const tokenC = resC.json().token;

    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenC}` },
      payload: {
        description: "Dinner",
        amount: 60,
        splitType: "EQUAL",
        participants: [{ userId: userAId }],
      },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /groups/:id/expenses (EXACT split)", () => {
  it("returns 201 with correct share amounts", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        description: "Hotel",
        amount: 100,
        splitType: "EXACT",
        participants: [
          { userId: userAId, shareAmount: 70 },
          { userId: userBId, shareAmount: 30 },
        ],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    const sharesById = Object.fromEntries(
      body.participants.map((p) => [p.userId, p.shareAmount]),
    );
    expect(Number(sharesById[userAId])).toBe(70);
    expect(Number(sharesById[userBId])).toBe(30);
  });

  it("returns 400 when share amounts do not sum to total", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        description: "Hotel",
        amount: 100,
        splitType: "EXACT",
        participants: [
          { userId: userAId, shareAmount: 60 },
          { userId: userBId, shareAmount: 30 },
        ],
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /groups/:id/expenses", () => {
  it("returns 200 with list of expenses", async () => {
    await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        description: "Groceries",
        amount: 30,
        splitType: "EQUAL",
        participants: [{ userId: userAId }],
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(1);
  });

  it("returns 403 when non-member requests expenses", async () => {
    const resC = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "User C",
        email: "c@example.com",
        password: "password123",
      },
    });
    const tokenC = resC.json().token;

    const res = await app.inject({
      method: "GET",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenC}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /expenses/:id", () => {
  let expenseId;

  beforeEach(async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/expenses`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        description: "Groceries",
        amount: 30,
        splitType: "EQUAL",
        participants: [{ userId: userAId }],
      },
    });
    expenseId = res.json().id;
  });

  it("returns 200 with expense details", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/expenses/${expenseId}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(expenseId);
    expect(res.json().description).toBe("Groceries");
  });

  it("returns 403 when non-member requests expense", async () => {
    const resC = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "User C",
        email: "c@example.com",
        password: "password123",
      },
    });
    const tokenC = resC.json().token;

    const res = await app.inject({
      method: "GET",
      url: `/expenses/${expenseId}`,
      headers: { authorization: `Bearer ${tokenC}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 for non-existent expense", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/expenses/00000000-0000-0000-0000-000000000000",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

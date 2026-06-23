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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function register(name, email) {
  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name, email, password: "password123" },
  });
  return { token: res.json().token, userId: res.json().user.id };
}

async function createGroup(token, name = "Trip") {
  const res = await app.inject({
    method: "POST",
    url: "/groups",
    headers: { authorization: `Bearer ${token}` },
    payload: { name },
  });
  return res.json().id;
}

async function addMember(token, groupId, userId) {
  return app.inject({
    method: "POST",
    url: `/groups/${groupId}/members`,
    headers: { authorization: `Bearer ${token}` },
    payload: { userId },
  });
}

async function createSettlement(token, groupId, payload) {
  return app.inject({
    method: "POST",
    url: `/groups/${groupId}/settlements`,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    payload,
  });
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
let alice, bob, charlie, groupId;

beforeEach(async () => {
  await cleanDb();

  alice = await register("Alice", "alice@example.com");
  bob = await register("Bob", "bob@example.com");
  charlie = await register("Charlie", "charlie@example.com");

  groupId = await createGroup(alice.token, "Trip");
  await addMember(alice.token, groupId, bob.userId);
  await addMember(alice.token, groupId, charlie.userId);
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await app.close();
});

// ---------------------------------------------------------------------------
// Auth + access control
// ---------------------------------------------------------------------------
describe("Authentication and authorization", () => {
  it("returns 401 without a token", async () => {
    const res = await createSettlement(null, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 30,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 when requester is not a group member", async () => {
    const outsider = await register("Dave", "dave@example.com");
    const res = await createSettlement(outsider.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 30,
    });
    expect(res.statusCode).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
describe("Input validation", () => {
  it("returns 400 when amount is missing", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when amount is zero", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 0,
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when amount is negative", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: -10,
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when payerId is missing", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payeeId: alice.userId,
      amount: 30,
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when payeeId is missing", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      amount: 30,
    });
    expect(res.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Business rule violations
// ---------------------------------------------------------------------------
describe("Business rules", () => {
  it("returns 422 when payer and payee are the same user", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: bob.userId,
      amount: 30,
    });
    expect(res.statusCode).toBe(422);
  });

  it("returns 422 when payer is not a group member", async () => {
    const outsider = await register("Dave", "dave@example.com");
    const res = await createSettlement(alice.token, groupId, {
      payerId: outsider.userId,
      payeeId: alice.userId,
      amount: 30,
    });
    expect(res.statusCode).toBe(422);
  });

  it("returns 422 when payee is not a group member", async () => {
    const outsider = await register("Dave", "dave@example.com");
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: outsider.userId,
      amount: 30,
    });
    expect(res.statusCode).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// Successful creation
// ---------------------------------------------------------------------------
describe("Successful settlement creation", () => {
  it("returns 201 with correct shape", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 50,
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();

    expect(body).toMatchObject({
      id: expect.any(String),
      groupId,
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 50,
      notes: null,
      date: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it("persists notes when provided", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 25,
      notes: "Settling dinner",
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().notes).toBe("Settling dinner");
  });

  it("any group member can register a settlement (not just the payer)", async () => {
    // Charlie registers a settlement on behalf of Bob paying Alice
    const res = await createSettlement(charlie.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 15,
    });
    expect(res.statusCode).toBe(201);
  });

  it("settlement is stored in the database", async () => {
    const res = await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 40,
    });

    const id = res.json().id;
    const record = await prisma.settlement.findUnique({ where: { id } });

    expect(record).not.toBeNull();
    expect(Number(record.amount)).toBeCloseTo(40);
    expect(record.payerId).toBe(bob.userId);
    expect(record.payeeId).toBe(alice.userId);
    expect(record.groupId).toBe(groupId);
  });
});

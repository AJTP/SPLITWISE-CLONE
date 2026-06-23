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

async function createExpense(token, groupId, payload) {
  return app.inject({
    method: "POST",
    url: `/groups/${groupId}/expenses`,
    headers: { authorization: `Bearer ${token}` },
    payload,
  });
}

async function getBalances(token, groupId) {
  return app.inject({
    method: "GET",
    url: `/groups/${groupId}/balances`,
    headers: token ? { authorization: `Bearer ${token}` } : {},
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
    const res = await getBalances(null, groupId);
    expect(res.statusCode).toBe(401);
  });

  it("returns 403 for a non-member", async () => {
    const outsider = await register("Dave", "dave@example.com");
    const res = await getBalances(outsider.token, groupId);
    expect(res.statusCode).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Empty group
// ---------------------------------------------------------------------------
describe("Group with no expenses", () => {
  it("returns zero balances and no debts", async () => {
    const res = await getBalances(alice.token, groupId);

    expect(res.statusCode).toBe(200);
    const { balances, simplifiedDebts } = res.json();

    expect(simplifiedDebts).toHaveLength(0);
    expect(balances).toHaveLength(3);
    balances.forEach((b) => expect(b.amount).toBe(0));
  });
});

// ---------------------------------------------------------------------------
// Simple equal split
// ---------------------------------------------------------------------------
describe("Simple equal 3-way split", () => {
  it("Alice pays $90 → Alice +60, Bob -30, Charlie -30, 2 transactions", async () => {
    await createExpense(alice.token, groupId, {
      description: "Dinner",
      amount: 90,
      splitType: "EQUAL",
      participants: [
        { userId: alice.userId },
        { userId: bob.userId },
        { userId: charlie.userId },
      ],
    });

    const res = await getBalances(alice.token, groupId);
    expect(res.statusCode).toBe(200);

    const { balances, simplifiedDebts } = res.json();

    const aliceBal = balances.find((b) => b.userId === alice.userId);
    const bobBal = balances.find((b) => b.userId === bob.userId);
    const charlieBal = balances.find((b) => b.userId === charlie.userId);

    expect(aliceBal.amount).toBeCloseTo(60);
    expect(bobBal.amount).toBeCloseTo(-30);
    expect(charlieBal.amount).toBeCloseTo(-30);

    expect(simplifiedDebts).toHaveLength(2);
    simplifiedDebts.forEach((d) => expect(d.toUserId).toBe(alice.userId));
    expect(
      simplifiedDebts.find((d) => d.fromUserId === bob.userId).amount,
    ).toBeCloseTo(30);
    expect(
      simplifiedDebts.find((d) => d.fromUserId === charlie.userId).amount,
    ).toBeCloseTo(30);
  });
});

// ---------------------------------------------------------------------------
// Chain reduction
// ---------------------------------------------------------------------------
describe("Chain debt reduction", () => {
  it("A paid for [A+B], B paid for [B+C] → Charlie pays Alice directly (1 transaction)", async () => {
    // Alice pays $100, split equally with Bob → each $50
    await createExpense(alice.token, groupId, {
      description: "Hotel",
      amount: 100,
      splitType: "EQUAL",
      participants: [{ userId: alice.userId }, { userId: bob.userId }],
    });

    // Bob pays $100, split equally with Charlie → each $50
    await createExpense(bob.token, groupId, {
      description: "Flights",
      amount: 100,
      splitType: "EQUAL",
      participants: [{ userId: bob.userId }, { userId: charlie.userId }],
    });

    // Net: Alice +50, Bob 0, Charlie -50
    const res = await getBalances(alice.token, groupId);
    const { balances, simplifiedDebts } = res.json();

    const aliceBal = balances.find((b) => b.userId === alice.userId);
    const bobBal = balances.find((b) => b.userId === bob.userId);
    const charlieBal = balances.find((b) => b.userId === charlie.userId);

    expect(aliceBal.amount).toBeCloseTo(50);
    expect(bobBal.amount).toBeCloseTo(0);
    expect(charlieBal.amount).toBeCloseTo(-50);

    expect(simplifiedDebts).toHaveLength(1);
    expect(simplifiedDebts[0].fromUserId).toBe(charlie.userId);
    expect(simplifiedDebts[0].toUserId).toBe(alice.userId);
    expect(simplifiedDebts[0].amount).toBeCloseTo(50);
  });
});

// ---------------------------------------------------------------------------
// Cross-debt netting
// ---------------------------------------------------------------------------
describe("Cross-debt netting", () => {
  it("Alice fronts $30 for Bob, Bob fronts $20 for Alice → Bob owes Alice $10", async () => {
    // Alice pays $30, only Bob participates
    await createExpense(alice.token, groupId, {
      description: "Coffee",
      amount: 30,
      splitType: "EXACT",
      participants: [{ userId: bob.userId, shareAmount: 30 }],
    });

    // Bob pays $20, only Alice participates
    await createExpense(bob.token, groupId, {
      description: "Taxi",
      amount: 20,
      splitType: "EXACT",
      participants: [{ userId: alice.userId, shareAmount: 20 }],
    });

    const res = await getBalances(alice.token, groupId);
    const { balances, simplifiedDebts } = res.json();

    const aliceBal = balances.find((b) => b.userId === alice.userId);
    const bobBal = balances.find((b) => b.userId === bob.userId);

    expect(aliceBal.amount).toBeCloseTo(10);
    expect(bobBal.amount).toBeCloseTo(-10);

    expect(simplifiedDebts).toHaveLength(1);
    expect(simplifiedDebts[0].fromUserId).toBe(bob.userId);
    expect(simplifiedDebts[0].toUserId).toBe(alice.userId);
    expect(simplifiedDebts[0].amount).toBeCloseTo(10);
  });
});

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------
describe("Response shape", () => {
  it("includes userName and userEmail in both balances and simplifiedDebts", async () => {
    await createExpense(alice.token, groupId, {
      description: "Lunch",
      amount: 60,
      splitType: "EQUAL",
      participants: [{ userId: alice.userId }, { userId: bob.userId }],
    });

    const res = await getBalances(alice.token, groupId);
    const { balances, simplifiedDebts } = res.json();

    balances.forEach((b) => {
      expect(b).toHaveProperty("userName");
      expect(b).toHaveProperty("userEmail");
    });

    expect(simplifiedDebts[0]).toMatchObject({
      fromUserId: expect.any(String),
      fromUserName: expect.any(String),
      fromUserEmail: expect.any(String),
      toUserId: expect.any(String),
      toUserName: expect.any(String),
      toUserEmail: expect.any(String),
      amount: expect.any(Number),
    });
  });
});

// ---------------------------------------------------------------------------
// Settlements affect balances
// ---------------------------------------------------------------------------
async function createSettlement(token, groupId, payload) {
  return app.inject({
    method: "POST",
    url: `/groups/${groupId}/settlements`,
    headers: { authorization: `Bearer ${token}` },
    payload,
  });
}

describe("Settlements reduce outstanding balances", () => {
  it("full settlement zeroes both parties", async () => {
    // Alice pays $90 equal 3-way → Alice +60, Bob -30, Charlie -30
    await createExpense(alice.token, groupId, {
      description: "Dinner",
      amount: 90,
      splitType: "EQUAL",
      participants: [
        { userId: alice.userId },
        { userId: bob.userId },
        { userId: charlie.userId },
      ],
    });

    // Bob pays Alice $30 (fully settles Bob's debt)
    await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 30,
    });

    const res = await getBalances(alice.token, groupId);
    expect(res.statusCode).toBe(200);

    const { balances, simplifiedDebts } = res.json();
    const aliceBal = balances.find((b) => b.userId === alice.userId);
    const bobBal = balances.find((b) => b.userId === bob.userId);
    const charlieBal = balances.find((b) => b.userId === charlie.userId);

    expect(aliceBal.amount).toBeCloseTo(30); // 60 - 30
    expect(bobBal.amount).toBeCloseTo(0); // -30 + 30
    expect(charlieBal.amount).toBeCloseTo(-30); // unchanged

    // Only Charlie still owes Alice
    expect(simplifiedDebts).toHaveLength(1);
    expect(simplifiedDebts[0].fromUserId).toBe(charlie.userId);
    expect(simplifiedDebts[0].toUserId).toBe(alice.userId);
  });

  it("all debts settled → zero balances and no simplified debts", async () => {
    await createExpense(alice.token, groupId, {
      description: "Hotel",
      amount: 90,
      splitType: "EQUAL",
      participants: [
        { userId: alice.userId },
        { userId: bob.userId },
        { userId: charlie.userId },
      ],
    });

    await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 30,
    });
    await createSettlement(alice.token, groupId, {
      payerId: charlie.userId,
      payeeId: alice.userId,
      amount: 30,
    });

    const res = await getBalances(alice.token, groupId);
    const { balances, simplifiedDebts } = res.json();

    balances.forEach((b) => expect(b.amount).toBeCloseTo(0));
    expect(simplifiedDebts).toHaveLength(0);
  });

  it("partial settlement keeps remaining debt in simplifiedDebts", async () => {
    await createExpense(alice.token, groupId, {
      description: "Groceries",
      amount: 60,
      splitType: "EQUAL",
      participants: [{ userId: alice.userId }, { userId: bob.userId }],
    });
    // Alice +30, Bob -30
    // Bob partially pays $10
    await createSettlement(alice.token, groupId, {
      payerId: bob.userId,
      payeeId: alice.userId,
      amount: 10,
      notes: "partial payment",
    });

    const res = await getBalances(alice.token, groupId);
    const { balances, simplifiedDebts } = res.json();

    const aliceBal = balances.find((b) => b.userId === alice.userId);
    const bobBal = balances.find((b) => b.userId === bob.userId);

    expect(aliceBal.amount).toBeCloseTo(20);
    expect(bobBal.amount).toBeCloseTo(-20);

    expect(simplifiedDebts).toHaveLength(1);
    expect(simplifiedDebts[0].amount).toBeCloseTo(20);
  });
});

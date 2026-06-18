const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
let hashedPassword;

async function cleanDb() {
  await prisma.settlement.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
}

async function createBaseData() {
  const payer = await prisma.user.create({
    data: {
      email: "payer@example.com",
      name: "Payer",
      password: hashedPassword,
    },
  });
  const payee = await prisma.user.create({
    data: {
      email: "payee@example.com",
      name: "Payee",
      password: hashedPassword,
    },
  });
  const group = await prisma.group.create({
    data: { name: "Settlement Group" },
  });
  await prisma.groupMember.createMany({
    data: [
      { userId: payer.id, groupId: group.id },
      { userId: payee.id, groupId: group.id },
    ],
  });
  const expense = await prisma.expense.create({
    data: {
      description: "Shared expense",
      amount: 120.0,
      paidById: payee.id,
      groupId: group.id,
    },
  });
  const debt1 = await prisma.debt.create({
    data: {
      creditorId: payee.id,
      debtorId: payer.id,
      amount: 60.0,
      groupId: group.id,
      expenseId: expense.id,
    },
  });
  const debt2 = await prisma.debt.create({
    data: {
      creditorId: payee.id,
      debtorId: payer.id,
      amount: 60.0,
      groupId: group.id,
    },
  });
  return { payer, payee, group, debt1, debt2 };
}

beforeAll(async () => {
  hashedPassword = await bcryptjs.hash("password123", SALT_ROUNDS);
});

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("Settlement model", () => {
  it("creates a settlement between two users", async () => {
    const { payer, payee } = await createBaseData();

    const settlement = await prisma.settlement.create({
      data: { payerId: payer.id, payeeId: payee.id, amount: 120.0 },
    });

    expect(settlement.id).toBeDefined();
    expect(settlement.payerId).toBe(payer.id);
    expect(settlement.payeeId).toBe(payee.id);
    expect(Number(settlement.amount)).toBe(120.0);
    expect(settlement.date).toBeInstanceOf(Date);
  });

  it("stores an optional notes field", async () => {
    const { payer, payee } = await createBaseData();

    const settlement = await prisma.settlement.create({
      data: {
        payerId: payer.id,
        payeeId: payee.id,
        amount: 50.0,
        notes: "Paying back dinner",
      },
    });

    expect(settlement.notes).toBe("Paying back dinner");
  });

  it("links to debts via many-to-many", async () => {
    const { payer, payee, debt1, debt2 } = await createBaseData();

    const settlement = await prisma.settlement.create({
      data: {
        payerId: payer.id,
        payeeId: payee.id,
        amount: 120.0,
        debts: { connect: [{ id: debt1.id }, { id: debt2.id }] },
      },
      include: { debts: true },
    });

    expect(settlement.debts).toHaveLength(2);
    const debtIds = settlement.debts.map((d) => d.id);
    expect(debtIds).toContain(debt1.id);
    expect(debtIds).toContain(debt2.id);
  });

  it("resolves the back-relation from debt to settlements", async () => {
    const { payer, payee, debt1 } = await createBaseData();

    await prisma.settlement.create({
      data: {
        payerId: payer.id,
        payeeId: payee.id,
        amount: 60.0,
        debts: { connect: [{ id: debt1.id }] },
      },
    });

    const debtWithSettlements = await prisma.debt.findUnique({
      where: { id: debt1.id },
      include: { settlements: true },
    });

    expect(debtWithSettlements.settlements).toHaveLength(1);
    expect(Number(debtWithSettlements.settlements[0].amount)).toBe(60.0);
  });

  it("links to a group (optional)", async () => {
    const { payer, payee, group } = await createBaseData();

    const settlement = await prisma.settlement.create({
      data: {
        payerId: payer.id,
        payeeId: payee.id,
        amount: 30.0,
        groupId: group.id,
      },
      include: { group: true },
    });

    expect(settlement.groupId).toBe(group.id);
    expect(settlement.group.name).toBe("Settlement Group");
  });

  it("resolves payer and payee relations", async () => {
    const { payer, payee } = await createBaseData();

    const settlement = await prisma.settlement.create({
      data: { payerId: payer.id, payeeId: payee.id, amount: 75.0 },
      include: { payer: true, payee: true },
    });

    expect(settlement.payer.name).toBe("Payer");
    expect(settlement.payee.name).toBe("Payee");
  });
});

const { PrismaClient } = require("@prisma/client");

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

async function createBaseData() {
  const creditor = await prisma.user.create({
    data: { email: "creditor@example.com", name: "Creditor" },
  });
  const debtor = await prisma.user.create({
    data: { email: "debtor@example.com", name: "Debtor" },
  });
  const group = await prisma.group.create({ data: { name: "Debt Group" } });
  await prisma.groupMember.createMany({
    data: [
      { userId: creditor.id, groupId: group.id },
      { userId: debtor.id, groupId: group.id },
    ],
  });
  const expense = await prisma.expense.create({
    data: {
      description: "Shared expense",
      amount: 100.0,
      paidById: creditor.id,
      groupId: group.id,
    },
  });
  return { creditor, debtor, group, expense };
}

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("Debt model", () => {
  it("creates a debt between two users", async () => {
    const { creditor, debtor } = await createBaseData();

    const debt = await prisma.debt.create({
      data: {
        creditorId: creditor.id,
        debtorId: debtor.id,
        amount: 50.0,
      },
    });

    expect(debt.id).toBeDefined();
    expect(debt.creditorId).toBe(creditor.id);
    expect(debt.debtorId).toBe(debtor.id);
    expect(Number(debt.amount)).toBe(50.0);
  });

  it("defaults isSettled to false", async () => {
    const { creditor, debtor } = await createBaseData();

    const debt = await prisma.debt.create({
      data: {
        creditorId: creditor.id,
        debtorId: debtor.id,
        amount: 30.0,
      },
    });

    expect(debt.isSettled).toBe(false);
  });

  it("can be marked as settled", async () => {
    const { creditor, debtor } = await createBaseData();

    const debt = await prisma.debt.create({
      data: { creditorId: creditor.id, debtorId: debtor.id, amount: 25.0 },
    });

    const settled = await prisma.debt.update({
      where: { id: debt.id },
      data: { isSettled: true },
    });

    expect(settled.isSettled).toBe(true);
  });

  it("links to a group and expense (optional)", async () => {
    const { creditor, debtor, group, expense } = await createBaseData();

    const debt = await prisma.debt.create({
      data: {
        creditorId: creditor.id,
        debtorId: debtor.id,
        amount: 50.0,
        groupId: group.id,
        expenseId: expense.id,
      },
      include: { group: true, expense: true },
    });

    expect(debt.groupId).toBe(group.id);
    expect(debt.expenseId).toBe(expense.id);
    expect(debt.group.name).toBe("Debt Group");
    expect(debt.expense.description).toBe("Shared expense");
  });

  it("resolves creditor and debtor relations", async () => {
    const { creditor, debtor } = await createBaseData();

    const debt = await prisma.debt.create({
      data: { creditorId: creditor.id, debtorId: debtor.id, amount: 40.0 },
      include: { creditor: true, debtor: true },
    });

    expect(debt.creditor.name).toBe("Creditor");
    expect(debt.debtor.name).toBe("Debtor");
  });

  it("sets groupId/expenseId to null when group or expense is deleted", async () => {
    const { creditor, debtor, group, expense } = await createBaseData();

    const debt = await prisma.debt.create({
      data: {
        creditorId: creditor.id,
        debtorId: debtor.id,
        amount: 50.0,
        groupId: group.id,
        expenseId: expense.id,
      },
    });

    // Deleting the expense should set expenseId to null (SetNull)
    await prisma.expense.delete({ where: { id: expense.id } });

    const updated = await prisma.debt.findUnique({ where: { id: debt.id } });
    expect(updated.expenseId).toBeNull();
  });
});

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
  const user1 = await prisma.user.create({
    data: { email: "payer@example.com", name: "Payer" },
  });
  const user2 = await prisma.user.create({
    data: { email: "participant@example.com", name: "Participant" },
  });
  const group = await prisma.group.create({ data: { name: "Expense Group" } });
  await prisma.groupMember.createMany({
    data: [
      { userId: user1.id, groupId: group.id },
      { userId: user2.id, groupId: group.id },
    ],
  });
  return { user1, user2, group };
}

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("Expense model", () => {
  it("creates an expense linked to a payer and group", async () => {
    const { user1, group } = await createBaseData();

    const expense = await prisma.expense.create({
      data: {
        description: "Dinner",
        amount: 60.0,
        paidById: user1.id,
        groupId: group.id,
      },
    });

    expect(expense.id).toBeDefined();
    expect(expense.description).toBe("Dinner");
    expect(Number(expense.amount)).toBe(60.0);
    expect(expense.paidById).toBe(user1.id);
    expect(expense.groupId).toBe(group.id);
    expect(expense.date).toBeInstanceOf(Date);
  });

  it("resolves the paidBy relation", async () => {
    const { user1, group } = await createBaseData();

    const expense = await prisma.expense.create({
      data: {
        description: "Lunch",
        amount: 40.0,
        paidById: user1.id,
        groupId: group.id,
      },
      include: { paidBy: true },
    });

    expect(expense.paidBy.id).toBe(user1.id);
    expect(expense.paidBy.name).toBe("Payer");
  });

  it("creates expense participants with EQUAL split type", async () => {
    const { user1, user2, group } = await createBaseData();

    const expense = await prisma.expense.create({
      data: {
        description: "Groceries",
        amount: 100.0,
        paidById: user1.id,
        groupId: group.id,
        participants: {
          create: [
            { userId: user1.id, shareAmount: 50.0, splitType: "EQUAL" },
            { userId: user2.id, shareAmount: 50.0, splitType: "EQUAL" },
          ],
        },
      },
      include: { participants: true },
    });

    expect(expense.participants).toHaveLength(2);
    expense.participants.forEach((p) => {
      expect(p.splitType).toBe("EQUAL");
      expect(Number(p.shareAmount)).toBe(50.0);
    });
  });

  it("creates expense participants with EXACT split type", async () => {
    const { user1, user2, group } = await createBaseData();

    const expense = await prisma.expense.create({
      data: {
        description: "Utilities",
        amount: 150.0,
        paidById: user1.id,
        groupId: group.id,
        participants: {
          create: [
            { userId: user1.id, shareAmount: 100.0, splitType: "EXACT" },
            { userId: user2.id, shareAmount: 50.0, splitType: "EXACT" },
          ],
        },
      },
      include: { participants: true },
    });

    const p1 = expense.participants.find((p) => p.userId === user1.id);
    const p2 = expense.participants.find((p) => p.userId === user2.id);

    expect(p1.splitType).toBe("EXACT");
    expect(Number(p1.shareAmount)).toBe(100.0);
    expect(Number(p2.shareAmount)).toBe(50.0);
  });

  it("prevents duplicate participant on the same expense", async () => {
    const { user1, group } = await createBaseData();

    const expense = await prisma.expense.create({
      data: {
        description: "Duplicate test",
        amount: 20.0,
        paidById: user1.id,
        groupId: group.id,
      },
    });

    await prisma.expenseParticipant.create({
      data: { expenseId: expense.id, userId: user1.id, shareAmount: 20.0 },
    });

    await expect(
      prisma.expenseParticipant.create({
        data: { expenseId: expense.id, userId: user1.id, shareAmount: 20.0 },
      }),
    ).rejects.toThrow();
  });

  it("cascades delete to participants when expense is deleted", async () => {
    const { user1, user2, group } = await createBaseData();

    const expense = await prisma.expense.create({
      data: {
        description: "Cascade expense",
        amount: 80.0,
        paidById: user1.id,
        groupId: group.id,
        participants: {
          create: [
            { userId: user1.id, shareAmount: 40.0 },
            { userId: user2.id, shareAmount: 40.0 },
          ],
        },
      },
    });

    await prisma.expense.delete({ where: { id: expense.id } });

    const participants = await prisma.expenseParticipant.findMany({
      where: { expenseId: expense.id },
    });
    expect(participants).toHaveLength(0);
  });

  it("cascades delete to expenses when group is deleted", async () => {
    const { user1, group } = await createBaseData();

    const expense = await prisma.expense.create({
      data: {
        description: "Group cascade expense",
        amount: 50.0,
        paidById: user1.id,
        groupId: group.id,
        participants: {
          create: [{ userId: user1.id, shareAmount: 50.0 }],
        },
      },
    });

    await prisma.group.delete({ where: { id: group.id } });

    const foundExpense = await prisma.expense.findUnique({
      where: { id: expense.id },
    });
    const participants = await prisma.expenseParticipant.findMany({
      where: { expenseId: expense.id },
    });

    expect(foundExpense).toBeNull();
    expect(participants).toHaveLength(0);
  });
});

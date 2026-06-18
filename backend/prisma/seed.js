const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean tables in FK-safe order
  await prisma.settlement.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const user1 = await prisma.user.create({
    data: { email: "john@example.com", name: "John Doe" },
  });

  const user2 = await prisma.user.create({
    data: { email: "jane@example.com", name: "Jane Smith" },
  });

  const user3 = await prisma.user.create({
    data: { email: "bob@example.com", name: "Bob Johnson" },
  });

  // Groups
  const group1 = await prisma.group.create({
    data: {
      name: "Apartment Expenses",
      description: "Shared expenses for the apartment",
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: "Vacation Trip",
      description: "Trip to the beach expenses",
    },
  });

  // Group members
  await prisma.groupMember.createMany({
    data: [
      { userId: user1.id, groupId: group1.id },
      { userId: user2.id, groupId: group1.id },
      { userId: user3.id, groupId: group1.id },
      { userId: user1.id, groupId: group2.id },
      { userId: user2.id, groupId: group2.id },
    ],
  });

  // Expenses
  const expense1 = await prisma.expense.create({
    data: {
      description: "Groceries",
      amount: 90.0,
      paidById: user1.id,
      groupId: group1.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 30.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 30.0, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 30.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      description: "Hotel",
      amount: 200.0,
      paidById: user1.id,
      groupId: group2.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 100.0, splitType: "EXACT" },
          { userId: user2.id, shareAmount: 100.0, splitType: "EXACT" },
        ],
      },
    },
  });

  // Debts
  const debt1 = await prisma.debt.create({
    data: {
      creditorId: user1.id,
      debtorId: user2.id,
      amount: 30.0,
      groupId: group1.id,
      expenseId: expense1.id,
    },
  });

  const debt2 = await prisma.debt.create({
    data: {
      creditorId: user1.id,
      debtorId: user3.id,
      amount: 30.0,
      groupId: group1.id,
      expenseId: expense1.id,
    },
  });

  const debt3 = await prisma.debt.create({
    data: {
      creditorId: user1.id,
      debtorId: user2.id,
      amount: 100.0,
      groupId: group2.id,
      expenseId: expense2.id,
    },
  });

  // Settlement (user2 pays user1 for apartment + vacation debts)
  await prisma.settlement.create({
    data: {
      payerId: user2.id,
      payeeId: user1.id,
      amount: 130.0,
      notes: "Paying back groceries + hotel",
      groupId: group1.id,
      debts: {
        connect: [{ id: debt1.id }, { id: debt3.id }],
      },
    },
  });

  console.log("✅ Seed completed successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

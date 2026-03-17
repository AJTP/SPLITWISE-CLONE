const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Crear usuarios de ejemplo
  const user1 = await prisma.user.create({
    data: {
      email: "john@example.com",
      name: "John Doe",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane@example.com",
      name: "Jane Smith",
    },
  });

  // Crear grupos de ejemplo
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

  // Crear gastos de ejemplo
  const expense1 = await prisma.expense.create({
    data: {
      description: "Groceries",
      amount: 45.67,
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      description: "Utilities",
      amount: 120.0,
    },
  });

  console.log("✅ Seed completed successfully");
  console.log({
    users: [user1, user2],
    groups: [group1, group2],
    expenses: [expense1, expense2],
  });
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

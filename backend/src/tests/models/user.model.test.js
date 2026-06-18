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

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("User model", () => {
  it("creates a user with required fields", async () => {
    const user = await prisma.user.create({
      data: { email: "test@example.com", name: "Test User" },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe("test@example.com");
    expect(user.name).toBe("Test User");
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it("finds a user by id", async () => {
    const created = await prisma.user.create({
      data: { email: "find@example.com", name: "Find Me" },
    });

    const found = await prisma.user.findUnique({ where: { id: created.id } });

    expect(found).not.toBeNull();
    expect(found.email).toBe("find@example.com");
  });

  it("finds a user by email", async () => {
    await prisma.user.create({
      data: { email: "byemail@example.com", name: "Email User" },
    });

    const found = await prisma.user.findUnique({
      where: { email: "byemail@example.com" },
    });

    expect(found).not.toBeNull();
    expect(found.name).toBe("Email User");
  });

  it("updates a user name", async () => {
    const user = await prisma.user.create({
      data: { email: "update@example.com", name: "Old Name" },
    });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: "New Name" },
    });

    expect(updated.name).toBe("New Name");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      user.updatedAt.getTime(),
    );
  });

  it("deletes a user", async () => {
    const user = await prisma.user.create({
      data: { email: "delete@example.com", name: "Delete Me" },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found).toBeNull();
  });

  it("throws on duplicate email", async () => {
    await prisma.user.create({
      data: { email: "dup@example.com", name: "User 1" },
    });

    await expect(
      prisma.user.create({
        data: { email: "dup@example.com", name: "User 2" },
      }),
    ).rejects.toThrow();
  });
});

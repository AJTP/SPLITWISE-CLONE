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

describe("Group model", () => {
  it("creates a group with required fields", async () => {
    const group = await prisma.group.create({
      data: { name: "Test Group" },
    });

    expect(group.id).toBeDefined();
    expect(group.name).toBe("Test Group");
    expect(group.description).toBeNull();
    expect(group.createdAt).toBeInstanceOf(Date);
  });

  it("creates a group with an optional description", async () => {
    const group = await prisma.group.create({
      data: { name: "Described Group", description: "A description" },
    });

    expect(group.description).toBe("A description");
  });

  it("adds members to a group", async () => {
    const user1 = await prisma.user.create({
      data: { email: "u1@example.com", name: "User 1" },
    });
    const user2 = await prisma.user.create({
      data: { email: "u2@example.com", name: "User 2" },
    });
    const group = await prisma.group.create({
      data: { name: "Members Group" },
    });

    await prisma.groupMember.createMany({
      data: [
        { userId: user1.id, groupId: group.id },
        { userId: user2.id, groupId: group.id },
      ],
    });

    const members = await prisma.groupMember.findMany({
      where: { groupId: group.id },
    });

    expect(members).toHaveLength(2);
  });

  it("prevents duplicate group membership", async () => {
    const user = await prisma.user.create({
      data: { email: "dup@example.com", name: "Dup User" },
    });
    const group = await prisma.group.create({ data: { name: "Group" } });

    await prisma.groupMember.create({
      data: { userId: user.id, groupId: group.id },
    });

    await expect(
      prisma.groupMember.create({
        data: { userId: user.id, groupId: group.id },
      }),
    ).rejects.toThrow();
  });

  it("cascades delete to group members when group is deleted", async () => {
    const user = await prisma.user.create({
      data: { email: "cascade@example.com", name: "Cascade User" },
    });
    const group = await prisma.group.create({
      data: { name: "Cascade Group" },
    });

    await prisma.groupMember.create({
      data: { userId: user.id, groupId: group.id },
    });

    await prisma.group.delete({ where: { id: group.id } });

    const members = await prisma.groupMember.findMany({
      where: { groupId: group.id },
    });
    expect(members).toHaveLength(0);
  });
});

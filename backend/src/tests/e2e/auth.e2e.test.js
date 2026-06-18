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

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await app.close();
});

describe("POST /auth/register", () => {
  it("returns 201 with token and user (no password)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe("alice@example.com");
    expect(body.user.name).toBe("Alice");
    expect(body.user.password).toBeUndefined();
  });

  it("returns 409 on duplicate email", async () => {
    const payload = {
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    };
    await app.inject({ method: "POST", url: "/auth/register", payload });

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload,
    });

    expect(res.statusCode).toBe(409);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "noname@example.com" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Bob", email: "bob@example.com", password: "short" },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      },
    });
  });

  it("returns 200 with token and user on valid credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "alice@example.com", password: "password123" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe("alice@example.com");
    expect(body.user.password).toBeUndefined();
  });

  it("returns 401 on wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "alice@example.com", password: "wrongpassword" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("returns 401 on unknown email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "ghost@example.com", password: "password123" },
    });

    expect(res.statusCode).toBe(401);
  });
});

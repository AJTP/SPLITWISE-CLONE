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

let tokenA, tokenB, userBId, groupId, inviteToken;

beforeEach(async () => {
  await cleanDb();

  const resA = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    },
  });
  tokenA = resA.json().token;

  const resB = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name: "Bob", email: "bob@example.com", password: "password123" },
  });
  tokenB = resB.json().token;
  userBId = resB.json().user.id;

  // Alice creates a group
  const groupRes = await app.inject({
    method: "POST",
    url: "/groups",
    headers: { authorization: `Bearer ${tokenA}` },
    payload: { name: "Road Trip", description: "Weekend getaway" },
  });
  groupId = groupRes.json().id;

  // Add a guest alias for Bob (before he registers/joins)
  await app.inject({
    method: "POST",
    url: `/groups/${groupId}/members`,
    headers: { authorization: `Bearer ${tokenA}` },
    payload: { alias: "Bob" },
  });

  // Generate invite token
  const inviteRes = await app.inject({
    method: "POST",
    url: `/groups/${groupId}/invite`,
    headers: { authorization: `Bearer ${tokenA}` },
  });
  inviteToken = inviteRes.json().inviteToken;
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
  await app.close();
});

describe("POST /groups/:id/invite", () => {
  it("returns 200 with an inviteToken", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/invite`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().inviteToken).toBeDefined();
  });

  it("returns 403 for a non-member", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/invite`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/groups/${groupId}/invite`,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /invitations/:token", () => {
  it("returns group info and member list with claimed status (public)", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/invitations/${inviteToken}`,
      // No auth header — public endpoint
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.group.name).toBe("Road Trip");
    expect(body.members).toHaveLength(2); // Alice (claimed) + Bob (unclaimed)

    const alice = body.members.find((m) => m.alias === "Alice");
    const bob = body.members.find((m) => m.alias === "Bob");
    expect(alice.claimed).toBe(true);
    expect(bob.claimed).toBe(false);
  });

  it("returns 404 for an invalid token", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/invitations/00000000-0000-0000-0000-000000000000`,
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /invitations/:token/claim", () => {
  let bobMemberId;

  beforeEach(async () => {
    const info = await app.inject({
      method: "GET",
      url: `/invitations/${inviteToken}`,
    });
    const bob = info.json().members.find((m) => m.alias === "Bob");
    bobMemberId = bob.id;
  });

  it("returns 200 and links the user to the alias", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invitations/${inviteToken}/claim`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { memberId: bobMemberId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().userId).toBe(userBId);
    expect(res.json().alias).toBe("Bob");
  });

  it("returns 409 when alias is already claimed", async () => {
    // Bob claims first
    await app.inject({
      method: "POST",
      url: `/invitations/${inviteToken}/claim`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { memberId: bobMemberId },
    });

    // Bob tries again
    const res = await app.inject({
      method: "POST",
      url: `/invitations/${inviteToken}/claim`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { memberId: bobMemberId },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 409 when user is already a member via another slot", async () => {
    // Bob claims his slot
    await app.inject({
      method: "POST",
      url: `/invitations/${inviteToken}/claim`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { memberId: bobMemberId },
    });

    // Add another guest and Bob tries to claim it too
    await app.inject({
      method: "POST",
      url: `/groups/${groupId}/members`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { alias: "Robert" },
    });
    const info = await app.inject({
      method: "GET",
      url: `/invitations/${inviteToken}`,
    });
    const robert = info.json().members.find((m) => m.alias === "Robert");

    const res = await app.inject({
      method: "POST",
      url: `/invitations/${inviteToken}/claim`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { memberId: robert.id },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 401 without token", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invitations/${inviteToken}/claim`,
      payload: { memberId: bobMemberId },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 404 for invalid token", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/invitations/00000000-0000-0000-0000-000000000000/claim`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { memberId: bobMemberId },
    });
    expect(res.statusCode).toBe(404);
  });
});

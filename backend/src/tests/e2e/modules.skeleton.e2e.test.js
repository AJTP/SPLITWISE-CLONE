const app = require("../../app");

afterAll(async () => {
  await app.close();
});

const modules = [
  { method: "GET", url: "/users/" },
  { method: "GET", url: "/groups/" },
  { method: "GET", url: "/expenses/" },
  { method: "GET", url: "/settlements/" },
  { method: "GET", url: "/balances/some-id" },
  { method: "POST", url: "/auth/register" },
  { method: "POST", url: "/auth/login" },
];

describe("Module skeleton routes", () => {
  test.each(modules)(
    "$method $url returns 501 not implemented",
    async ({ method, url }) => {
      const response = await app.inject({ method, url });

      expect(response.statusCode).toBe(501);
      expect(response.json()).toEqual({ message: "not implemented" });
    },
  );
});

describe("Global error handler", () => {
  it("returns structured JSON on unhandled errors", async () => {
    // 404 for unknown route — Fastify's built-in not found handler returns JSON
    const response = await app.inject({
      method: "GET",
      url: "/this-route-does-not-exist",
    });

    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body).toHaveProperty("message");
  });
});

const app = require("../../app");

describe("GET /health", () => {
  afterAll(async () => {
    await app.close();
  });

  it("returns status ok ", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: "connected" });
  });
});

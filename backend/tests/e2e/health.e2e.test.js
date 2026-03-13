const app = require("../../src/app");

describe("GET /", () => {
  afterAll(async () => {
    await app.close();
  });

  it("devuelve hello mundo", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ hello: "mundo" });
  });
});

const { add } = require("./math");

describe("add", () => {
  it("suma dos números correctamente", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("suma números negativos", () => {
    expect(add(-1, -2)).toBe(-3);
  });
});

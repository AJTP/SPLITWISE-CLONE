jest.mock("../../modules/auth/auth.repository");

const authRepository = require("../../modules/auth/auth.repository");
const authService = require("../../modules/auth/auth.service");

describe("auth.service — register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hashes the password and returns token + user without password", async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    authRepository.createUser.mockResolvedValue({
      id: "uuid-1",
      email: "test@example.com",
      name: "Test",
      password: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.register({
      name: "Test",
      email: "test@example.com",
      password: "password123",
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
    expect(result.user.password).toBeUndefined();

    const { password } = authRepository.createUser.mock.calls[0][0];
    expect(password).not.toBe("password123");
    expect(password.length).toBeGreaterThan(20);
  });

  it("throws 409 when email is already taken", async () => {
    authRepository.findUserByEmail.mockResolvedValue({ id: "existing" });

    await expect(
      authService.register({
        name: "X",
        email: "taken@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(authRepository.createUser).not.toHaveBeenCalled();
  });
});

describe("auth.service — login", () => {
  const hashedPassword = require("bcryptjs").hashSync("correctpassword", 10);
  const mockUser = {
    id: "uuid-1",
    email: "user@example.com",
    name: "User",
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns token + user when credentials are correct", async () => {
    authRepository.findUserByEmail.mockResolvedValue(mockUser);

    const result = await authService.login({
      email: "user@example.com",
      password: "correctpassword",
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("user@example.com");
    expect(result.user.password).toBeUndefined();
  });

  it("throws 401 when password is wrong", async () => {
    authRepository.findUserByEmail.mockResolvedValue(mockUser);

    await expect(
      authService.login({
        email: "user@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when email is unknown (no user enumeration)", async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: "ghost@example.com", password: "anything" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

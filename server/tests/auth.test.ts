import { describe, it, expect } from "vitest";
import { createTestApp, registerUser } from "./helpers";

describe("POST /v1/auth/register", () => {
  it("registers a new user successfully", async () => {
    const agent = createTestApp();
    const res = await agent
      .post("/v1/auth/register")
      .send({ name: "Alice", email: "alice@test.com", password: "pass123" })
      .expect(200);

    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    const agent = createTestApp();
    const user = { name: "Alice", email: "alice@test.com", password: "pass123" };
    await agent.post("/v1/auth/register").send(user).expect(200);

    const res = await agent
      .post("/v1/auth/register")
      .send(user)
      .expect(400);

    expect(res.body).toEqual({
      error: true,
      message: "Email already registered",
    });
  });

  it("rejects missing name", async () => {
    const agent = createTestApp();
    const res = await agent
      .post("/v1/auth/register")
      .send({ email: "a@b.com", password: "pass" })
      .expect(400);

    expect(res.body.error).toBe(true);
    expect(res.body.message).toContain("Name");
  });

  it("rejects missing email", async () => {
    const agent = createTestApp();
    const res = await agent
      .post("/v1/auth/register")
      .send({ name: "Alice", password: "pass" })
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it("rejects missing password", async () => {
    const agent = createTestApp();
    const res = await agent
      .post("/v1/auth/register")
      .send({ name: "Alice", email: "a@b.com" })
      .expect(400);

    expect(res.body.error).toBe(true);
  });
});

describe("POST /v1/auth/login", () => {
  it("logs in successfully with correct credentials", async () => {
    const agent = createTestApp();
    await registerUser(agent, {
      name: "Bob",
      email: "bob@test.com",
      password: "secret",
    });

    const res = await agent
      .post("/v1/auth/login")
      .send({ email: "bob@test.com", password: "secret" })
      .expect(200);

    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects wrong password", async () => {
    const agent = createTestApp();
    await registerUser(agent, {
      name: "Bob",
      email: "bob@test.com",
      password: "secret",
    });

    const res = await agent
      .post("/v1/auth/login")
      .send({ email: "bob@test.com", password: "wrong" })
      .expect(401);

    expect(res.body).toEqual({
      error: true,
      message: "Invalid email or password",
    });
  });

  it("rejects nonexistent email", async () => {
    const agent = createTestApp();
    const res = await agent
      .post("/v1/auth/login")
      .send({ email: "nobody@test.com", password: "pass" })
      .expect(401);

    expect(res.body.error).toBe(true);
  });

  it("rejects missing fields", async () => {
    const agent = createTestApp();
    const res = await agent
      .post("/v1/auth/login")
      .send({})
      .expect(400);

    expect(res.body.error).toBe(true);
  });
});

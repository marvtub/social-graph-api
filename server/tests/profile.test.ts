import { describe, it, expect } from "vitest";
import { createTestApp, registerUser } from "./helpers";

describe("GET /v1/profile", () => {
  it("returns profile for authenticated user", async () => {
    const agent = createTestApp();
    const cookie = await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass123",
    });

    const res = await agent
      .get("/v1/profile")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body.email).toBe("alice@test.com");
    expect(res.body.name).toBe("Alice");
    expect(res.body.id).toBeDefined();
    expect(typeof res.body.id).toBe("string");
  });

  it("returns 401 JSON without auth", async () => {
    const agent = createTestApp();
    const res = await agent.get("/v1/profile").expect(401);

    expect(res.body).toEqual({
      error: true,
      message: "Unauthorized",
    });
  });

  it("returns 401 JSON with invalid session cookie", async () => {
    const agent = createTestApp();
    const res = await agent
      .get("/v1/profile")
      .set("Cookie", "session=fake-session-id")
      .expect(401);

    expect(res.body.error).toBe(true);
  });
});

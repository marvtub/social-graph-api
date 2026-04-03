import supertest from "supertest";
import { createApp } from "../src/index";

export function createTestApp() {
  const app = createApp(":memory:");
  return supertest(app);
}

/**
 * Register a user and return the session cookie string.
 */
export async function registerUser(
  agent: supertest.SuperTest<supertest.Test>,
  user: { name: string; email: string; password: string }
): Promise<string> {
  const res = await agent
    .post("/v1/auth/register")
    .send(user)
    .expect(200);

  const cookies = res.headers["set-cookie"];
  const cookieStr = Array.isArray(cookies) ? cookies[0] : cookies;
  return cookieStr;
}

/**
 * Login a user and return the session cookie string.
 */
export async function loginUser(
  agent: supertest.SuperTest<supertest.Test>,
  user: { email: string; password: string }
): Promise<string> {
  const res = await agent
    .post("/v1/auth/login")
    .send(user)
    .expect(200);

  const cookies = res.headers["set-cookie"];
  const cookieStr = Array.isArray(cookies) ? cookies[0] : cookies;
  return cookieStr;
}

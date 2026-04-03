import { describe, it, expect } from "vitest";
import { createTestApp, registerUser, loginUser } from "./helpers";

describe("POST /v1/friends/add", () => {
  it("adds a friend successfully", async () => {
    const agent = createTestApp();
    await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
    });
    await registerUser(agent, {
      name: "Bob",
      email: "bob@test.com",
      password: "pass",
    });

    const cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });

    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "bob@test.com" })
      .expect(200);
  });

  it("rejects self-friending", async () => {
    const agent = createTestApp();
    const cookie = await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
    });

    const res = await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "alice@test.com" })
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it("rejects nonexistent friend email", async () => {
    const agent = createTestApp();
    const cookie = await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
    });

    const res = await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "nobody@test.com" })
      .expect(400);

    expect(res.body.error).toBe(true);
  });

  it("is idempotent — adding same friend twice is OK", async () => {
    const agent = createTestApp();
    await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
    });
    await registerUser(agent, {
      name: "Bob",
      email: "bob@test.com",
      password: "pass",
    });

    const cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });

    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "bob@test.com" })
      .expect(200);

    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "bob@test.com" })
      .expect(200);
  });

  it("requires authentication", async () => {
    const agent = createTestApp();
    const res = await agent
      .post("/v1/friends/add")
      .send({ friendEmail: "bob@test.com" })
      .expect(401);

    expect(res.body.error).toBe(true);
  });
});

describe("GET /v1/friends", () => {
  it("returns empty array when no friends", async () => {
    const agent = createTestApp();
    const cookie = await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
    });

    const res = await agent
      .get("/v1/friends")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it("returns 1st degree friend", async () => {
    const agent = createTestApp();
    await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
    });
    await registerUser(agent, {
      name: "Bob",
      email: "bob@test.com",
      password: "pass",
    });

    const cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });

    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "bob@test.com" });

    const res = await agent
      .get("/v1/friends")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body).toEqual([
      { name: "Bob", email: "bob@test.com", degree: "1st" },
    ]);
  });

  it("friendship is bidirectional", async () => {
    const agent = createTestApp();
    await registerUser(agent, {
      name: "Alice",
      email: "alice@test.com",
      password: "pass",
    });
    await registerUser(agent, {
      name: "Bob",
      email: "bob@test.com",
      password: "pass",
    });

    // Alice adds Bob
    const aliceCookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", aliceCookie)
      .send({ friendEmail: "bob@test.com" });

    // Bob should see Alice
    const bobCookie = await loginUser(agent, {
      email: "bob@test.com",
      password: "pass",
    });
    const res = await agent
      .get("/v1/friends")
      .set("Cookie", bobCookie)
      .expect(200);

    expect(res.body).toEqual([
      { name: "Alice", email: "alice@test.com", degree: "1st" },
    ]);
  });

  it("returns correct degrees: 1st, 2nd, 3rd", async () => {
    const agent = createTestApp();

    // Create chain: Alice - Bob - Carol - Dave - Eve
    const users = [
      { name: "Alice", email: "alice@test.com", password: "pass" },
      { name: "Bob", email: "bob@test.com", password: "pass" },
      { name: "Carol", email: "carol@test.com", password: "pass" },
      { name: "Dave", email: "dave@test.com", password: "pass" },
      { name: "Eve", email: "eve@test.com", password: "pass" },
    ];

    for (const u of users) {
      await registerUser(agent, u);
    }

    // Alice <-> Bob
    let cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "bob@test.com" });

    // Bob <-> Carol
    cookie = await loginUser(agent, {
      email: "bob@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "carol@test.com" });

    // Carol <-> Dave
    cookie = await loginUser(agent, {
      email: "carol@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "dave@test.com" });

    // Dave <-> Eve
    cookie = await loginUser(agent, {
      email: "dave@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "eve@test.com" });

    // Check Alice's friend list
    cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });
    const res = await agent
      .get("/v1/friends")
      .set("Cookie", cookie)
      .expect(200);

    // Alice sees Bob(1st), Carol(2nd), Dave(3rd) — NOT Eve (4th)
    expect(res.body).toHaveLength(3);
    expect(res.body).toContainEqual({
      name: "Bob",
      email: "bob@test.com",
      degree: "1st",
    });
    expect(res.body).toContainEqual({
      name: "Carol",
      email: "carol@test.com",
      degree: "2nd",
    });
    expect(res.body).toContainEqual({
      name: "Dave",
      email: "dave@test.com",
      degree: "3rd",
    });
  });

  it("deduplicates — shows shortest degree only", async () => {
    const agent = createTestApp();

    // Alice - Bob - Carol, and Alice - Carol (direct)
    const users = [
      { name: "Alice", email: "alice@test.com", password: "pass" },
      { name: "Bob", email: "bob@test.com", password: "pass" },
      { name: "Carol", email: "carol@test.com", password: "pass" },
    ];

    for (const u of users) {
      await registerUser(agent, u);
    }

    let cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "bob@test.com" });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "carol@test.com" });

    cookie = await loginUser(agent, {
      email: "bob@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "carol@test.com" });

    // Alice should see Bob(1st) and Carol(1st) — Carol NOT duplicated as 2nd
    cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });
    const res = await agent
      .get("/v1/friends")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body).toContainEqual({
      name: "Bob",
      email: "bob@test.com",
      degree: "1st",
    });
    expect(res.body).toContainEqual({
      name: "Carol",
      email: "carol@test.com",
      degree: "1st",
    });
  });

  it("handles cycles without infinite loop", async () => {
    const agent = createTestApp();

    // A - B - C - A (triangle)
    const users = [
      { name: "Alice", email: "alice@test.com", password: "pass" },
      { name: "Bob", email: "bob@test.com", password: "pass" },
      { name: "Carol", email: "carol@test.com", password: "pass" },
    ];

    for (const u of users) {
      await registerUser(agent, u);
    }

    let cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "bob@test.com" });

    cookie = await loginUser(agent, {
      email: "bob@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "carol@test.com" });

    cookie = await loginUser(agent, {
      email: "carol@test.com",
      password: "pass",
    });
    await agent
      .post("/v1/friends/add")
      .set("Cookie", cookie)
      .send({ friendEmail: "alice@test.com" });

    // Alice sees Bob(1st), Carol(1st) — herself excluded
    cookie = await loginUser(agent, {
      email: "alice@test.com",
      password: "pass",
    });
    const res = await agent
      .get("/v1/friends")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body).toHaveLength(2);
    const emails = res.body.map((f: any) => f.email);
    expect(emails).not.toContain("alice@test.com");
  });

  it("requires authentication", async () => {
    const agent = createTestApp();
    const res = await agent.get("/v1/friends").expect(401);
    expect(res.body.error).toBe(true);
  });
});

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db";
import { config } from "../config";
import { logger } from "../logger";
const router = Router();

function createSession(userId: number, res: Response): void {
  const sessionId = uuidv4();
  const db = getDb();
  db.prepare("INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, unixepoch())").run(
    sessionId,
    userId
  );
  res.cookie("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: config.sessionMaxAgeMs,
  });
}

// POST /v1/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: true, message: "Name is required" });
      return;
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      res.status(400).json({ error: true, message: "Email is required" });
      return;
    }
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: true, message: "Password is required" });
      return;
    }

    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.trim().toLowerCase());
    if (existing) {
      res
        .status(400)
        .json({ error: true, message: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
      )
      .run(name.trim(), email.trim().toLowerCase(), passwordHash);

    createSession(Number(result.lastInsertRowid), res);
    res.status(200).json({});
  } catch (err: any) {
    // Handle SQLite UNIQUE constraint violation (race condition on email)
    if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res
        .status(400)
        .json({ error: true, message: "Email already registered" });
      return;
    }
    logger.error({ err }, "Register error");
    res
      .status(500)
      .json({ error: true, message: "An unexpected error occurred" });
  }
});

// POST /v1/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: true, message: "Email is required" });
      return;
    }
    if (!password || typeof password !== "string") {
      res.status(400).json({ error: true, message: "Password is required" });
      return;
    }

    const db = getDb();
    const user = db
      .prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .get(email.trim().toLowerCase()) as
      | { id: number; password_hash: string }
      | undefined;

    if (!user) {
      res
        .status(401)
        .json({ error: true, message: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res
        .status(401)
        .json({ error: true, message: "Invalid email or password" });
      return;
    }

    createSession(user.id, res);
    res.status(200).json({});
  } catch (err) {
    logger.error({ err }, "Login error");
    res
      .status(500)
      .json({ error: true, message: "An unexpected error occurred" });
  }
});

// POST /v1/auth/logout (no auth required — must be idempotent)
router.post("/logout", (req: Request, res: Response) => {
  const sessionId = req.cookies?.session;
  if (sessionId) {
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }
  res.clearCookie("session", { path: "/" });
  res.status(200).json({});
});

export default router;

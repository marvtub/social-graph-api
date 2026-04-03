import { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { config } from "../config";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const sessionId = req.cookies?.session;

  if (!sessionId) {
    res.status(401).json({ error: true, message: "Unauthorized" });
    return;
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.created_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`
    )
    .get(sessionId) as (AuthenticatedUser & { created_at: number }) | undefined;

  if (!row) {
    res.status(401).json({ error: true, message: "Unauthorized" });
    return;
  }

  // Check session expiry
  const ageMs = (Date.now() / 1000 - row.created_at) * 1000;
  if (ageMs > config.sessionMaxAgeMs) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    res.clearCookie("session", { path: "/" });
    res.status(401).json({ error: true, message: "Session expired" });
    return;
  }

  req.user = { id: row.id, name: row.name, email: row.email };
  next();
}

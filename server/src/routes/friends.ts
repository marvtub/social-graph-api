import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { getDb } from "../db";
import { logger } from "../logger";

const router = Router();

const DEGREE_MAP: Record<number, "1st" | "2nd" | "3rd"> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
};

// POST /v1/friends/add
router.post("/add", authMiddleware, (req: Request, res: Response) => {
  try {
    const { friendEmail } = req.body;
    const user = req.user!;

    if (!friendEmail || typeof friendEmail !== "string") {
      res
        .status(400)
        .json({ error: true, message: "Friend email is required" });
      return;
    }

    const db = getDb();
    const friend = db
      .prepare("SELECT id, email FROM users WHERE email = ?")
      .get(friendEmail.trim().toLowerCase()) as
      | { id: number; email: string }
      | undefined;

    if (!friend) {
      res.status(400).json({ error: true, message: "User not found" });
      return;
    }

    if (friend.id === user.id) {
      res
        .status(400)
        .json({ error: true, message: "Cannot add yourself as a friend" });
      return;
    }

    // Bidirectional friendship — INSERT OR IGNORE for idempotency
    const insertStmt = db.prepare(
      "INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)"
    );
    const insertBoth = db.transaction(() => {
      insertStmt.run(user.id, friend.id);
      insertStmt.run(friend.id, user.id);
    });
    insertBoth();

    res.status(200).json({});
  } catch (err) {
    logger.error({ err }, "Add friend error");
    res
      .status(500)
      .json({ error: true, message: "An unexpected error occurred" });
  }
});

// GET /v1/friends
router.get("/", authMiddleware, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const db = getDb();

    const results: { name: string; email: string; degree: "1st" | "2nd" | "3rd" }[] = [];
    const visited = new Set<number>([user.id]);
    let currentLevel: number[] = [user.id];

    // BFS up to 3 levels
    for (let depth = 1; depth <= 3; depth++) {
      if (currentLevel.length === 0) break;

      // Build placeholders for the IN clause
      const placeholders = currentLevel.map(() => "?").join(",");
      const query = `
        SELECT DISTINCT u.id, u.name, u.email
        FROM friendships f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id IN (${placeholders})
      `;

      const rows = db.prepare(query).all(...currentLevel) as {
        id: number;
        name: string;
        email: string;
      }[];

      const nextLevel: number[] = [];

      for (const row of rows) {
        if (visited.has(row.id)) continue;
        visited.add(row.id);
        nextLevel.push(row.id);
        results.push({
          name: row.name,
          email: row.email,
          degree: DEGREE_MAP[depth],
        });
      }

      currentLevel = nextLevel;
    }

    res.json(results);
  } catch (err) {
    logger.error({ err }, "Get friends error");
    res
      .status(500)
      .json({ error: true, message: "An unexpected error occurred" });
  }
});

export default router;

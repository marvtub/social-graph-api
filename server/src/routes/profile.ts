import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// GET /v1/profile
router.get("/", authMiddleware, (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    id: String(user.id),
    email: user.email,
    name: user.name,
  });
});

export default router;

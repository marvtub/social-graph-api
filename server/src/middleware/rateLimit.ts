import rateLimit from "express-rate-limit";

export function createLoginLimiter() {
  return rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: "Too many requests, try again later" },
  });
}

export function createRegisterLimiter() {
  return rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: true, message: "Too many requests, try again later" },
  });
}

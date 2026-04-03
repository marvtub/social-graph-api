export const config = {
  port: Number(process.env.PORT) || 8080,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  sessionMaxAgeMs: Number(process.env.SESSION_MAX_AGE_MS) || 86_400_000, // 24h
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
};

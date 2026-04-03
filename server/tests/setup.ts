process.env.LOG_LEVEL = "silent";

import { afterEach } from "vitest";
import { closeDb } from "../src/db";

afterEach(() => {
  closeDb();
});

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import("./seed").catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
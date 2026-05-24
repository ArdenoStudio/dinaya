import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

process.env.VERCEL_PREVIEW_COMMENTS_ENABLED = "0";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");

const result = spawnSync(process.execPath, [nextCli, "build"], {
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);

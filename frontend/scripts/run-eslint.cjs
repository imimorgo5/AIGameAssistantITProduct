const { spawnSync } = require("node:child_process");
const path = require("node:path");

const eslintDirectory = path.dirname(require.resolve("eslint/package.json"));
const result = spawnSync(
  process.execPath,
  [
    path.join(eslintDirectory, "bin/eslint.js"),
    "src/**/*.{js,jsx,cjs,mjs,ts,tsx}",
    "scripts/**/*.{js,cjs,mjs}",
    "*.cjs",
    "--max-warnings",
    "0",
    ...process.argv.slice(2),
  ],
  {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, ESLINT_USE_FLAT_CONFIG: "true" },
    stdio: "inherit",
  },
);

if (result.error) process.stderr.write(`${result.error.message}\n`);

process.exitCode = result.status ?? 1;

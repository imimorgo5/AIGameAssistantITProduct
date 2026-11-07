const { spawnSync } = require("node:child_process");
const path = require("node:path");

const stylelintDirectory = path.dirname(
  require.resolve("stylelint/package.json"),
);
const tasks = [
  ["scripts/run-eslint.cjs"],
  [
    path.join(stylelintDirectory, "bin/stylelint.mjs"),
    "src/**/*.{css,scss}",
    "--max-warnings",
    "0",
  ],
];

tasks.push(["scripts/check-architecture.cjs"], ["scripts/check-styles.cjs"]);

for (const args of tasks) {
  const result = spawnSync(process.execPath, args, {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
  });

  if (result.error) process.stderr.write(`${result.error.message}\n`);

  if (result.status !== 0) process.exitCode = 1;
}

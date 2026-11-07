const { cpSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const output = path.join(root, ".next/standalone");
mkdirSync(path.join(output, ".next"), { recursive: true });
cpSync(path.join(root, ".next/static"), path.join(output, ".next/static"), {
  recursive: true,
});
cpSync(path.join(root, "public"), path.join(output, "public"), {
  recursive: true,
});
process.stdout.write("Prepared standalone static and public assets.\n");

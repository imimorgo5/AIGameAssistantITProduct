const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });
module.exports = createJestConfig({
  testEnvironment: "jsdom",
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: [
    "<rootDir>/src/**/*.test.[jt]s?(x)",
    "<rootDir>/tests/**/*.test.[jt]s?(x)",
  ],
  moduleNameMapper: {
    "^(_app|_pages|widgets|features|entities|shared)/(.*)$":
      "<rootDir>/src/$1/$2",
    "^server-only$": "<rootDir>/tests/server-only.cjs",
  },
});

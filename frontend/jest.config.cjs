const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });
const getConfig = createJestConfig({
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

const markdownModules = [
  "react-markdown",
  "remark-.*",
  "unified",
  "bail",
  "devlop",
  "trough",
  "is-plain-obj",
  "vfile.*",
  "unist-.*",
  "mdast-.*",
  "micromark.*",
  "decode-named-character-reference",
  "character-.*",
  "property-information",
  "hast-.*",
  "html-url-attributes",
  "space-separated-tokens",
  "comma-separated-tokens",
  "trim-lines",
  "ccount",
  "escape-string-regexp",
  "markdown-.*",
  "longest-streak",
  "zwitch",
  "estree-.*",
  "is-alphabetical",
  "is-alphanumerical",
  "is-decimal",
  "is-hexadecimal",
  "parse-entities",
  "stringify-entities",
  "@ungap/structured-clone",
];

module.exports = async () => {
  const config = await getConfig();
  config.transformIgnorePatterns = [
    `/node_modules/(?!(${markdownModules.join("|")})/)`,
    ...config.transformIgnorePatterns.filter(
      (pattern) => !pattern.includes("node_modules"),
    ),
  ];
  return config;
};

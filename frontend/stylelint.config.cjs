module.exports = {
  overrides: [
    {
      files: ["**/*.scss"],
      customSyntax: "postcss-scss",
    },
  ],
  rules: {
    "rule-empty-line-before": [
      "always",
      { except: ["first-nested"], ignore: ["after-comment"] },
    ],
    "at-rule-empty-line-before": [
      "always",
      { except: ["first-nested"], ignore: ["after-comment", "blockless-after-blockless"] },
    ],
  },
};

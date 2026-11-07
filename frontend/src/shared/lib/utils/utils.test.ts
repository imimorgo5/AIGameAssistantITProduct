import { originalFileName } from "./utils";

test.each([
  ["1699000000000_rules.pdf", "rules.pdf"],
  ["bba899ca-174a-4764-b866-b031c31ac161_rules.pdf", "rules.pdf"],
  ["rules_with_underscores.pdf", "rules_with_underscores.pdf"],
])(
  "preserves original names for both upload generations: %s",
  (stored, original) => {
    expect(originalFileName(stored)).toBe(original);
  },
);

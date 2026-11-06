const fs = require("fs");
const path = require("path");

const parser = require("@babel/parser");
const layers = ["_app", "_pages", "widgets", "features", "entities", "shared"];

function files(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
}

function slice(file) {
  const parts = file.split("/");

  return parts.slice(0, parts[0] === "shared" ? 3 : 2).join("/");
}

const failures = [];
for (const file of files("src").filter((file) => /\.[jt]sx?$/.test(file))) {
  const relative = path.relative("src", file).split(path.sep).join("/");
  const ast = parser.parse(fs.readFileSync(file, "utf8"), {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  if (ast.comments.length)
    failures.push(`${relative}: комментарии в коде запрещены`);

  for (const node of ast.program.body) {
    if (
      !node.source ||
      ![
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
      ].includes(node.type)
    )
      continue;

    const source = node.source.value;
    const target = source.startsWith(".")
      ? path.posix.normalize(
        path.posix.join(path.posix.dirname(relative), source),
      )
      : source;

    const from = layers.indexOf(relative.split("/")[0]);
    const to = layers.indexOf(target.split("/")[0]);
    if (from < 0 || to < 0) continue;

    if (to < from)
      failures.push(`${relative}: импорт из вышележащего слоя ${source}`);

    if (
      from === to &&
      !["_app", "shared"].includes(layers[from]) &&
      slice(relative) !== slice(target)
    )
      failures.push(`${relative}: импорт соседнего слайса ${source}`);

    const parts = target.split("/");
    const publicDepth = parts[0] === "shared" ? 3 : 2;
    if (
      from !== 0 &&
      slice(relative) !== slice(target) &&
      parts.length > publicDepth &&
      !target.startsWith("shared/assets/")
    )
      failures.push(`${relative}: глубокий импорт ${source}`);
  }
}

if (failures.length) {
  process.stderr.write(failures.join("\n") + "\n");
  process.exitCode = 1;
} else
  process.stdout.write(
    "FSD boundaries, public APIs and comment policy passed.\n",
  );

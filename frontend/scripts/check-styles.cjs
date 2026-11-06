const fs = require("node:fs");
const path = require("node:path");

const parser = require("@babel/parser");
const sass = require("sass");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "src");
const astCache = new Map();
const cssCache = new Map();
const failures = new Set();

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);

    return entry.isDirectory() ? files(target) : [target];
  });
}

function ast(file) {
  if (!astCache.has(file)) {
    astCache.set(file, parser.parse(fs.readFileSync(file, "utf8"), {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    }));
  }

  return astCache.get(file);
}

function classes(file) {
  if (!cssCache.has(file)) {
    const css = sass.compile(file).css;
    const names = [...css.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((match) => match[1]);
    cssCache.set(file, new Set(names));
  }

  return cssCache.get(file);
}

function resolve(from, specifier) {
  const base = specifier.startsWith(".")
    ? path.resolve(path.dirname(from), specifier)
    : path.join(source, specifier);

  return [base, `${base}.ts`, path.join(base, "index.ts")].find((candidate) =>
    fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

function stylesheet(file, exported, seen = new Set()) {
  if (!file || seen.has(file)) return null;

  if (file.endsWith(".scss")) return file;

  seen.add(file);
  for (const node of ast(file).program.body) {
    if (node.type !== "ExportNamedDeclaration" || !node.source) continue;

    const specifier = node.specifiers.find((item) => item.exported.name === exported);
    if (specifier) return stylesheet(resolve(file, node.source.value), specifier.local.name, seen);
  }

  return null;
}

function walk(node, visit) {
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, visit));

    return;
  }

  if (node.type) visit(node);

  for (const [key, child] of Object.entries(node)) {
    if (!["loc", "start", "end", "comments", "tokens"].includes(key)) walk(child, visit);
  }
}

function names(node) {
  if (!node) return [];

  if (node.type === "StringLiteral") return node.value.split(/\s+/).filter(Boolean);

  if (node.type === "TemplateLiteral") {
    return [
      ...node.quasis.flatMap((part) => part.value.raw.split(/\s+/).filter(Boolean)),
      ...node.expressions.flatMap(names),
    ];
  }

  if (node.type === "ConditionalExpression") return [...names(node.consequent), ...names(node.alternate)];

  if (node.type === "LogicalExpression") return names(node.right);

  return [];
}

const globalClasses = classes(path.join(source, "_app/styles/global.scss"));
for (const file of files(source).filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))) {
  const tree = ast(file);
  const imports = new Map();
  const bindings = new Map();
  for (const node of tree.program.body) {
    if (node.type !== "ImportDeclaration") continue;

    for (const specifier of node.specifiers) {
      const target = stylesheet(resolve(file, node.source.value), specifier.imported?.name ?? "default");
      if (target) imports.set(specifier.local.name, classes(target));
    }
  }

  walk(tree, (node) => {
    if (node.type !== "VariableDeclarator" || node.init?.type !== "CallExpression" || node.init.callee.name !== "bindClasses") return;

    const available = new Set(globalClasses);
    for (const argument of node.init.arguments) {
      for (const name of imports.get(argument.name) ?? []) available.add(name);
    }

    bindings.set(node.id.name, available);
  });
  const check = (name, available, line) => {
    if (!available.has(name)) failures.add(`${path.relative(root, file)}:${line}: class "${name}" has no connected stylesheet`);
  };

  walk(tree, (node) => {
    if (node.type === "CallExpression" && bindings.has(node.callee.name)) {
      for (const name of node.arguments.flatMap(names)) check(name, bindings.get(node.callee.name), node.loc.start.line);
    }

    if (node.type === "MemberExpression" && imports.has(node.object.name)) {
      const name = node.computed ? node.property.value : node.property.name;
      if (typeof name === "string") check(name, imports.get(node.object.name), node.loc.start.line);
    }

    if (node.type === "JSXAttribute" && node.name.name === "className" && node.value?.type === "StringLiteral") {
      for (const name of names(node.value)) check(name, globalClasses, node.loc.start.line);
    }
  });
}

if (failures.size) {
  process.stderr.write([...failures].join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write("Static class names match connected CSS Modules and global styles.\n");
}

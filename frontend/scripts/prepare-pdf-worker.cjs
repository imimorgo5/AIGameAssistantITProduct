const { copyFileSync, cpSync, mkdirSync, readFileSync } = require("node:fs");
const path = require("node:path");

const reactPdfDirectory = path.dirname(
  require.resolve("react-pdf/package.json"),
);
const pdfjsPackage = require.resolve("pdfjs-dist/package.json", {
  paths: [reactPdfDirectory],
});

const pdfjs = JSON.parse(readFileSync(pdfjsPackage, "utf8"));
const publicDirectory = path.resolve(__dirname, "../public");

mkdirSync(publicDirectory, { recursive: true });
copyFileSync(
  path.join(path.dirname(pdfjsPackage), "build/pdf.worker.min.mjs"),
  path.join(publicDirectory, "pdf.worker.min.mjs"),
);
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  cpSync(
    path.join(path.dirname(pdfjsPackage), directory),
    path.join(publicDirectory, "pdfjs", directory),
    { recursive: true },
  );
}

process.stdout.write(`Prepared PDF.js worker ${pdfjs.version}.\n`);

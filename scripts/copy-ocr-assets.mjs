// Copies the bill scanner's engine files from node_modules into public/ocr, so the browser loads them from our own
// site instead of a third-party CDN. This keeps the scanner working on the venue's network and keeps bills on the device.
// Runs before `dev` and `build`. The copied files are not committed (see .gitignore).
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nm = (...p) => path.join(root, "node_modules", ...p);
const out = (...p) => path.join(root, "public", "ocr", ...p);

const jobs = [
  { from: nm("tesseract.js", "dist", "worker.min.js"), to: out("worker.min.js") },
  { from: nm("@tesseract.js-data", "eng", "4.0.0_best_int", "eng.traineddata.gz"), to: out("lang", "eng.traineddata.gz") },
  { from: nm("pdfjs-dist", "build", "pdf.worker.min.mjs"), to: out("pdf.worker.min.mjs") },
];

// The engine picks one of several builds for the browser's capabilities. We ship the text-recognition-only builds.
const coreDir = nm("tesseract.js-core");
if (existsSync(coreDir)) {
  for (const f of readdirSync(coreDir).filter((n) => /lstm\.wasm\.js$/.test(n))) jobs.push({ from: path.join(coreDir, f), to: out("core", f) });
}

let copied = 0;
for (const { from, to } of jobs) {
  if (!existsSync(from)) {
    console.warn(`copy-ocr-assets: missing ${path.relative(root, from)}, the bill scanner will be unavailable`);
    continue;
  }
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to);
  copied++;
}
console.log(`copy-ocr-assets: ${copied} files ready in public/ocr`);

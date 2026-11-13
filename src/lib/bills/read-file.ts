"use client";

/**
 * Turns a photo or PDF of a bill into text, entirely in the browser. Nothing is uploaded: the picture stays on
 * the user's device and only the numbers they confirm are sent to the server. Engine files are served from our
 * own site (see scripts/copy-ocr-assets.mjs), so it also works on a venue network that blocks CDNs.
 */
export interface ReadProgress {
  stage: "loading" | "reading";
  /** 0 to 1 */
  fraction: number;
  label: string;
}

export interface ReadResult {
  text: string;
  source: "image" | "pdf";
}

const MAX_BYTES = 15 * 1024 * 1024;
/** A PDF with more text than this is an electronic bill, so no OCR is needed. */
const MIN_PDF_TEXT = 80;

export async function readBillFile(file: File, onProgress: (p: ReadProgress) => void): Promise<ReadResult> {
  if (file.size > MAX_BYTES) throw new Error("That file is larger than 15 MB. Try a smaller photo or a PDF.");
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return readPdf(file, onProgress);
  if (file.type.startsWith("image/")) return { text: await ocr(file, onProgress), source: "image" };
  throw new Error("Please choose a photo (JPG or PNG) or a PDF of the bill.");
}

async function ocr(image: Blob, onProgress: (p: ReadProgress) => void): Promise<string> {
  onProgress({ stage: "loading", fraction: 0, label: "Starting the reader on your device" });
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
    gzip: true,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress({ stage: "reading", fraction: m.progress, label: "Reading the bill" });
      else onProgress({ stage: "loading", fraction: m.progress, label: "Preparing the reader" });
    },
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function readPdf(file: File, onProgress: (p: ReadProgress) => void): Promise<ReadResult> {
  onProgress({ stage: "loading", fraction: 0.1, label: "Opening the PDF" });
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/ocr/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;

  // Electronic bills carry their text, which is exact. Use it when it is there.
  let text = "";
  for (let n = 1; n <= Math.min(pdf.numPages, 2); n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3);
      rows.set(y, [...(rows.get(y) ?? []), { x: item.transform[4], s: item.str }]);
    }
    text += [...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, cells]) => cells.sort((a, b) => a.x - b.x).map((c) => c.s).join(" ")).join("\n") + "\n";
  }
  if (text.replace(/\s/g, "").length >= MIN_PDF_TEXT) return { text, source: "pdf" };

  // A scanned PDF has no text: draw the first page and read it like a photo.
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvas, viewport }).promise;
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read that PDF."))), "image/png"));
  return { text: await ocr(blob, onProgress), source: "pdf" };
}

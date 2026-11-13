/**
 * Shrinks a photo in the browser to a JPEG of at most `maxSide` pixels on its longest side, so a 6 MB phone
 * picture becomes roughly 100 KB before it is sent. Browser only. Re-drawing also drops the photo's location
 * and camera metadata, which we do not want to hold.
 */
export async function shrinkToJpeg(file: File, maxSide = 1000, quality = 0.75): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

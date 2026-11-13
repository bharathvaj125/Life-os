"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  firstName: string;
  points: number;
  kgAvoided: number;
  streak: number;
  level: string;
}

const W = 1080;
const H = 1350;
const fmt = (n: number, d = 0) => n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Paints the card. Everything on it comes from the household's own numbers and is made in the browser, so nothing is uploaded. */
async function paint(canvas: HTMLCanvasElement, p: Props) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;
  try {
    await Promise.all([document.fonts.load('800 80px "Plus Jakarta Sans"'), document.fonts.load('700 40px "JetBrains Mono"')]);
  } catch {
    // The system fallback fonts are fine.
  }

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0E3A26");
  bg.addColorStop(1, "#06130D");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // A Bandhani dot pattern in the top corner.
  ctx.save();
  for (let y = 0; y < 760; y += 34) {
    for (let x = W; x > W - 760; x -= 34) {
      const d = Math.hypot(W - x, y) / 760;
      ctx.fillStyle = `rgba(238,155,63,${Math.max(0, 0.5 * (1 - d))})`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // The emblem.
  try {
    const img = new Image();
    img.src = "/icons/logo.svg";
    await img.decode();
    ctx.drawImage(img, 80, 80, 150, 150);
  } catch {
    // The card still reads without the emblem.
  }
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = 'italic 800 64px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText("LıFE", 256, 172);
  const w = ctx.measureText("LıFE").width;
  const g = ctx.createLinearGradient(256 + w, 120, 256 + w + 150, 180);
  g.addColorStop(0, "#C6F24E");
  g.addColorStop(1, "#3FA535");
  ctx.fillStyle = g;
  ctx.fillText("-OS", 256 + w, 172);

  ctx.fillStyle = "#F2B05E";
  ctx.font = '700 30px "JetBrains Mono", monospace';
  ctx.fillText("MY MISSION LiFE CARD", 80, 360);
  ctx.fillStyle = "#F3ECDC";
  ctx.font = 'italic 800 86px "Plus Jakarta Sans", system-ui, sans-serif';
  const name = p.firstName.length > 14 ? `${p.firstName.slice(0, 13)}…` : p.firstName;
  ctx.fillText(name, 80, 460);

  const rows: [string, string, string][] = [
    [fmt(p.kgAvoided, 1), "kg CO₂e avoided", "#7BDB4B"],
    [fmt(p.points), "points earned", "#F5AE5C"],
    [`${p.streak}`, "day streak", "#FF9D84"],
  ];
  rows.forEach(([big, small, colour], i) => {
    const y = 640 + i * 190;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.roundRect(80, y - 110, W - 160, 150, 30);
    ctx.fill();
    ctx.fillStyle = colour;
    ctx.font = '700 96px "JetBrains Mono", monospace';
    ctx.fillText(big, 120, y + 8);
    const bw = ctx.measureText(big).width;
    ctx.fillStyle = "#D6D0BF";
    ctx.font = '600 38px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(small, 120 + bw + 28, y + 2);
  });

  // Level pill.
  ctx.font = '700 36px "Plus Jakarta Sans", system-ui, sans-serif';
  const label = `Level: ${p.level}`;
  const lw = ctx.measureText(label).width + 64;
  ctx.fillStyle = "rgba(238,155,63,0.18)";
  ctx.beginPath();
  ctx.roundRect(80, 1230 - 56, lw, 72, 36);
  ctx.fill();
  ctx.fillStyle = "#F5AE5C";
  ctx.fillText(label, 112, 1230 - 6);

  ctx.fillStyle = "#A8BCAF";
  ctx.font = 'italic 500 26px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText("Small habits, added up. Avoided emissions are modelled from logged actions.", 80, 1300);
}

/**
 * A card to share: the household's own points, avoided carbon and streak, drawn in the browser as an image.
 * Only the first name appears, nothing leaves the device until the person chooses to share or save it.
 */
export function ShareCard(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const { firstName, points, kgAvoided, streak, level } = props;

  useEffect(() => {
    if (canvas.current) void paint(canvas.current, { firstName, points, kgAvoided, streak, level });
  }, [firstName, points, kgAvoided, streak, level]);

  const toFile = useCallback(
    () =>
      new Promise<File | null>((resolve) => {
        canvas.current?.toBlob((b) => resolve(b ? new File([b], "my-life-os-card.png", { type: "image/png" }) : null), "image/png");
      }),
    [],
  );

  async function download() {
    const file = await toFile();
    if (!file) return setNote("The card could not be made. Try again.");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
    setNote("Saved. You can post it anywhere.");
  }

  async function share() {
    const file = await toFile();
    if (!file) return setNote("The card could not be made. Try again.");
    const data = { files: [file], title: "My LiFE-OS card", text: `${fmt(kgAvoided, 1)} kg CO₂e avoided with LiFE-OS, Mission LiFE.` };
    if (typeof navigator.canShare === "function" && navigator.canShare(data)) {
      try {
        await navigator.share(data);
        setNote(null);
      } catch {
        // The person closed the share sheet, which is not an error.
      }
    } else {
      await download();
    }
  }

  return (
    <Card title="Share your impact" icon={<Share2 size={20} className="card-icon" style={{ margin: 0 }} />}>
      <div className="share-card">
        <canvas ref={canvas} width={W} height={H} aria-label={`Your LiFE-OS card: ${fmt(kgAvoided, 1)} kilograms of CO₂e avoided, ${fmt(points)} points and a ${streak} day streak`} role="img" />
        <div>
          <p className="muted" style={{ margin: "0 0 14px" }}>
            A picture of your own numbers to post or send. It shows only your first name, and it is made on this device, so nothing is uploaded.
          </p>
          <div className="toolbar">
            <button type="button" className="button button-surya" onClick={share}>
              <Share2 size={16} aria-hidden="true" /> Share
            </button>
            <button type="button" className="button button-outline" onClick={download}>
              <Download size={16} aria-hidden="true" /> Save image
            </button>
          </div>
          {note ? (
            <p role="status" className="muted" style={{ margin: "12px 0 0", fontSize: "13px" }}>
              {note}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

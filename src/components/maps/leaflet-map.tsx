"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  position: [number, number];
  /** "pin" is a teardrop-style dot for a place. "bubble" is a circle sized by `radius`, for area totals. */
  kind: "pin" | "bubble";
  tone: "amber" | "green" | "grey" | "you";
  radius?: number;
  title: string;
  lines?: string[];
  link?: { href: string; text: string };
}

interface Props {
  markers: MapMarker[];
  height?: number;
  label: string;
}

const COLOURS = { amber: "#EE9B3F", green: "#6DBE90", grey: "#8A9A90", you: "#FF8E72" } as const;

/**
 * An OpenStreetMap view with simple markers. Tiles come from OpenStreetMap, so they need an internet connection;
 * without one the markers still show on a plain background. Marker text is built with DOM nodes, never HTML
 * strings, so listing names typed by installers cannot inject markup.
 */
export function LeafletMap({ markers, height = 360, label }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let cleanup: () => void = () => undefined;

    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !el.current) return;
        const map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(map);

        const group = L.featureGroup();
        for (const m of markers) {
          const colour = COLOURS[m.tone];
          const layer =
            m.kind === "bubble"
              ? L.circleMarker(m.position, { radius: m.radius ?? 14, color: colour, weight: 2, fillColor: colour, fillOpacity: 0.35 })
              : L.marker(m.position, { icon: L.divIcon({ className: "map-pin", html: `<span style="background:${colour}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] }), title: m.title });

          const body = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = m.title;
          body.append(title);
          for (const line of m.lines ?? []) {
            const p = document.createElement("div");
            p.textContent = line;
            p.style.fontSize = "12.5px";
            body.append(p);
          }
          if (m.link) {
            const a = document.createElement("a");
            a.href = m.link.href;
            a.textContent = m.link.text;
            a.target = "_blank";
            a.rel = "noopener noreferrer nofollow";
            a.style.display = "block";
            a.style.marginTop = "4px";
            body.append(a);
          }
          layer.bindPopup(body);
          group.addLayer(layer);
        }
        group.addTo(map);
        if (markers.length) map.fitBounds(group.getBounds().pad(0.25), { maxZoom: 11 });
        else map.setView([22.6, 71.5], 7);
        const resize = setTimeout(() => map.invalidateSize(), 250);
        cleanup = () => {
          clearTimeout(resize);
          map.remove();
        };
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [markers]);

  if (failed) return <p className="muted" style={{ margin: 0 }}>The map could not load. The list below has everything it would show.</p>;
  return <div ref={el} className="map-frame" style={{ height }} role="region" aria-label={label} />;
}

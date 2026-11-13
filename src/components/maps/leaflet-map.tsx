"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LMap, FeatureGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  position: [number, number];
  /** "pin" is a teardrop-style dot for a place. "bubble" is a circle sized by `radius`, for area totals. */
  kind: "pin" | "bubble";
  tone: "amber" | "green" | "grey" | "you" | "blue";
  radius?: number;
  title: string;
  lines?: string[];
  link?: { href: string; text: string };
}

export interface MapFocus {
  position: [number, number];
  zoom?: number;
  /** Change this to move the map again to the same place. */
  key: string | number;
}

interface Props {
  markers: MapMarker[];
  height?: number;
  label: string;
  /** Zoom the map to fit every marker whenever the markers change. Turn off when a `focus` is steering the map. */
  autoFit?: boolean;
  focus?: MapFocus | null;
  /** Called with a marker's id when its pin is clicked. */
  onSelect?: (id: string) => void;
}

const COLOURS = { amber: "#EE9B3F", green: "#6DBE90", grey: "#8A9A90", you: "#FF8E72", blue: "#5BA3E0" } as const;

/**
 * An OpenStreetMap view with simple markers. One map is created and kept, and only its pins change, so filtering a
 * list does not make the map flash. Tiles come from OpenStreetMap, so they need an internet connection; without
 * one the markers still show on a plain background. Marker text is built with DOM nodes, never HTML strings, so
 * names typed by installers cannot inject markup.
 */
export function LeafletMap({ markers, height = 360, label, autoFit = true, focus = null, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const group = useRef<FeatureGroup | null>(null);
  const lib = useRef<typeof import("leaflet") | null>(null);
  const select = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !el.current) return;
        const m = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap contributors" }).addTo(m);
        m.setView([22.6, 71.5], 7);
        group.current = L.featureGroup().addTo(m);
        map.current = m;
        lib.current = L;
        setTimeout(() => m.invalidateSize(), 250);
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      group.current = null;
      setReady(false);
    };
  }, []);

  // Draw the pins whenever they change.
  useEffect(() => {
    const L = lib.current;
    const m = map.current;
    const g = group.current;
    if (!ready || !L || !m || !g) return;
    g.clearLayers();
    for (const mk of markers) {
      const colour = COLOURS[mk.tone];
      const layer =
        mk.kind === "bubble"
          ? L.circleMarker(mk.position, { radius: mk.radius ?? 14, color: colour, weight: 2, fillColor: colour, fillOpacity: 0.35 })
          : L.marker(mk.position, { icon: L.divIcon({ className: "map-pin", html: `<span style="background:${colour}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] }), title: mk.title });

      const body = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = mk.title;
      body.append(title);
      for (const line of mk.lines ?? []) {
        const p = document.createElement("div");
        p.textContent = line;
        p.style.fontSize = "12.5px";
        body.append(p);
      }
      if (mk.link) {
        const a = document.createElement("a");
        a.href = mk.link.href;
        a.textContent = mk.link.text;
        a.target = "_blank";
        a.rel = "noopener noreferrer nofollow";
        a.style.display = "block";
        a.style.marginTop = "4px";
        body.append(a);
      }
      layer.bindPopup(body);
      layer.on("click", () => select.current?.(mk.id));
      g.addLayer(layer);
    }
    if (autoFit && markers.length) {
      const bounds = g.getBounds();
      if (bounds.isValid()) m.fitBounds(bounds.pad(0.25), { maxZoom: 11 });
    }
  }, [markers, ready, autoFit]);

  // Move to a place when asked.
  useEffect(() => {
    if (!ready || !focus || !map.current) return;
    map.current.flyTo(focus.position, focus.zoom ?? 12, { duration: 0.8 });
    // Only the key decides whether to move again, not the position object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key, ready]);

  if (failed) return <p className="muted" style={{ margin: 0 }}>The map could not load. The list below has everything it would show.</p>;
  return <div ref={el} className="map-frame" style={{ height }} role="region" aria-label={label} />;
}

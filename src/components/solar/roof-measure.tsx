"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLngExpression, Map as LMap, Marker, Polygon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, Ruler, Search, Undo2, Trash2 } from "lucide-react";
import { findPlace, polygonAreaM2 } from "@/lib/maps/geo";

const SQFT_PER_M2 = 10.7639;

/**
 * Measure a roof on satellite imagery: find the house, click its corners, drag any corner to adjust, and the area is
 * worked out for you. It is an outline drawn by the person, not automatic roof detection, so it is only as good as
 * the picture and the corners they choose. The imagery is Esri World Imagery and may be older than the building.
 */
export function RoofMeasure({ centre, onUse }: { centre: [number, number]; onUse: (areaM2: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const lib = useRef<typeof import("leaflet") | null>(null);
  const poly = useRef<Polygon | null>(null);
  const markers = useRef<Marker[]>([]);
  const [area, setArea] = useState(0);
  const [corners, setCorners] = useState(0);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [used, setUsed] = useState(false);

  function refresh() {
    const pts = markers.current.map((m) => m.getLatLng());
    poly.current?.setLatLngs(pts as LatLngExpression[]);
    setCorners(pts.length);
    setArea(pts.length >= 3 ? polygonAreaM2(pts.map((p) => [p.lat, p.lng] as [number, number])) : 0);
    setUsed(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !el.current) return;
        const m = L.map(el.current, { scrollWheelZoom: false, maxZoom: 20 });
        const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 19, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" });
        const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20, maxNativeZoom: 18, attribution: "© OpenStreetMap contributors" });
        satellite.addTo(m);
        L.control.layers({ Satellite: satellite, Streets: streets }, undefined, { position: "topright" }).addTo(m);
        m.setView(centre, 13);
        poly.current = L.polygon([], { color: "#FFC266", weight: 3, fillColor: "#FFC266", fillOpacity: 0.3 }).addTo(m);
        m.on("click", (ev) => {
          const mk = L.marker(ev.latlng, { draggable: true, icon: L.divIcon({ className: "roof-corner", iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(m);
          mk.on("drag", refresh);
          mk.on("dragend", refresh);
          markers.current.push(mk);
          refresh();
        });
        map.current = m;
        lib.current = L as unknown as typeof import("leaflet");
        setTimeout(() => m.invalidateSize(), 250);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current = [];
    };
    // The map is created once; its starting view comes from the first value of `centre`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function undo() {
    const last = markers.current.pop();
    last?.remove();
    refresh();
  }

  function clear() {
    markers.current.forEach((m) => m.remove());
    markers.current = [];
    refresh();
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setNote("Searching…");
    const found = await findPlace(query);
    if (!found) return setNote("We could not find that place. Try a PIN code, or your area and city.");
    map.current?.setView(found.position, found.precision === "exact" ? 17 : 13);
    setNote(found.precision === "exact" ? `Showing ${found.label}. Zoom in to your roof and click its corners.` : "Showing the city for that PIN. Zoom in and find your house.");
  }

  function locate() {
    if (!navigator.geolocation) return setNote("This browser cannot share a location. Search by PIN code or area instead.");
    setNote("Asking your browser for your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.current?.setView([pos.coords.latitude, pos.coords.longitude], 19);
        setNote("Showing where you are. If this is your home, click the corners of your roof. A phone gives the most exact spot.");
      },
      () => setNote("Location was not shared. Search by PIN code or area instead."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (failed) return <p className="muted">The map could not load, so type your roof area below instead.</p>;

  return (
    <div className="roof-measure">
      <div className="roof-measure-head">
        <h3><Ruler size={18} aria-hidden="true" /> Measure your roof on the map</h3>
        <p className="muted" style={{ margin: "4px 0 0" }}>1. Find your house (use your location, or search). 2. Zoom in until you can see your own roof. 3. Click each corner of the roof. Drag a corner to fix it.</p>
      </div>
      <form onSubmit={search} className="roof-search">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="PIN code, area or city" aria-label="Find your house" maxLength={80} />
        <button type="submit" className="button"><Search size={15} aria-hidden="true" /> Find</button>
        <button type="button" className="button button-outline" onClick={locate}><LocateFixed size={15} aria-hidden="true" /> Use my location</button>
      </form>
      {note ? <p className="muted" role="status" style={{ margin: "6px 0" }}>{note}</p> : null}
      <div ref={el} className="map-frame roof-map" style={{ height: 380 }} role="region" aria-label="Satellite map for measuring your roof" />
      <div className="roof-result" aria-live="polite">
        <div>
          <strong className="roof-area">{area > 0 ? `${Math.round(area)} m²` : "–"}</strong>
          <span className="muted"> {area > 0 ? `(about ${Math.round(area * SQFT_PER_M2)} sq ft) from ${corners} corners` : corners > 0 ? `${corners} corner${corners === 1 ? "" : "s"}: add at least 3` : "Click the corners of your roof"}</span>
        </div>
        <div className="toolbar">
          <button type="button" className="button button-outline" onClick={undo} disabled={corners === 0}><Undo2 size={15} aria-hidden="true" /> Undo</button>
          <button type="button" className="button button-outline" onClick={clear} disabled={corners === 0}><Trash2 size={15} aria-hidden="true" /> Clear</button>
          <button type="button" className="button button-surya" disabled={area < 5} onClick={() => { onUse(Math.round(area * 10) / 10); setUsed(true); }}>
            {used ? "Added to the estimate" : "Use this roof area"}
          </button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: "12.5px", margin: 0 }}>
        You draw the outline yourself, so the area is only as accurate as the picture and your corners. Satellite images can be a few years old. The estimate below applies its own allowance for shade and obstacles.
      </p>
    </div>
  );
}

/**
 * Decoration with a point: the 24 hours of a home's day as tiles. Amber is the midday solar window, coral is
 * the evening peak, green is ordinary hours and the dark tiles are the night. It is the idea behind Cleanest Hour.
 */
const kind = (hour: number) => (hour >= 18 && hour < 22 ? "peak" : hour >= 10 && hour < 15 ? "solar" : hour < 6 || hour >= 22 ? "night" : "");

export function HourMosaic() {
  return (
    <>
      <div className="hour-mosaic" role="img" aria-label="A day in 24 hourly tiles: midday solar hours, the evening peak, ordinary hours and night">
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className={`hour-tile ${kind(hour)}`} style={{ animationDelay: `${hour * 35}ms` }} />
        ))}
      </div>
      <div className="mosaic-legend" aria-hidden="true">
        <span><i style={{ background: "#F5AE5C" }} />Solar hours</span>
        <span><i style={{ background: "#FF9D84" }} />Evening peak</span>
        <span><i style={{ background: "rgba(109,190,144,0.5)" }} />Everyday</span>
      </div>
    </>
  );
}

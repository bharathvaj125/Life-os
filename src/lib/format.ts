const inrFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const numFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export const inr = (n: number) => `₹${inrFormat.format(n)}`;
export const num = (n: number) => numFormat.format(n);
export const inrRange = (r: { low: number; high: number }) => (r.low === r.high ? inr(r.low) : `${inr(r.low)} – ${inr(r.high)}`);
export const numRange = (r: { low: number; high: number }) => (r.low === r.high ? num(r.low) : `${num(r.low)} – ${num(r.high)}`);

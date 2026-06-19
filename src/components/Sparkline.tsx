export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 80, h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return null;
  const range = max - min;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const last = pts[pts.length - 1].split(",");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className}>
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill="currentColor" />
    </svg>
  );
}

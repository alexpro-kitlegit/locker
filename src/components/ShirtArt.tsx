import { useId } from "react";
import type { Kit } from "../lib/types";

const SHIRT =
  "M64 34 L84 24 Q100 38 116 24 L136 34 L170 56 L158 86 L140 78 L140 176 Q100 182 60 176 L60 78 L42 86 L30 56 Z";

/** Placeholder shirt drawing in a club's kit colours. Real listings use the seller's photos. */
export function ShirtArt({ kit, printing, className }: { kit: Kit; printing?: string; className?: string }) {
  const clip = useId();
  const pc = kit.patternColor ?? kit.trim;
  const [name, number] = printing ? splitPrinting(printing) : [undefined, undefined];

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <path d={SHIRT} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="200" height="200" fill={kit.body} />
        {kit.pattern === "stripes" &&
          [70, 94, 118, 142].map((x) => <rect key={x} x={x} y="0" width="12" height="200" fill={pc} />)}
        {kit.pattern === "hoops" &&
          [60, 92, 124, 156].map((y) => <rect key={y} x="0" y={y} width="200" height="16" fill={pc} />)}
        {kit.pattern === "sash" && <polygon points="60,60 84,40 150,170 126,190" fill={pc} />}
        {kit.pattern === "halves" && <rect x="0" y="0" width="100" height="200" fill={pc} />}
        {/* sleeve cuffs */}
        <polygon points="42,86 30,56 26,64 38,92" fill={kit.trim} />
        <polygon points="158,86 170,56 174,64 162,92" fill={kit.trim} />
      </g>
      <path d={SHIRT} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M84 24 Q100 42 116 24" fill="none" stroke={kit.trim} strokeWidth="5" strokeLinecap="round" />
      {number ? (
        <text
          x="100"
          y="128"
          textAnchor="middle"
          fontSize="44"
          fontWeight="800"
          fill={kit.trim}
          fontFamily="Inter, sans-serif"
        >
          {number}
        </text>
      ) : (
        <circle cx="122" cy="68" r="7" fill={kit.trim} opacity="0.9" />
      )}
      {name && (
        <text x="100" y="80" textAnchor="middle" fontSize="13" fontWeight="700" fill={kit.trim} fontFamily="Inter, sans-serif" letterSpacing="1">
          {name}
        </text>
      )}
    </svg>
  );
}

function splitPrinting(p: string): [string | undefined, string | undefined] {
  const m = p.trim().match(/^(.*?)\s*(\d{1,2})$/);
  return m ? [m[1] || undefined, m[2]] : [p, undefined];
}

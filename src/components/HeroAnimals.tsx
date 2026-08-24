/** Subtle folk-art animal silhouettes drifting behind the hero.
 * Purely decorative — very low opacity so they read as charms, not imagery. */

const ELEPHANT =
  "M6 44c0-9 5-16 14-19 6-2 13-2 19 0 5 2 8 5 10 9 2 4 6 5 9 4 3-1 4-4 3-7l4 1c2 6-1 12-7 14-5 2-10 0-13-3l-1 15h-7l-1-10c-4 1-8 1-12 1l-1 9h-7l-1-11c-5-2-8-5-9-3z M27 20c0-4 3-7 7-7s7 3 7 7";

const CAMEL =
  "M10 52l2-16c1-6 5-10 11-11 4-1 6-4 8-8 2-4 6-6 10-5l1 4-4 2-2 6 8 2c6 2 10 7 11 13l2 13h-6l-2-12-6 2-1 10h-6l1-11-10-1-2 12h-6l1-11-4 1-1 10z";

const LION =
  "M32 12c9 0 16 6 16 14 0 4-2 8-5 10l6 16h-6l-4-12c-2 1-5 2-7 2s-5-1-7-2l-4 12h-6l6-16c-3-2-5-6-5-10 0-8 7-14 16-14z M16 26l-6-4 5-1-3-5 6 3z M48 26l6-4-5-1 3-5-6 3z";

const RABBIT =
  "M24 24c-2-8-1-16 2-16s5 8 4 15c3-1 6-1 9 0-1-7 1-15 4-15s4 8 2 16c5 3 8 8 8 14 0 9-8 14-18 14S17 47 17 38c0-6 3-11 7-14z";

const PEACOCK =
  "M32 54c-7 0-12-5-12-11 0-5 3-9 7-11-1-3 0-6 2-8 2-2 6-2 8 0l6-5 1 5 6-1-3 5c6 3 9 9 9 16 0 6-5 10-11 10z M26 24l-8-6 2 8-8 1 7 4z M44 22l9-5-3 8 8 2-8 3z";

const DEER =
  "M22 26c-3-6-4-12-2-14l4 6 3-5 2 7 3-3 1 6c3-1 6-1 9 0l1-6 3 3 2-7 3 5 4-6c2 2 1 8-2 14 4 3 6 8 6 13 0 9-7 15-16 15s-16-6-16-15c0-5 2-10 5-13z";

const BIRD =
  "M14 40c0-9 8-16 18-16 6 0 11 2 14 6l10-3-5 8 6 3-8 3c-2 8-9 13-17 13-10 0-18-6-18-14z M20 34l-10-6 3 9-8 3 10 2z";

const shapes = [
  { d: ELEPHANT, style: { left: "3%", top: "16%", width: "116px" }, rotate: -4 },
  { d: CAMEL, style: { left: "22%", top: "60%", width: "84px" }, rotate: 3 },
  { d: LION, style: { right: "4%", top: "50%", width: "98px" }, rotate: 2 },
  // bottom-left
  { d: DEER, style: { left: "7%", top: "72%", width: "74px" }, rotate: 4 },
  { d: RABBIT, style: { left: "24%", top: "84%", width: "52px" }, rotate: 8 },
  // top-right
  { d: PEACOCK, style: { right: "7%", top: "7%", width: "80px" }, rotate: -4 },
  { d: BIRD, style: { right: "24%", top: "16%", width: "54px" }, rotate: 9 },
];

export function HeroAnimals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {shapes.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 64 64"
          className="absolute text-primary-foreground/10"
          style={{ ...s.style, transform: `rotate(${s.rotate}deg)` }}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.1}
          strokeLinejoin="round"
          strokeOpacity={0.55}
        >
          <path d={s.d} />
        </svg>
      ))}
    </div>
  );
}

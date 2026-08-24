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

const shapes = [
  { d: ELEPHANT, style: { left: "4%", top: "18%", width: "112px" }, rotate: -4 },
  { d: CAMEL, style: { left: "24%", top: "58%", width: "84px" }, rotate: 3 },
  { d: RABBIT, style: { right: "26%", top: "16%", width: "62px" }, rotate: -6 },
  { d: LION, style: { right: "5%", top: "52%", width: "96px" }, rotate: 2 },
  { d: CAMEL, style: { right: "44%", top: "8%", width: "58px" }, rotate: -8 },
  { d: ELEPHANT, style: { left: "40%", top: "70%", width: "70px" }, rotate: 5 },
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
        >
          <path d={s.d} />
        </svg>
      ))}
    </div>
  );
}

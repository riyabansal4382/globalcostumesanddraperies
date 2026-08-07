export type Costume = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  source_path: string;
  category: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  is_available: boolean;
  rental_price: number | null;
};

/** Swatch colours for filter chips. Values are intentionally literal hex —
 * they represent real garment colours, not theme tokens. */
export const COLOR_SWATCHES: Record<string, string> = {
  Black: "#1c1c1e",
  White: "#f7f4ec",
  Grey: "#9aa0a6",
  Silver: "#c9ccd1",
  Gold: "#d4a017",
  Bronze: "#a濃",
  Red: "#c1352b",
  Pink: "#e58bb0",
  Orange: "#e07a2f",
  Yellow: "#e8c33c",
  Green: "#3f8f5c",
  Blue: "#3a6ea5",
  Purple: "#7a4ea3",
  Brown: "#8a5a3b",
  Cream: "#efe4cf",
  Multicolour:
    "linear-gradient(135deg,#c1352b 0%,#e8c33c 33%,#3f8f5c 66%,#3a6ea5 100%)",
};

export const KNOWN_COLORS = Object.keys(COLOR_SWATCHES).filter(
  (c) => c !== "Multicolour",
);

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Kids", "One size"];

export function swatchStyle(color: string) {
  const value = COLOR_SWATCHES[color];
  if (!value) return { background: "var(--muted)" };
  return value.startsWith("linear-gradient")
    ? { backgroundImage: value }
    : { backgroundColor: value };
}

/** Guess costume details from an OneDrive-style file path/name,
 * e.g. "Fantasy/Ice Queen - blue white - S,M,L.jpg". */
export function parseFromFilename(path: string) {
  const file = path.split("/").pop() ?? path;
  const folder = path.includes("/") ? (path.split("/").at(-2) ?? "") : "";
  const base = file.replace(/\.[a-z0-9]+$/i, "").replace(/[_]+/g, " ");
  const parts = base.split("-").map((p) => p.trim());
  const name = parts[0] ?? base;

  const haystack = base.toLowerCase();
  const colors = KNOWN_COLORS.filter((c) => haystack.includes(c.toLowerCase()));
  const sizes = SIZE_ORDER.filter((s) =>
    new RegExp(`(^|[^a-z])${s.toLowerCase()}([^a-z]|$)`, "i").test(base),
  );

  return {
    name: name.replace(/\b\w/g, (m) => m.toUpperCase()),
    category: folder ? folder.replace(/[-_]+/g, " ") : "Other",
    colors,
    sizes,
  };
}

/** Turn a OneDrive share link into an embeddable direct image URL. */
export function normalizeImageUrl(url: string) {
  const trimmed = url.trim();
  if (/^https:\/\/1drv\.ms\//i.test(trimmed)) {
    const encoded = btoa(trimmed)
      .replace(/=+$/, "")
      .replace(/\//g, "_")
      .replace(/\+/g, "-");
    return `https://api.onedrive.com/v1.0/shares/u!${encoded}/root/content`;
  }
  return trimmed;
}

import type { Costume } from "@/lib/costumes";
import { pathSegments } from "@/lib/folders";

/** Normalise for matching: lowercase, strip non-alphanumerics. */
function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}


/** Levenshtein distance, capped for speed. */
function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
      curr[j] = v;
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prev = curr;
  }
  return prev[b.length]!;
}

/** Score a single token against a single field value. Higher is better, 0 = no match. */
function scoreField(q: string, field: string) {
  if (!field) return 0;
  if (field === q) return 100;
  if (field.startsWith(q)) return 80;
  const idx = field.indexOf(q);
  if (idx >= 0) return 60 - Math.min(idx, 20);

  // Fuzzy: allow typos / missing letters on words of comparable length.
  if (q.length >= 3) {
    const tolerance = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
    // Compare against a prefix of the field so "sari" ~ "saree".
    const window = field.slice(0, q.length + tolerance);
    const d = editDistance(q, window, tolerance) ?? tolerance + 1;
    if (d <= tolerance) return 45 - d * 8;
  }
  return 0;
}

type Indexed = {
  costume: Costume;
  name: string;
  collections: string[];
  colors: string[];
  tags: string[];
};

export function buildSearchIndex(costumes: Costume[]): Indexed[] {
  return costumes.map((costume) => ({
    costume,
    name: norm(costume.name),
    collections: [costume.category, ...pathSegments(costume.source_path)]
      .map(norm)
      .filter(Boolean),
    colors: costume.colors.map(norm),
    tags: costume.tags.map(norm),
  }));
}

const WEIGHTS = { name: 1.4, collection: 1, color: 1.1, tag: 0.9 };

function scoreEntry(tokens: string[], entry: Indexed) {
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    best = Math.max(best, scoreField(token, entry.name) * WEIGHTS.name);
    for (const c of entry.collections)
      best = Math.max(best, scoreField(token, c) * WEIGHTS.collection);
    for (const c of entry.colors)
      best = Math.max(best, scoreField(token, c) * WEIGHTS.color);
    for (const t of entry.tags)
      best = Math.max(best, scoreField(token, t) * WEIGHTS.tag);
    if (best === 0) return 0; // every token must match something
    total += best;
  }
  return total;
}

/** Fuzzy search across name, collection/category and colour tags. */
export function searchCostumes(index: Indexed[], query: string): Costume[] {
  const tokens = query
    .split(/\s+/)
    .map(norm)
    .filter(Boolean);
  if (tokens.length === 0) return index.map((e) => e.costume);

  const scored: { score: number; entry: Indexed }[] = [];
  for (const entry of index) {
    const score = scoreEntry(tokens, entry);
    if (score > 0) scored.push({ score, entry });
  }
  scored.sort(
    (a, b) =>
      b.score - a.score || a.entry.costume.name.localeCompare(b.entry.costume.name),
  );
  return scored.map((s) => s.entry.costume);
}

/** Suggestion terms (names, collections, colours) matching the query. */
export function searchSuggestions(index: Indexed[], query: string, limit = 6) {
  const tokens = query.split(/\s+/).map(norm).filter(Boolean);
  if (tokens.length === 0) return [];
  const seen = new Map<string, number>();
  for (const entry of index) {
    const candidates: [string, string][] = [
      [entry.name, entry.costume.name],
      ...entry.costume.colors.map(
        (c, i) => [entry.colors[i], c] as [string, string],
      ),
      ...[entry.costume.category, ...pathSegments(entry.costume.source_path)].map(
        (c) => [norm(c), c] as [string, string],
      ),
      ...entry.costume.tags.map((t, i) => [entry.tags[i], t] as [string, string]),
    ];
    for (const [normed, label] of candidates) {
      if (!normed || !label) continue;
      const s = scoreField(tokens[tokens.length - 1] ?? "", normed);
      if (s > 0 && (seen.get(label) ?? 0) < s) seen.set(label, s);
    }
  }
  return [...seen.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label]) => label);
}

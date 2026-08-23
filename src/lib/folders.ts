import { supabase } from "@/integrations/supabase/client";
import type { Costume } from "@/lib/costumes";

const PAGE = 1000;

export async function fetchCostumes(): Promise<Costume[]> {
  const all: Costume[] = [];
  // PostgREST caps a response at 1000 rows, so page through the catalogue.
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("costumes")
      .select("*")
      .order("name", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...((data ?? []) as Costume[]));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

export const costumesQuery = {
  queryKey: ["costumes"] as const,
  queryFn: fetchCostumes,
};

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Folder segments of a photo's OneDrive path, excluding the file name. */
export function pathSegments(sourcePath: string): string[] {
  return sourcePath
    .split("/")
    .slice(0, -1)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True when the path lives inside the internal OneDrive "site" folder. */
function isSiteFolderPath(sourcePath: string): boolean {
  const first = pathSegments(sourcePath)[0];
  return first?.toLowerCase() === "site";
}


export type FolderNode = {
  name: string;
  slug: string;
  /** Photos directly inside this folder. */
  items: Costume[];
  /** Photos in this folder and everything below it. */
  total: number;
  cover: Costume | undefined;
  children: FolderNode[];
};

function build(
  costumes: Costume[],
  depth: number,
  prefix: string[],
): FolderNode[] {
  const groups = new Map<string, { name: string; rows: Costume[] }>();
  for (const item of costumes) {
    const segs = pathSegments(item.source_path);
    const name = segs[depth];
    if (!name) continue;
    const slug = slugify(name);
    const bucket = groups.get(slug) ?? { name, rows: [] };
    bucket.rows.push(item);
    groups.set(slug, bucket);
  }

  return [...groups.entries()]
    .map(([slug, { name, rows }]) => {
      const items = rows.filter(
        (r) => pathSegments(r.source_path).length === depth + 1,
      );
      const children = build(rows, depth + 1, [...prefix, slug]);
      return {
        name,
        slug,
        items,
        total: rows.length,
        cover: items[0] ?? children[0]?.cover,
        children,
      } satisfies FolderNode;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildFolderTree(costumes: Costume[]): FolderNode[] {
  return build(costumes, 0, []);
}

export function findFolder(
  tree: FolderNode[],
  slugs: string[],
): FolderNode | undefined {
  let nodes = tree;
  let found: FolderNode | undefined;
  for (const slug of slugs) {
    found = nodes.find((n) => n.slug === slug);
    if (!found) return undefined;
    nodes = found.children;
  }
  return found;
}

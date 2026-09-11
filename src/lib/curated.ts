import type { Costume } from "@/lib/costumes";
import { pathSegments, slugify } from "@/lib/folders";

export type CuratedRow = {
  title: string;
  blurb: string;
  /** Top-level collection folder slugs that feed this row. */
  folders: string[];
  items: Costume[];
};

const CURATED: Omit<CuratedRow, "items">[] = [
  {
    title: "Navratri & festive",
    blurb: "Ghaghra, navari sarees, kediya and dupattas for garba nights.",
    folders: ["ghaghra", "navari", "kediya", "duppatta", "koli"],
  },
  {
    title: "School fancy dress",
    blurb: "Kids' outfits, animal masks and mythological characters.",
    folders: ["kids", "animal-mask", "mythological", "krishnaradha", "mascots"],
  },
  {
    title: "Bridal & sangeet",
    blurb: "Bridal wear, sarees, sherwanis and evening gowns.",
    folders: ["bridal", "saree", "sherwani", "rajputi-poshak", "evening-gowns"],
  },
  {
    title: "Classical dance",
    blurb: "Kathak, Bharatanatyam and regional dance costumes.",
    folders: ["kathak", "bharatnatyam", "regional", "parkarpolka-south"],
  },
];

/** Photos that belong to a curated row, one image per top-level folder first. */
export function buildCuratedRows(costumes: Costume[], perRow = 12): CuratedRow[] {
  const byFolder = new Map<string, Costume[]>();
  for (const item of costumes) {
    const top = pathSegments(item.source_path)[0];
    if (!top || !item.image_url) continue;
    const slug = slugify(top);
    const list = byFolder.get(slug) ?? [];
    list.push(item);
    byFolder.set(slug, list);
  }

  return CURATED.map((row) => {
    const buckets = row.folders
      .map((f) => byFolder.get(f) ?? [])
      .filter((b) => b.length > 0);

    // Interleave folders so a row shows variety rather than 12 of one folder.
    const items: Costume[] = [];
    for (let i = 0; items.length < perRow; i += 1) {
      let added = false;
      for (const bucket of buckets) {
        const next = bucket[i];
        if (!next) continue;
        items.push(next);
        added = true;
        if (items.length >= perRow) break;
      }
      if (!added) break;
    }

    return { ...row, items };
  }).filter((row) => row.items.length >= 4);
}

import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://globalcostumesanddraperies.lovable.app";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

        // Pull every source_path so we can enumerate the collection folders.
        const folders = new Set<string>();
        const page = 1000;
        for (let from = 0; ; from += page) {
          const res = await fetch(
            `${supabaseUrl}/rest/v1/costumes?select=source_path&order=source_path.asc&offset=${from}&limit=${page}`,
            {
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
              },
            },
          );
          if (!res.ok) break;
          const rows = (await res.json()) as { source_path: string }[];
          for (const row of rows) {
            const segs = row.source_path
              .split("/")
              .slice(0, -1)
              .map((s) => s.trim())
              .filter(Boolean);
            if (segs[0]?.toLowerCase() === "site") continue;
            // Register every folder prefix so nested collections are included.
            for (let depth = 1; depth <= segs.length; depth++) {
              folders.add(
                segs
                  .slice(0, depth)
                  .map(slugify)
                  .join("/"),
              );
            }
          }
          if (rows.length < page) break;
        }

        const urls = [
          `<url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>`,
          ...[...folders].sort().map(
            (f) =>
              `<url><loc>${BASE_URL}/collection/${f}</loc><priority>0.7</priority></url>`,
          ),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

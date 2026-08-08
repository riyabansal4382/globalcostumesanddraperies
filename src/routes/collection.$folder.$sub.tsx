import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CostumeCard } from "@/components/CostumeCard";
import { FolderCard } from "@/components/FolderCard";
import { FilterChip } from "@/components/FilterChip";
import { buildFolderTree, costumesQuery, findFolder } from "@/lib/folders";
import { swatchStyle } from "@/lib/costumes";

export const Route = createFileRoute("/collection/$folder/$sub")({
  head: ({ params }) => {
    const label = params.sub.replace(/-/g, " ");
    const title = `${label} — Velvet & Verve costume hire`;
    const description = `Every ${label} piece in our wardrobe, photographed and ready to hire.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: SubFolderPage,
});

function SubFolderPage() {
  const { folder, sub } = Route.useParams();
  const { data, isLoading } = useQuery(costumesQuery);
  const [visible, setVisible] = useState(60);
  const [colors, setColors] = useState<string[]>([]);

  const { parent, node } = useMemo(() => {
    const tree = buildFolderTree(data ?? []);
    return {
      parent: findFolder(tree, [folder]),
      node: findFolder(tree, [folder, sub]),
    };
  }, [data, folder, sub]);

  const colorFacets = useMemo(() => {
    const set = new Set<string>();
    for (const item of node?.items ?? []) {
      item.colors.forEach((c) => set.add(c));
    }
    return [...set].sort();
  }, [node]);

  const filteredItems = useMemo(() => {
    if (!node) return [];
    if (!colors.length) return node.items;
    return node.items.filter((item) =>
      item.colors.some((c) => colors.includes(c)),
    );
  }, [node, colors]);

  useEffect(() => setVisible(60), [colors]);

  const toggleColor = (color: string) =>
    setColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );

  return (
    <main className="min-h-screen bg-background">
      <header className="stage-gradient">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Link to="/" className="font-display text-xl font-semibold text-primary-foreground">
            Velvet &amp; Verve
          </Link>
          <Button asChild variant="secondary" size="sm">
            <Link to="/collection/$folder" params={{ folder }}>
              <ArrowLeft className="size-4" /> {parent?.name ?? "Back"}
            </Link>
          </Button>
        </nav>
        <div className="mx-auto max-w-6xl px-5 pb-12">
          <p className="text-xs uppercase tracking-widest text-accent">
            {parent?.name ?? folder.replace(/-/g, " ")}
          </p>
          <h1 className="mt-2 font-display text-4xl text-primary-foreground">
            {node?.name ?? sub.replace(/-/g, " ")}
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/75">
            {node ? `${node.total} photos` : isLoading ? "Loading…" : "Collection not found"}
          </p>
        </div>
        <div className="curtain-rule h-1.5 w-full opacity-70" />
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : !node ? (
          <p className="text-center text-muted-foreground">
            We couldn&apos;t find that collection.
          </p>
        ) : (
          <>
            {node.children.length > 0 && (
              <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {node.children.map((child) => (
                  <FolderCard
                    key={child.slug}
                    folder={child}
                    linkProps={{
                      to: "/collection/$folder/$sub",
                      params: { folder, sub: child.slug },
                    }}
                  />
                ))}
              </div>
            )}

            {colorFacets.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl">
                  Photos
                  {colors.length > 0 && ` — ${filteredItems.length} match`}
                </h2>
                {colors.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setColors([])}>
                    Clear colour filter
                  </Button>
                )}
              </div>
            )}

            {colorFacets.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {colorFacets.map((c) => (
                  <FilterChip key={c} active={colors.includes(c)} onClick={() => toggleColor(c)}>
                    <span
                      className="size-3.5 rounded-full border border-border"
                      style={swatchStyle(c)}
                    />
                    {c}
                  </FilterChip>
                ))}
              </div>
            )}

            {filteredItems.length > 0 && (
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.slice(0, visible).map((costume) => (
                  <CostumeCard key={costume.id} costume={costume} />
                ))}
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="mt-16 text-center">
                <p className="font-display text-2xl">No photos match this colour</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try clearing the filter or browsing a deeper sub-collection.
                </p>
              </div>
            )}

            {visible < filteredItems.length && (
              <div className="mt-10 text-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + 60)}>
                  Show more photos
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

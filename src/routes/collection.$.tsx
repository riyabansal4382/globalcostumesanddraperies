import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CostumeCard } from "@/components/CostumeCard";
import { FolderCard } from "@/components/FolderCard";
import { FilterChip } from "@/components/FilterChip";
import {
  buildFolderTree,
  costumesQuery,
  findFolder,
  type FolderNode,
} from "@/lib/folders";
import { swatchStyle, type Costume } from "@/lib/costumes";

export const Route = createFileRoute("/collection/$")({
  head: ({ params }) => {
    const label = ((params as { _splat?: string })._splat ?? "")
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/-/g, " ");
    const title = `${label ?? "Collection"} — Global Costumes & Draperies costume hire`;
    const description = `Every ${label ?? "costume"} piece in our wardrobe, photographed and ready to hire.`;
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
  component: CollectionPage,
});

/** Every photo in this folder and all of its sub-folders. */
function allItems(node: FolderNode): Costume[] {
  return [...node.items, ...node.children.flatMap(allItems)];
}

function CollectionPage() {
  const params = Route.useParams() as { _splat?: string };
  const splat = params._splat ?? "";
  const segments = useMemo<string[]>(
    () => splat.split("/").filter(Boolean),
    [splat],
  );
  const { data, isLoading } = useQuery(costumesQuery);
  const [visible, setVisible] = useState(60);
  const [colors, setColors] = useState<string[]>([]);

  const { node, trail } = useMemo(() => {
    const tree = buildFolderTree(data ?? []);
    return {
      node: findFolder(tree, segments),
      trail: segments.map((_seg: string, i: number) => ({
        slug: segments.slice(0, i + 1).join("/"),
        node: findFolder(tree, segments.slice(0, i + 1)),
      })),
    };
  }, [data, segments]);

  const descendants = useMemo(() => (node ? allItems(node) : []), [node]);

  const colorFacets = useMemo(() => {
    const set = new Set<string>();
    for (const item of descendants) item.colors.forEach((c) => set.add(c));
    return [...set].sort();
  }, [descendants]);

  // With no colour filter we show the photos sitting directly in this folder;
  // filtering searches the whole sub-tree so tagged photos deeper down surface.
  const filteredItems = useMemo(() => {
    if (!node) return [];
    if (!colors.length) return node.items;
    return descendants.filter((item) =>
      item.colors.some((c) => colors.includes(c)),
    );
  }, [node, descendants, colors]);

  useEffect(() => setVisible(60), [colors, splat]);

  const toggleColor = (color: string) =>
    setColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );

  const parentSplat = segments.slice(0, -1).join("/");
  const parentName = trail.at(-2)?.node?.name;

  return (
    <main className="min-h-screen bg-background">
      <header className="stage-gradient">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Link
            to="/"
            className="font-display text-xl font-semibold text-primary-foreground"
          >
            Global Costumes &amp; Draperies
          </Link>
          <Button asChild variant="secondary" size="sm">
            {parentSplat ? (
              <Link to="/collection/$" params={{ _splat: parentSplat }}>
                <ArrowLeft className="size-4" /> {parentName ?? "Back"}
              </Link>
            ) : (
              <Link to="/">
                <ArrowLeft className="size-4" /> All collections
              </Link>
            )}
          </Button>
        </nav>
        <div className="mx-auto max-w-6xl px-5 pb-12">
          {trail.length > 1 && (
            <p className="text-xs uppercase tracking-widest text-accent">
              {trail
                .slice(0, -1)
                .map((t: { node: FolderNode | undefined }, i: number) => t.node?.name ?? segments[i])
                .join(" › ")}
            </p>
          )}
          <h1 className="mt-2 font-display text-4xl text-primary-foreground">
            {node?.name ?? segments.at(-1)?.replace(/-/g, " ")}
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/75">
            {node
              ? `${node.total} photos`
              : isLoading
                ? "Loading…"
                : "Collection not found"}
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
            {node.children.length > 0 && colors.length === 0 && (
              <>
                <h2 className="text-xl">Sub-collections</h2>
                <div className="mt-4 mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {node.children.map((child) => (
                    <FolderCard
                      key={child.slug}
                      folder={child}
                      linkProps={{
                        to: "/collection/$",
                        params: {
                          _splat: [...segments, child.slug].join("/"),
                        },
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {colorFacets.length > 0 && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl">
                    {colors.length > 0 ? "Matching photos" : "Photos"}
                    {colors.length > 0 && ` — ${filteredItems.length} match`}
                  </h2>
                  {colors.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setColors([])}
                    >
                      Clear colour filter
                    </Button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {colorFacets.map((c) => (
                    <FilterChip
                      key={c}
                      active={colors.includes(c)}
                      onClick={() => toggleColor(c)}
                    >
                      <span
                        className="size-3.5 rounded-full border border-border"
                        style={swatchStyle(c)}
                      />
                      {c}
                    </FilterChip>
                  ))}
                </div>
              </>
            )}

            {filteredItems.length > 0 && (
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.slice(0, visible).map((costume) => (
                  <CostumeCard key={costume.id} costume={costume} />
                ))}
              </div>
            )}

            {filteredItems.length === 0 && (colors.length > 0 || node.children.length === 0) && (
              <div className="mt-16 text-center">
                <p className="font-display text-2xl">
                  {colors.length ? "No photos match this colour" : "No photos here yet"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try clearing the filter or opening a sub-collection.
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

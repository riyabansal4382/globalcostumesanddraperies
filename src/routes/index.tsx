import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, SlidersHorizontal, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CostumeCard } from "@/components/CostumeCard";
import { FolderCard } from "@/components/FolderCard";
import { FilterChip } from "@/components/FilterChip";
import { HeroAnimals } from "@/components/HeroAnimals";

import { buildFolderTree, costumesQuery } from "@/lib/folders";
import { buildSearchIndex, searchCostumes, searchSuggestions } from "@/lib/search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { swatchStyle, type Costume } from "@/lib/costumes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Costumes & Draperies — Costume Hire Catalogue" },
      {
        name: "description",
        content:
          "Browse our full costume collection. Search by name or theme and filter by colour, category and size.",
      },
      { property: "og:title", content: "Global Costumes & Draperies — Costume Hire Catalogue" },
      {
        property: "og:description",
        content:
          "Browse our full costume collection. Search by name or theme and filter by colour, category and size.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalogue,
});



function Catalogue() {
  const { data, isLoading } = useQuery(costumesQuery);

  const [query, setQuery] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visible, setVisible] = useState(60);
  const debouncedQuery = useDebouncedValue(query, 300);



  const costumes = useMemo(() => data ?? [], [data]);

  const facets = useMemo(() => {
    const c = new Set<string>();
    const cat = new Set<string>();
    const s = new Set<string>();
    for (const item of costumes) {
      item.colors.forEach((v) => c.add(v));
      item.sizes.forEach((v) => s.add(v));
      if (item.category) cat.add(item.category);
    }
    return {
      colors: [...c].sort(),
      categories: [...cat].sort(),
      sizes: [...s].sort(),
    };
  }, [costumes]);

  const searchIndex = useMemo(() => buildSearchIndex(costumes), [costumes]);

  const suggestions = useMemo(
    () => (query.trim() ? searchSuggestions(searchIndex, query) : []),
    [query, searchIndex],
  );

  const results = useMemo(() => {
    const base = debouncedQuery.trim()
      ? searchCostumes(searchIndex, debouncedQuery)
      : costumes;
    return base.filter((item) => {
      if (colors.length && !colors.some((c) => item.colors.includes(c))) return false;
      if (categories.length && !categories.includes(item.category)) return false;
      if (sizes.length && !sizes.some((s) => item.sizes.includes(s))) return false;
      return true;
    });
  }, [costumes, searchIndex, debouncedQuery, colors, categories, sizes]);

  useEffect(() => setVisible(60), [debouncedQuery, colors, categories, sizes]);

  const folders = useMemo(() => buildFolderTree(costumes), [costumes]);
  const isSearching =
    debouncedQuery.trim().length > 0 ||
    colors.length > 0 ||
    categories.length > 0 ||
    sizes.length > 0;
  const isTyping = query.trim() !== debouncedQuery.trim();




  const toggle = (
    value: string,
    list: string[],
    set: (next: string[]) => void,
  ) => set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const activeCount = colors.length + categories.length + sizes.length;

  const clearAll = () => {
    setColors([]);
    setCategories([]);
    setSizes([]);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
          <span className="font-display text-lg tracking-wide text-primary sm:text-xl">
            Global Costumes &amp; Draperies
          </span>
          <span className="ml-auto hidden text-xs uppercase tracking-[0.25em] text-muted-foreground sm:block">
            Costume hire &amp; drapery
          </span>
        </div>
        <div className="gold-rule h-px w-full" />
      </div>

      <header className="stage-gradient relative overflow-hidden">
        <div className="veil-sheen absolute inset-0" aria-hidden />
        <HeroAnimals />
        <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-highlight/40 bg-highlight/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-highlight">
            <Sparkles className="size-3.5" /> Rangeen wardrobe
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl leading-tight text-primary-foreground sm:text-5xl">
            Costumes from every state and every country
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-primary-foreground/80 sm:text-base">
            Regional Indian dress and world costumes are photographed and searchable.
            Type a look, then narrow it down by colour.
          </p>



          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'saree', 'gold lehenga', 'dhoti'…"
              aria-label="Search costumes"
              className="h-14 rounded-full border border-highlight/40 bg-card pl-12 pr-12 text-base shadow-lift"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            )}

            {suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-16 z-20 overflow-hidden rounded-2xl border border-border bg-popover text-left shadow-lift">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-popover-foreground transition-colors hover:bg-secondary"
                  >
                    <Search className="size-4 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {facets.colors.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {facets.colors.slice(0, 12).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(c, colors, setColors)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    colors.includes(c)
                      ? "border-highlight bg-highlight text-highlight-foreground"
                      : "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20",
                  )}
                >
                  <span
                    className="size-3.5 rounded-full border border-border"
                    style={swatchStyle(c)}
                  />
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="curtain-rule h-2 w-full" />
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">
            {isLoading
              ? "Loading wardrobe…"
              : isTyping
                ? "Searching…"
                : isSearching
                  ? `${results.length} ${results.length === 1 ? "costume" : "costumes"}${debouncedQuery.trim() ? ` for “${debouncedQuery.trim()}”` : ""}`
                  : "Browse the wardrobe"}
          </h2>

          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className="gap-2"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeCount > 0 && <Badge variant="secondary">{activeCount}</Badge>}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "mt-5 space-y-5 rounded-2xl border border-border bg-card p-5 shadow-stage",
            !showFilters && "hidden",
          )}
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Colour
            </p>
            <div className="flex flex-wrap gap-2">
              {facets.colors.map((c) => (
                <FilterChip
                  key={c}
                  active={colors.includes(c)}
                  onClick={() => toggle(c, colors, setColors)}
                >
                  <span
                    className="size-3.5 rounded-full border border-border"
                    style={swatchStyle(c)}
                  />
                  {c}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Category / theme
            </p>
            <div className="flex flex-wrap gap-2">
              {facets.categories.map((c) => (
                <FilterChip
                  key={c}
                  active={categories.includes(c)}
                  onClick={() => toggle(c, categories, setCategories)}
                >
                  {c}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Size
            </p>
            <div className="flex flex-wrap gap-2">
              {facets.sizes.map((s) => (
                <FilterChip
                  key={s}
                  active={sizes.includes(s)}
                  onClick={() => toggle(s, sizes, setSizes)}
                >
                  {s}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : !isSearching ? (
          <>
            <p className="mt-8 text-sm text-muted-foreground">
              {folders.length} collections — pick one to see everything inside.
            </p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.slug}
                  folder={folder}
                  linkProps={{
                    to: "/collection/$",
                    params: { _splat: folder.slug },
                  }}

                />
              ))}
            </div>
          </>
        ) : results.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-display text-2xl">No costumes match that yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We couldn’t find anything for{" "}
              {debouncedQuery.trim() ? <strong>“{debouncedQuery.trim()}”</strong> : "those filters"}.
              Try a shorter word, a colour like “red”, or a collection name — or clear a
              filter or two.
            </p>
            {(activeCount > 0 || query) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setQuery("");
                  clearAll();
                }}
              >
                Reset search &amp; filters
              </Button>
            )}
          </div>
        ) : (

          <>
            <p className="mt-8 text-sm text-muted-foreground">
              Showing {Math.min(visible, results.length)} of {results.length} costumes
            </p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.slice(0, visible).map((costume) => (
                <CostumeCard key={costume.id} costume={costume} />
              ))}
            </div>
            {visible < results.length && (
              <div className="mt-10 text-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + 60)}>
                  Show more costumes
                </Button>
              </div>
            )}
          </>
        )}


      </section>

      <footer className="mt-6">
        <div className="gold-rule h-px w-full" />
        <div className="bg-secondary/50 py-10 text-center">
          <p className="font-display text-lg text-primary">Global Costumes &amp; Draperies</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <a href="tel:+918308504362" className="hover:text-primary hover:underline transition-colors">
              +91 83085 04362
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

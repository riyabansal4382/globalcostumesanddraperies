import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, SlidersHorizontal, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CostumeCard } from "@/components/CostumeCard";
import { swatchStyle, type Costume } from "@/lib/costumes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velvet & Verve — Costume Hire Catalogue" },
      {
        name: "description",
        content:
          "Browse our full costume collection. Search by name or theme and filter by colour, category and size.",
      },
      { property: "og:title", content: "Velvet & Verve — Costume Hire Catalogue" },
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

const PAGE = 1000;

async function fetchCostumes(): Promise<Costume[]> {
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


function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-stage"
          : "border-border bg-card text-foreground hover:border-accent hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

function Catalogue() {
  const { data, isLoading } = useQuery({
    queryKey: ["costumes"],
    queryFn: fetchCostumes,
  });

  const [query, setQuery] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [visible, setVisible] = useState(60);


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

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    const pool = new Set<string>();
    for (const item of costumes) {
      if (item.name.toLowerCase().includes(q)) pool.add(item.name);
      item.tags.forEach((t) => {
        if (t.toLowerCase().includes(q)) pool.add(t);
      });
      if (item.category.toLowerCase().includes(q)) pool.add(item.category);
    }
    return [...pool].slice(0, 6);
  }, [query, costumes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return costumes.filter((item) => {
      const haystack = [item.name, item.description, item.category, ...item.tags]
        .join(" ")
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (colors.length && !colors.some((c) => item.colors.includes(c))) return false;
      if (categories.length && !categories.includes(item.category)) return false;
      if (sizes.length && !sizes.some((s) => item.sizes.includes(s))) return false;
      return true;
    });
  }, [costumes, query, colors, categories, sizes]);

  useEffect(() => setVisible(60), [query, colors, categories, sizes]);



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
      <header className="stage-gradient relative overflow-hidden">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <span className="font-display text-xl font-semibold text-primary-foreground">
            Velvet &amp; Verve
          </span>
          <Button asChild variant="secondary" size="sm">
            <Link to="/admin">Staff area</Link>
          </Button>
        </nav>

        <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent">
            <Sparkles className="size-3.5" /> Costume hire &amp; wardrobe
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl leading-tight text-primary-foreground sm:text-5xl">
            Find the costume, not the cardboard box
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-primary-foreground/75 sm:text-base">
            Every piece in our wardrobe, photographed and searchable. Type a look, then
            narrow it down by colour, theme or size.
          </p>

          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'vampire', 'gold gown', 'pirate'…"
              aria-label="Search costumes"
              className="h-14 rounded-full border-0 bg-card pl-12 pr-12 text-base shadow-lift"
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
        </div>
        <div className="curtain-rule h-1.5 w-full opacity-70" />
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">
            {isLoading ? "Loading wardrobe…" : `${results.length} costumes`}
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
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-display text-2xl">Nothing matches that yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a broader search or clear a filter or two.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((costume) => (
              <CostumeCard key={costume.id} costume={costume} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        Velvet &amp; Verve Costume Hire — fittings by appointment.
      </footer>
    </main>
  );
}

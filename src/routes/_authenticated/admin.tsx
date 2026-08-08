import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Wand2, LogOut, CloudDownload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { importOneDriveCostumes } from "@/lib/onedrive.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  KNOWN_COLORS,
  SIZE_ORDER,
  normalizeImageUrl,
  parseFromFilename,
  swatchStyle,
  type Costume,
} from "@/lib/costumes";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Wardrobe manager — Velvet & Verve" },
      { name: "description", content: "Add, tag and update costumes in the catalogue." },
      { property: "og:title", content: "Wardrobe manager — Velvet & Verve" },
      { property: "og:description", content: "Add, tag and update costumes in the catalogue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const emptyForm = {
  name: "",
  description: "",
  image_url: "",
  source_path: "",
  category: "",
  colors: [] as string[],
  sizes: [] as string[],
  tags: "",
  is_available: true,
  rental_price: "",
};

function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin");
      setIsAdmin((rows?.length ?? 0) > 0);
    });
  }, []);

  const { data: costumes } = useQuery({
    queryKey: ["costumes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("costumes").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Costume[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("costumes").insert({
        name: form.name,
        description: form.description,
        image_url: normalizeImageUrl(form.image_url),
        source_path: form.source_path,
        category: form.category || "Other",
        colors: form.colors,
        sizes: form.sizes,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_available: form.is_available,
        rental_price: form.rental_price ? Number(form.rental_price) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Costume added");
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["costumes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("costumes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Costume removed");
      queryClient.invalidateQueries({ queryKey: ["costumes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runImport = useServerFn(importOneDriveCostumes);
  const importFromOneDrive = useMutation({
    mutationFn: () => runImport(),
    onSuccess: (r) => {
      toast.success(
        `Imported ${r.imported} new photo${r.imported === 1 ? "" : "s"} from OneDrive` +
          (r.skipped ? ` (${r.skipped} already in the catalogue)` : ""),
      );
      queryClient.invalidateQueries({ queryKey: ["costumes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const autofill = () => {
    const source = form.source_path || form.image_url;
    if (!source) {
      toast.error("Add a OneDrive file path or photo link first");
      return;
    }
    const guess = parseFromFilename(source);
    setForm((f) => ({
      ...f,
      name: f.name || guess.name,
      category: f.category || guess.category,
      colors: f.colors.length ? f.colors : guess.colors,
      sizes: f.sizes.length ? f.sizes : guess.sizes,
    }));
    toast.success("Details guessed from the file name");
  };

  const toggleIn = (key: "colors" | "sizes", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const count = useMemo(() => costumes?.length ?? 0, [costumes]);

  return (
    <main className="min-h-screen bg-background">
      <header className="stage-gradient px-5 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-2xl text-primary-foreground">Wardrobe manager</h1>
            <p className="text-sm text-primary-foreground/70">{count} costumes in the catalogue</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/">View site</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        {isAdmin === false && (
          <div className="mb-6 rounded-xl border border-border bg-secondary p-4 text-sm">
            This account isn&apos;t marked as an admin yet, so saving will be blocked. Ask an
            existing admin to grant your account the admin role.
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-6 shadow-stage">
          <h2 className="text-xl">Add a costume</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="image">Photo link (OneDrive share link or image URL)</Label>
              <Input
                id="image"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://1drv.ms/i/…"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="path">OneDrive file path (optional, used for auto-tagging)</Label>
              <div className="flex gap-2">
                <Input
                  id="path"
                  value={form.source_path}
                  onChange={(e) => setForm({ ...form, source_path: e.target.value })}
                  placeholder="Fantasy/Ice Queen - blue white - S,M,L.jpg"
                />
                <Button type="button" variant="outline" onClick={autofill} className="gap-2">
                  <Wand2 className="size-4" /> Auto-fill
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category / theme</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Fantasy"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Colours</Label>
              <div className="flex flex-wrap gap-2">
                {KNOWN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleIn("colors", c)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      form.colors.includes(c)
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-secondary",
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
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-2">
                {SIZE_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleIn("sizes", s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      form.sizes.includes(s)
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-secondary",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Search tags (comma separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="pirate, nautical, adult"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Hire price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={form.rental_price}
                onChange={(e) => setForm({ ...form, rental_price: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="available"
                checked={form.is_available}
                onCheckedChange={(v) => setForm({ ...form, is_available: v })}
              />
              <Label htmlFor="available">Available to hire</Label>
            </div>
          </div>

          <Button
            className="mt-6"
            disabled={!form.name || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Add costume"}
          </Button>
        </section>

        <section className="mt-10">
          <h2 className="text-xl">Catalogue</h2>
          <div className="mt-4 space-y-3">
            {(costumes ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{c.category}</Badge>
                    {c.colors.map((col) => (
                      <span
                        key={col}
                        title={col}
                        className="size-3.5 rounded-full border border-border"
                        style={swatchStyle(col)}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${c.name}`}
                  onClick={() => remove.mutate(c.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

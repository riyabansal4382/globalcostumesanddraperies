import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseFromFilename } from "@/lib/costumes";

export const importOneDriveCostumes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw new Error(roleError.message);
    if (!roleRow) throw new Error("Only admins can import from OneDrive.");


    const { listCostumePhotos } = await import("@/lib/onedrive.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const photos = await listCostumePhotos();

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("costumes")
      .select("source_path");
    if (existingError) throw new Error(existingError.message);

    const known = new Set((existing ?? []).map((r) => r.source_path));
    const rows = photos
      .filter((p) => !known.has(p.path))
      .map((p) => {
        const guess = parseFromFilename(p.path);
        return {
          name: p.name,
          description: "",
          image_url: `/api/public/onedrive-image?path=${encodeURIComponent(p.path)}`,
          source_path: p.path,
          category: p.category,
          colors: p.colors.length ? p.colors : guess.colors,
          sizes: guess.sizes,
          tags: [p.category.toLowerCase()],
          is_available: true,
        };
      });

    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabaseAdmin.from("costumes").insert(rows.slice(i, i + 200));
      if (error) throw new Error(error.message);
    }

    return { found: photos.length, imported: rows.length, skipped: photos.length - rows.length };
  });

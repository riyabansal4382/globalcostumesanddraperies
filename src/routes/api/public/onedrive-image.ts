import { createFileRoute } from "@tanstack/react-router";

// Public image proxy: costume photos live in the business OneDrive and their
// direct download links expire, so we stream them through this stable URL.
// Read-only, single item by path (or legacy item id), no user data exposed.
export const Route = createFileRoute("/api/public/onedrive-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const path = params.get("path");
        const id = params.get("id");
        const root = params.get("root");

        if (path && (path.length > 400 || path.includes(".."))) {
          return new Response("Invalid path", { status: 400 });
        }
        if (!path && (!id || !/^[A-Za-z0-9!._-]{5,200}$/.test(id))) {
          return new Response("Invalid id", { status: 400 });
        }
        if (root && !/^[A-Za-z0-9_\- ]{1,100}$/.test(root)) {
          return new Response("Invalid root", { status: 400 });
        }

        try {
          const { fetchImage, fetchImageByPath } = await import("@/lib/onedrive.server");
          const upstream = path
            ? await fetchImageByPath(path, root ?? undefined)
            : await fetchImage(id!);
          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
              "Cache-Control": "public, max-age=86400, s-maxage=604800",
            },
          });
        } catch (e) {
          console.error("[onedrive-image]", e);
          return new Response("Image unavailable", { status: 502 });
        }
      },
    },
  },
});

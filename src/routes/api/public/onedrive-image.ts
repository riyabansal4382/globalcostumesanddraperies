import { createFileRoute } from "@tanstack/react-router";

// Public image proxy: costume photos live in the business OneDrive and their
// direct download links expire, so we stream them through this stable URL.
// Read-only, single item by id, no user data exposed.
export const Route = createFileRoute("/api/public/onedrive-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("id");
        if (!id || !/^[A-Za-z0-9!._-]{5,200}$/.test(id)) {
          return new Response("Invalid id", { status: 400 });
        }
        try {
          const { fetchImage } = await import("@/lib/onedrive.server");
          const upstream = await fetchImage(id);
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

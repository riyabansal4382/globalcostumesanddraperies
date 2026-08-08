import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CostumeCard } from "@/components/CostumeCard";
import { FolderCard } from "@/components/FolderCard";
import { buildFolderTree, costumesQuery, findFolder } from "@/lib/folders";

export const Route = createFileRoute("/collection/$folder/")({
  head: ({ params }) => {
    const title = `${params.folder.replace(/-/g, " ")} costumes — Velvet & Verve`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Browse every photographed piece in our ${params.folder.replace(/-/g, " ")} collection, ready to hire.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Browse every photographed piece in our ${params.folder.replace(/-/g, " ")} collection, ready to hire.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: FolderPage,
});

function FolderPage() {
  const { folder: slug } = Route.useParams();
  const { data, isLoading } = useQuery(costumesQuery);
  const [visible, setVisible] = useState(60);

  const node = useMemo(() => {
    const tree = buildFolderTree(data ?? []);
    return findFolder(tree, [slug]);
  }, [data, slug]);

  return (
    <main className="min-h-screen bg-background">
      <header className="stage-gradient">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Link to="/" className="font-display text-xl font-semibold text-primary-foreground">
            Velvet &amp; Verve
          </Link>
          <Button asChild variant="secondary" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" /> All collections
            </Link>
          </Button>
        </nav>
        <div className="mx-auto max-w-6xl px-5 pb-12">
          <h1 className="font-display text-4xl text-primary-foreground">
            {node?.name ?? slug.replace(/-/g, " ")}
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
              <>
                <h2 className="text-xl">Sub-collections</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {node.children.map((child) => (
                    <FolderCard
                      key={child.slug}
                      folder={child}
                      linkProps={{
                        to: "/collection/$folder/$sub",
                        params: { folder: node.slug, sub: child.slug },
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {node.items.length > 0 && (
              <>
                <h2 className="mt-12 text-xl">
                  {node.children.length > 0 ? `More ${node.name}` : "Photos"}
                </h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {node.items.slice(0, visible).map((costume) => (
                    <CostumeCard key={costume.id} costume={costume} />
                  ))}
                </div>
                {visible < node.items.length && (
                  <div className="mt-10 text-center">
                    <Button variant="outline" onClick={() => setVisible((v) => v + 60)}>
                      Show more photos
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

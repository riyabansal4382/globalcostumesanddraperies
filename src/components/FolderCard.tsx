import { Link } from "@tanstack/react-router";
import { Images, FolderOpen } from "lucide-react";
import type { FolderNode } from "@/lib/folders";

export function FolderCard({
  folder,
  linkProps,
}: {
  folder: FolderNode;
  linkProps: { to: string; params?: Record<string, string> };
}) {
  return (
    <Link
      {...(linkProps as unknown as React.ComponentProps<typeof Link>)}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-stage transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        {folder.cover ? (
          <img
            src={folder.cover.image_url}
            alt={`${folder.name} costumes`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <FolderOpen className="size-8" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <h3 className="font-display text-lg leading-tight">{folder.name}</h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
          <Images className="size-3.5" />
          {folder.total}
        </span>
      </div>
    </Link>
  );
}

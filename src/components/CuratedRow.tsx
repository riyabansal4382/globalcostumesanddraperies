import { useState } from "react";

import { CostumeDetailDialog } from "@/components/CostumeDetailDialog";
import type { CuratedRow as CuratedRowData } from "@/lib/curated";
import type { Costume } from "@/lib/costumes";

export function CuratedRow({ row }: { row: CuratedRowData }) {
  const [active, setActive] = useState<Costume | null>(null);

  return (
    <section className="mt-8">
      <h3 className="font-display text-xl leading-tight">{row.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{row.blurb}</p>

      <div className="-mx-5 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3">
        {row.items.map((costume) => (
          <button
            key={costume.id}
            type="button"
            onClick={() => setActive(costume)}
            className="group w-40 shrink-0 snap-start text-left sm:w-48"
          >
            <div className="aspect-4/5 overflow-hidden rounded-2xl rounded-t-[3rem] bg-muted ring-1 ring-highlight/40">
              <img
                src={costume.image_url}
                alt={`${costume.name} costume`}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-snug">{costume.name}</p>
          </button>
        ))}
      </div>

      {active && (
        <CostumeDetailDialog
          costume={active}
          open
          onOpenChange={(open) => !open && setActive(null)}
        />
      )}
    </section>
  );
}

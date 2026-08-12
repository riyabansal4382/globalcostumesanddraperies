import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { swatchStyle, type Costume } from "@/lib/costumes";
import { pathSegments } from "@/lib/folders";

export function CostumeCard({ costume }: { costume: Costume }) {
  const { add, has, setOpen } = useCart();
  const inCart = has(costume.id);
  const segments = pathSegments(costume.source_path);
  const collection = segments.at(-1) ?? costume.category;


  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-stage transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        {costume.image_url ? (
          <img
            src={costume.image_url}
            alt={`${costume.name} costume`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            Photo coming soon
          </div>
        )}
        {!costume.is_available && (
          <span className="absolute left-3 top-3 rounded-full bg-highlight px-2.5 py-1 text-xs font-medium text-highlight-foreground">
            Out on hire
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-snug">{costume.name}</h3>
          {costume.rental_price != null && (
            <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">
              £{Number(costume.rental_price).toFixed(0)}
            </span>
          )}
        </div>

        {costume.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{costume.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{collection}</Badge>
          {costume.sizes.map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>

        {costume.colors.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {costume.colors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
              >
                <span
                  className="size-3 rounded-full border border-border"
                  style={swatchStyle(c)}
                />
                {c}
              </span>
            ))}
          </div>
        )}


        <Button
          variant={inCart ? "secondary" : "default"}
          size="sm"
          className="w-full"
          disabled={!costume.is_available}
          onClick={() => {
            if (inCart) {
              setOpen(true);
              return;
            }
            add(costume);
            toast.success(`${costume.name} added to your basket`);
          }}
        >
          {inCart ? (
            <>
              <Check className="size-4" /> In basket
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" /> Add to basket
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { swatchStyle, type Costume } from "@/lib/costumes";

export function CostumeCard({ costume }: { costume: Costume }) {
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
          <Badge variant="secondary">{costume.category}</Badge>
          {costume.sizes.map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>

        {costume.colors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {costume.colors.map((c) => (
              <span
                key={c}
                title={c}
                className="size-4 rounded-full border border-border"
                style={swatchStyle(c)}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

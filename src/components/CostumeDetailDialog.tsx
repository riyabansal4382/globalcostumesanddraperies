import { Check, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { swatchStyle, type Costume } from "@/lib/costumes";
import { pathSegments } from "@/lib/folders";
import { absoluteImageUrl, whatsappLink } from "@/lib/whatsapp";

export function CostumeDetailDialog({
  costume,
  open,
  onOpenChange,
}: {
  costume: Costume;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { add, has, setOpen } = useCart();
  const inCart = has(costume.id);
  const segments = pathSegments(costume.source_path);
  const collection = segments.join(" / ") || costume.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-2xl">{costume.name}</DialogTitle>
          <DialogDescription>{collection}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-2xl bg-muted ring-1 ring-highlight/40">
            {costume.image_url ? (
              <img
                src={costume.image_url}
                alt={`${costume.name} costume, full view`}
                className="max-h-[70vh] w-full object-contain"
              />
            ) : (
              <div className="flex aspect-4/5 items-center justify-center text-sm text-muted-foreground">
                Photo coming soon
              </div>
            )}
          </div>

          <div className="space-y-4">
            {costume.description && (
              <p className="text-sm text-muted-foreground">{costume.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{segments.at(-1) ?? costume.category}</Badge>
              {costume.sizes.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
              {!costume.is_available && <Badge>Out on hire</Badge>}
            </div>

            {costume.colors.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Colours
                </p>
                <div className="flex flex-wrap gap-1.5">
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
              </div>
            )}

            {costume.rental_price != null && (
              <p className="text-sm font-semibold">
                £{Number(costume.rental_price).toFixed(0)}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <Button
                variant={inCart ? "secondary" : "default"}
                className="w-full"
                disabled={!costume.is_available}
                onClick={() => {
                  if (inCart) {
                    onOpenChange(false);
                    setOpen(true);
                    return;
                  }
                  add(costume);
                  toast.success(`${costume.name} added to your basket`);
                }}
              >
                {inCart ? (
                  <>
                    <Check className="size-4" /> In basket — view
                  </>
                ) : (
                  <>
                    <ShoppingBag className="size-4" /> Add to basket
                  </>
                )}
              </Button>

              <Button asChild variant="outline" className="w-full gap-2">
                <a
                  href={whatsappLink(
                    `Hi Global Costumes & Draperies! I'd like to ask about "${costume.name}" (${collection}). ${absoluteImageUrl(costume.image_url)}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" /> Ask about this on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";

export function CartDrawer() {
  const { items, count, total, setQty, remove, clear, open, setOpen } =
    useCart();

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        aria-label={`Open enquiry basket, ${count} item${count === 1 ? "" : "s"}`}
        className="fixed bottom-6 right-6 z-50 h-14 rounded-full px-5 shadow-lift"
      >
        <ShoppingBag className="size-5" />
        <span className="hidden sm:inline">Basket</span>
        {count > 0 && (
          <span className="ml-1 inline-flex min-w-6 items-center justify-center rounded-full bg-highlight px-1.5 py-0.5 text-xs font-semibold text-highlight-foreground">
            {count}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your hire basket</SheetTitle>
            <SheetDescription>
              {count > 0
                ? `${count} item${count === 1 ? "" : "s"} ready to enquire about.`
                : "Add costumes as you browse and send us the list."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {items.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Your basket is empty.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <button
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    {item.size && (
                      <p className="text-xs text-muted-foreground">
                        Size {item.size}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => setQty(item.id, item.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.qty}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => setQty(item.id, item.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      {item.rental_price != null && (
                        <span className="text-sm font-semibold text-muted-foreground">
                          £{(Number(item.rental_price) * item.qty).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <SheetFooter className="gap-3">
              {total > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated hire</span>
                  <span className="font-display text-lg">£{total.toFixed(0)}</span>
                </div>
              )}
              <Button className="w-full">Request these costumes</Button>
              <Button variant="ghost" className="w-full" onClick={clear}>
                <Trash2 className="size-4" /> Empty basket
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

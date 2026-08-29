import { useState } from "react";
import { CalendarIcon, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { absoluteImageUrl, openWhatsApp } from "@/lib/whatsapp";

type Mode = "book" | "enquire";

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { items, setQty, setSize, total } = useCart();
  const [mode, setMode] = useState<Mode>("book");
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);

  const needsDate = mode === "book";
  const missingSize = mode === "book" && items.some((i) => !i.size?.trim());

  function send() {
    if (missingSize) {
      toast.error("Please add a size for every costume.");
      return;
    }
    if (needsDate && !date) {
      toast.error("Please pick the date you need the costumes.");
      return;
    }

    const lines: string[] = [];
    lines.push(
      mode === "book"
        ? "Hi Global Costumes & Draperies! I'd like to hire these costumes:"
        : "Hi Global Costumes & Draperies! I'd like to enquire about these costumes:",
    );
    lines.push("");
    items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}`);
      lines.push(`   Size: ${item.size ?? "-"} | Qty: ${item.qty}`);
      const img = absoluteImageUrl(item.image_url);
      if (img) lines.push(`   Photo: ${img}`);
      lines.push("");
    });
    if (date) lines.push(`Date required: ${date}`);
    if (total > 0) lines.push(`Estimated hire: £${total.toFixed(0)}`);
    if (name.trim()) lines.push(`Name: ${name.trim()}`);
    if (notes.trim()) lines.push(`Notes: ${notes.trim()}`);
    if (mode === "enquire") lines.push("(Just enquiring for now — no booking yet.)");

    const url = openWhatsApp(lines.join("\n"));
    setFallbackLink(url);
    toast.success("Opening WhatsApp…", {
      description: "If nothing opened, tap the WhatsApp link below.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send your list on WhatsApp</DialogTitle>
          <DialogDescription>
            Confirm sizes and quantities, then we'll open WhatsApp with your costume
            photos attached as links.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "book" ? "default" : "outline"}
            onClick={() => setMode("book")}
          >
            Request to hire
          </Button>
          <Button
            type="button"
            variant={mode === "enquire" ? "default" : "outline"}
            onClick={() => setMode("enquire")}
          >
            Just enquiring
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label
                      htmlFor={`size-${item.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Size {mode === "book" ? "required" : "(optional)"}
                    </Label>
                    <Input
                      id={`size-${item.id}`}
                      value={item.size ?? ""}
                      placeholder="e.g. 30"
                      onChange={(e) => setSize(item.id, e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Label
                      htmlFor={`qty-${item.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Quantity
                    </Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) =>
                        setQty(item.id, Math.max(1, Number(e.target.value) || 1))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="hire-name">Your name</Label>
            <Input
              id="hire-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="hire-date">
              Date required{needsDate ? " (dd/mm/yyyy)" : " (optional)"}
            </Label>
            <Input
              id="hire-date"
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/yyyy"
              value={date}
              onChange={(e) => setDate(formatDateInput(e.target.value))}
              required={needsDate}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="hire-notes">Notes</Label>
          <Textarea
            id="hire-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Event, alterations, collection or delivery…"
            rows={3}
          />
        </div>

        {fallbackLink && (
          <a
            href={fallbackLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-primary/40 bg-primary/5 p-3 text-center text-sm font-medium text-primary underline underline-offset-4"
          >
            WhatsApp didn't open? Tap here to open the chat
          </a>
        )}

        <DialogFooter>
          <Button onClick={send} className="w-full">
            <MessageCircle className="size-4" />
            {mode === "book" ? "Send hire request" : "Send enquiry"} on WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

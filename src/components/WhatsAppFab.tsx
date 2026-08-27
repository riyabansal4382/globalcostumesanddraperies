import { MessageCircle } from "lucide-react";

import { whatsappLink } from "@/lib/whatsapp";

const DEFAULT_MESSAGE =
  "Hi Global Costumes & Draperies! I'm browsing your website and I'd like to enquire about a costume.";

/**
 * Floating WhatsApp enquiry button, prominent on mobile where most
 * visitors browse. Opens a top-level tab so it works inside previews.
 */
export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink(DEFAULT_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enquire on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-highlight/50 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="size-5" />
      <span>Enquire on WhatsApp</span>
    </a>
  );
}

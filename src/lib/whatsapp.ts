// Business WhatsApp number in international format, digits only (no + or spaces).
// Example: UK 07700 900123 -> "447700900123"
export const WHATSAPP_NUMBER = "918308504362";

// WhatsApp truncates very long URLs, so keep the message comfortably short.
const MAX_MESSAGE_LENGTH = 1500;

export function absoluteImageUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
}

export function trimMessage(message: string) {
  if (message.length <= MAX_MESSAGE_LENGTH) return message;
  return `${message.slice(0, MAX_MESSAGE_LENGTH - 40).trimEnd()}\n… (list continues)`;
}

export function whatsappLink(message: string) {
  // wa.me redirects to api.whatsapp.com, which refuses to load inside iframes,
  // so always open this URL in a real top-level tab.
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(trimMessage(message))}`;
}

/**
 * Opens WhatsApp in a genuine new browser tab. Using a synthetic anchor click
 * (instead of window.open) keeps it working inside embedded previews where
 * popups are blocked and framed navigation is refused.
 * Returns the URL so callers can offer a manual fallback link.
 */
export function openWhatsApp(message: string) {
  const url = whatsappLink(message);
  if (typeof document === "undefined") return url;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  return url;
}

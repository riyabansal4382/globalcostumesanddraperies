// Business WhatsApp number in international format, digits only (no + or spaces).
// Example: UK 07700 900123 -> "447700900123"
export const WHATSAPP_NUMBER = "447700900123";

export function absoluteImageUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
}

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

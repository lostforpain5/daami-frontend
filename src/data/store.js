// ─── Daami Clothing — central store config ──────────────────────────────────
// Change these values in ONE place and they update across the whole site.

// Your WhatsApp business number in INTERNATIONAL format, digits only.
// Nepal example: 977 + 10-digit number → '9779800000000'
// Format: country code + number, digits only. Nepal = 977.
export const WHATSAPP_NUMBER = '9779766598459';

// Builds a "click to chat" WhatsApp link with a pre-filled message.
export function whatsappLink(message = '') {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// Pre-filled WhatsApp message for ordering a specific product.
export function whatsappOrderMessage({ name, price, size, color, quantity = 1, url }) {
  const lines = [
    `Hello Daami Clothing! 👋`,
    `I want to order this item:`,
    ``,
    `🛍️ *${name}*`,
    price != null ? `💰 Price: Rs. ${price}` : null,
    size ? `📏 Size: ${size}` : null,
    color ? `🎨 Color: ${color}` : null,
    `🔢 Quantity: ${quantity}`,
    url ? `\n🔗 ${url}` : null,
    ``,
    `Please confirm availability. Thank you!`,
  ].filter(Boolean);
  return lines.join('\n');
}

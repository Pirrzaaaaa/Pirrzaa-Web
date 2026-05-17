// Ryuuzaa MD — Caption Style Builder
//
// Bikin caption yang konsisten di semua plugin dengan format:
//
//   {ICON} *Title*
//
//   ☁︎ *NAMA SECTION* ☁︎
//   → Label: Value
//   → Label: Value
//
//   ☁︎ *NAMA SECTION* ☁︎
//   → ...
//
//   *FOOTER*
//
// Contoh pemakaian di plugin:
//
//   import { caption } from "../../lib/ryuuzaa-style.js";
//
//   await reply(caption({
//     icon: "⚡",
//     title: "System Performance Monitor",
//     sections: [
//       { name: "INFORMASI BOT", items: [["Nama Bot", "Ryuuzaa MD"], ["Status", "Online"]] },
//     ],
//     notes: ["Pakai dengan bijak."],
//   }));

import { config } from "../config.js";

const SECTION_MARK = "☁︎";
const ITEM_ARROW = "→";

/**
 * Konversi teks ASCII ke "small caps" unicode.
 * Cocok untuk footer.
 */
const SMALL_CAPS = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
  i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
  q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
  y: "ʏ", z: "ᴢ",
};export function toSmallCaps(text = "") {
  return String(text)
    .split("")
    .map((ch) => SMALL_CAPS[ch.toLowerCase()] || ch)
    .join("");
}

/**
 * Default footer signature.
 * Ambil dari config.captionFooter, atau auto-generate dari botName + ownerName.
 */
export function defaultFooter() {
  if (config.captionFooter) return config.captionFooter;
  const bot = toSmallCaps(config.botName || "Bot");
  const owner = toSmallCaps(config.ownerName || "Owner");
  return `*${bot} | ᴏᴡɴᴇʀ: ${owner}*`;
}

/**
 * Render satu section dalam gaya:
 *
 *   ☁︎ *NAMA* ☁︎
 *   → Label: Value
 *
 * @param {{name: string, items: Array<[string, any]>}} section
 */
function renderSection({ name, items }) {
  const out = [`${SECTION_MARK} *${String(name).toUpperCase()}* ${SECTION_MARK}`];
  for (const item of items || []) {
    if (!item) continue;
    if (Array.isArray(item)) {
      const [label, value] = item;
      if (value === undefined || value === null || value === "") continue;
      out.push(`${ITEM_ARROW} ${label}: ${value}`);
    } else {
      out.push(`${ITEM_ARROW} ${item}`);
    }
  }
  return out.join("\n");
}

/**
 * Builder caption utama.
 *
 * @param {object} opts
 * @param {string} [opts.icon]                    emoji di depan judul
 * @param {string} opts.title                     judul utama
 * @param {Array<{name: string, items: Array}>} opts.sections
 * @param {string[]} [opts.notes]                 list catatan kaki (di-render jadi section "CATATAN")
 * @param {string|null} [opts.footer]             override footer; null = pakai defaultFooter()
 * @param {string} [opts.subtitle]                baris di bawah title (opsional)
 */
export function caption({
  icon = "⚡",
  title,
  subtitle = "",
  sections = [],
  notes = [],
  footer = undefined,
}) {
  const blocks = [];
  blocks.push(`${icon} *${title}*`);
  if (subtitle) blocks.push(`_${subtitle}_`);
  blocks.push(""); // baris kosong setelah header

  for (const sec of sections) {
    if (!sec || !sec.items?.length) continue;
    blocks.push(renderSection(sec));
    blocks.push("");
  }

  if (notes && notes.length) {
    blocks.push(renderSection({ name: "CATATAN", items: notes }));
    blocks.push("");
  }

  const ft = footer === undefined ? defaultFooter() : footer;
  if (ft) blocks.push(ft);

  return blocks.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

/**
 * Helper: status emoji dari response time (ms).
 */
export function pingEmoji(ms) {
  if (ms == null) return "⚪";
  if (ms < 100) return "🟢";
  if (ms < 500) return "🟡";
  return "🔴";
}

/**
 * Helper: kualitas dari response time.
 */
export function qualityLabel(ms) {
  if (ms == null) return "UNKNOWN";
  if (ms < 100) return "FAST";
  if (ms < 300) return "NORMAL";
  if (ms < 800) return "SLOW";
  return "VERY SLOW";
}

/**
 * Healthbar: dari persentase 0-100, balik label.
 */
export function healthLabel(percent) {
  if (percent >= 80) return `${Math.round(percent)}% EXCELLENT`;
  if (percent >= 60) return `${Math.round(percent)}% GOOD`;
  if (percent >= 40) return `${Math.round(percent)}% FAIR`;
  if (percent >= 20) return `${Math.round(percent)}% POOR`;
  return `${Math.round(percent)}% CRITICAL`;
}

// =====================================================================
// Newsletter / Channel context info — bikin pesan kelihatan seperti
// forward dari channel resmi (verified-look). Tidak butuh real channel,
// cukup id dummy yang konsisten.
// =====================================================================

/**
 * Bikin contextInfo untuk gaya newsletter (forwarded + verified look).
 * Aman walau jid newsletter dummy: pesan tetap terkirim sebagai teks biasa.
 */
export function newsletterContext({
  title,
  newsletterJid,
} = {}) {
  const cfg = config.newsletter || {};
  return {
    forwardingScore: cfg.forwardingScore ?? 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid:
        newsletterJid || cfg.jid || "120363025246125888@newsletter",
      newsletterName:
        title || cfg.name || config.botFancyName || config.botName,
      serverMessageId: 100,
    },
    externalAdReply: cfg.externalAdReply || undefined,
  };
}

/**
 * Bikin tombol "Kembali ke Menu" sebagai interactive native flow button.
 * Compatible dengan Baileys terbaru (interactiveMessage).
 */
export function backToMenuButton() {
  const p = (config.prefix && config.prefix[0]) || ".";
  return {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "📜 Kembali ke Menu",
      id: `${p}menu`,
    }),
  };
}

/**
 * Bungkus content (string atau {text}) jadi "interactive message"
 * dengan tombol Kembali ke Menu + gaya newsletter.
 *
 * Fallback: kalau Baileys versi yang dipakai tidak support interactive,
 * kita kirim sebagai pesan teks dengan contextInfo newsletter saja.
 */
export function styledReplyOptions(content) {
  const cfg = config.replyStyle || {};
  const text =
    typeof content === "string"
      ? content
      : content?.text || content?.caption || "";

  const useInteractive = cfg.useInteractive !== false; // default ON
  const useNewsletter = cfg.useNewsletter !== false; // default ON

  const ctx = useNewsletter ? newsletterContext() : undefined;

  // Mode 1: interactive message (button "Kembali ke Menu")
  if (useInteractive) {
    return {
      text,
      contextInfo: ctx,
      // Baileys @blckrose mendukung opsi shortcut buttons:
      buttons: [
        {
          buttonId: `${(config.prefix && config.prefix[0]) || "."}menu`,
          buttonText: { displayText: "📜 Kembali ke Menu" },
          type: 1,
        },
      ],
      headerType: 1,
      footer: cfg.footer || defaultFooter(),
      ...(typeof content === "object" && !Array.isArray(content)
        ? content
        : {}),
    };
  }

  // Mode 2: hanya newsletter context (no button)
  return {
    text,
    contextInfo: ctx,
    footer: cfg.footer || defaultFooter(),
    ...(typeof content === "object" && !Array.isArray(content) ? content : {}),
  };
}

/**
 * Untuk hasil utama plugin: newsletter context (verified look) tanpa tombol.
 * Caption pakai `caption()` builder, hasilnya dilewatkan ke sini sebagai text.
 */
export function styledSendOptions(content) {
  const cfg = config.sendStyle || {};
  const useNewsletter = cfg.useNewsletter !== false; // default ON
  const ctx = useNewsletter ? newsletterContext() : undefined;

  if (typeof content === "string") {
    return { text: content, contextInfo: ctx };
  }
  return {
    ...content,
    contextInfo: { ...(content.contextInfo || {}), ...(ctx || {}) },
  };
}

export default caption;

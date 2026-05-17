// Ryuuzaa MD — helper utilitas

import { config } from "../config.js";

/**
 * Ambil teks dari berbagai jenis pesan
 */
export function getMessageText(msg) {
  const m = msg.message;
  if (!m) return "";
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedButtonId ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.templateButtonReplyMessage?.selectedId ||
    ""
  );
}

/**
 * Parse pesan jadi { prefix, command, args, body, isCmd }
 */
export function parseCommand(text) {
  const body = (text || "").trim();
  const prefixes = config.prefix;
  const usedPrefix = prefixes.find((p) => body.startsWith(p));
  if (!usedPrefix) {
    return { isCmd: false, prefix: "", command: "", args: [], body, text: "" };
  }
  const noPrefix = body.slice(usedPrefix.length).trim();
  const [cmd, ...args] = noPrefix.split(/\s+/);
  return {
    isCmd: true,
    prefix: usedPrefix,
    command: (cmd || "").toLowerCase(),
    args,
    body,
    text: args.join(" "),
  };
}

/**
 * Cek apakah jid termasuk owner
 */
export function isOwner(jid) {
  if (!jid) return false;
  const number = jid.split("@")[0].split(":")[0];
  return config.owner.includes(number);
}

/**
 * Format byte jadi human readable
 */
export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format uptime detik jadi string
 */
export function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

/**
 * Sanitize phone number: hapus +, spasi, dash. Pastikan digit saja.
 */
export function sanitizePhoneNumber(num) {
  return String(num || "").replace(/[^0-9]/g, "");
}

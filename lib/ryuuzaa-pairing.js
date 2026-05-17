// Ryuuzaa MD — pairing code helper
//
// Membungkus pemanggilan sock.requestPairingCode() dengan:
// - prompt nomor di terminal jika belum ada di config
// - format output "RYUU-ZAAA" supaya enak dibaca

import readline from "readline";
import { config } from "../config.js";
import { sanitizePhoneNumber } from "./ryuuzaa-helper.js";

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Minta pairing code untuk linked device.
 *
 * @param {import('@blckrose/baileys').WASocket} sock
 * @returns {Promise<string|null>} kode pairing atau null kalau gagal
 */
export async function requestPairingCode(sock) {
  // Sock harus belum register
  if (sock.authState?.creds?.registered) return null;

  let phone = sanitizePhoneNumber(config.pairingNumber);
  if (!phone) {
    console.log(
      "[PAIR] Nomor pairing belum diset di config.js (config.pairingNumber).",
    );
    phone = sanitizePhoneNumber(
      await ask("[PAIR] Masukkan nomor (contoh 6281234567890): "),
    );
  }
  if (!phone) {
    console.error("[PAIR] Nomor tidak valid.");
    return null;
  }

  // Tunggu sebentar supaya socket siap
  await new Promise((r) => setTimeout(r, 3000));

  try {
    // Custom pairing code dari config (8 char alfanumerik)
    const customCode = (config.pairingCode || "").toString().toUpperCase();
    const code = customCode
      ? await sock.requestPairingCode(phone, customCode)
      : await sock.requestPairingCode(phone);

    const pretty = String(code).match(/.{1,4}/g)?.join("-") || code;
    console.log("\n┌──────────────────────────────────────┐");
    console.log("│  Ryuuzaa MD — Pairing Code            ");
    console.log(`│  Nomor : ${phone}`);
    console.log(`│  Kode  : ${pretty}`);
    console.log("└──────────────────────────────────────┘");
    console.log(
      "Buka WhatsApp -> Linked Devices -> Link a Device -> Link with phone number, lalu masukkan kode di atas.\n",
    );
    return code;
  } catch (err) {
    console.error("[PAIR] Gagal minta pairing code:", err?.message || err);
    return null;
  }
}

export default requestPairingCode;

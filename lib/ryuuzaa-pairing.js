// Ryuuzaa MD — pairing code helper
//
// CARA KERJA @blckrose/baileys:
//   sock.requestPairingCode(phone, customCode)
//   - customCode HARUS tepat 8 karakter (akan di-uppercase otomatis)
//   - Karakter yang aman: A-Z dan 0-9 (avoid O/0 confusion)
//   - Kalau customCode tidak dikasih → library pakai default "BLCKRO53"
//
// Dokumentasi pemakaian (untuk owner):
//   1. Set config.pairingCode = "RYUUZAAA"  (8 karakter)
//   2. Bot akan request pairing dengan code itu
//   3. Di HP: Linked Devices → Link a Device → "Link with phone number"
//   4. Masukkan EXACTLY: RYUUZAAA  (tanpa spasi, tanpa dash, tanpa lowercase)

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
 * Validasi custom pairing code.
 * Harus tepat 8 karakter alphanumeric.
 * Library @blckrose/baileys melempar error kalau length !== 8.
 */
function validateCustomCode(code) {
  if (!code) return null;
  const c = String(code).toUpperCase().trim();
  if (c.length !== 8) return null;
  if (!/^[A-Z0-9]{8}$/.test(c)) return null;
  return c;
}

function printBox(phone, code) {
  const pretty = code.match(/.{1,4}/g)?.join("-") || code;
  console.log("");
  console.log("╔════════════════════════════════════════════╗");
  console.log("║                                            ║");
  console.log("║       Ryuuzaa MD — PAIRING CODE            ║");
  console.log("║                                            ║");
  console.log("╠════════════════════════════════════════════╣");
  console.log("║                                            ║");
  console.log(`║   Nomor  : ${phone}`.padEnd(45) + "║");
  console.log(`║   Kode   : ${pretty}`.padEnd(45) + "║");
  console.log("║                                            ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log("");
  console.log("Cara pakai (HP):");
  console.log("  1. Buka WhatsApp");
  console.log("  2. Settings → Linked Devices → Link a Device");
  console.log("  3. Klik 'Link with phone number instead'");
  console.log(`  4. Ketik HURUF/ANGKA: ${code}`);
  console.log("     (TANPA dash, TANPA spasi, KAPITAL)");
  console.log("  5. Kode kadaluarsa ±5 menit");
  console.log("");
  console.log("Kalau gagal:");
  console.log("  • Hapus folder ./session lalu start ulang bot");
  console.log("  • Pastikan nomor di config benar (negara + nomor, tanpa +)");
  console.log("");
}

/**
 * Minta pairing code untuk linked device.
 *
 * @param {import('@blckrose/baileys').WASocket} sock
 * @returns {Promise<string|null>}
 */
export async function requestPairingCode(sock) {
  if (sock.authState?.creds?.registered) return null;

  // ===== 1. Nomor =====
  let phone = sanitizePhoneNumber(config.pairingNumber);
  if (!phone) {
    console.log("\n[PAIR] Nomor pairing belum diset di config.js");
    phone = sanitizePhoneNumber(
      await ask("[PAIR] Masukkan nomor (contoh 6289517185039, tanpa +): "),
    );
  }
  if (!phone || phone.length < 10 || phone.length > 15) {
    console.error(
      `[PAIR] Nomor tidak valid: '${phone}'. Harus 10-15 digit, tanpa + atau spasi.`,
    );
    return null;
  }

  // ===== 2. Custom code =====
  const customCode = validateCustomCode(config.pairingCode);
  if (config.pairingCode && !customCode) {
    console.warn(
      `[PAIR] config.pairingCode '${config.pairingCode}' tidak valid (harus tepat 8 char A-Z/0-9).`,
    );
    console.warn("[PAIR] Library akan pakai default 'BLCKRO53'.");
  }

  // ===== 3. Tunggu socket siap =====
  console.log("[PAIR] Menunggu socket siap...");
  await new Promise((r) => setTimeout(r, 4000));

  // ===== 4. Request pairing code =====
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const code = customCode
        ? await sock.requestPairingCode(phone, customCode)
        : await sock.requestPairingCode(phone);

      if (!code) throw new Error("Server WA tidak mengembalikan kode");

      // code dari library sudah uppercase
      const finalCode = String(code).toUpperCase();
      printBox(phone, finalCode);
      return finalCode;
    } catch (err) {
      const msg = err?.message || String(err);
      console.error(
        `[PAIR] Gagal request (percobaan ${attempt}/3): ${msg}`,
      );
      if (attempt < 3) {
        console.log("[PAIR] Retry dalam 3 detik...");
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  console.error(
    "\n[PAIR] Gagal mendapat pairing code setelah 3x percobaan.",
  );
  console.error("Solusi:");
  console.error("  1. Cek koneksi internet server");
  console.error("  2. Pastikan nomor benar (negara + nomor, tanpa +)");
  console.error("  3. Hapus folder ./session lalu start ulang bot");
  console.error("  4. Coba ganti config.pairingCode = null (pakai default)");
  return null;
}

export default requestPairingCode;

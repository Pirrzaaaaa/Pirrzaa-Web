// Ryuuzaa MD — pairing code helper
//
// - prompt nomor di terminal jika belum ada di config
// - validasi custom code: HARUS 8 char alphanumeric (A-Z, 0-9), kalau invalid pakai random
// - retry otomatis jika request gagal
// - tampilan kode jelas + petunjuk

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
 * Harus 8 karakter, alphanumeric uppercase (A-Z, 0-9).
 * WhatsApp tolak kalau ada huruf O / I / 0 / 1? Tidak, tapi banyak fork
 * Baileys reject apapun yang bukan ^[A-Z0-9]{8}$.
 */
function validateCustomCode(code) {
  if (!code) return null;
  const c = String(code).toUpperCase().trim();
  if (!/^[A-Z0-9]{8}$/.test(c)) return null;
  return c;
}

function printBox(phone, code) {
  const pretty = code.match(/.{1,4}/g)?.join("-") || code;
  const lines = [
    "",
    "┌────────────────────────────────────────────┐",
    "│                                            │",
    "│    Ryuuzaa MD — PAIRING CODE              ",
    "│                                            │",
    `│    Nomor : ${phone}`.padEnd(45) + "│",
    `│    Kode  : ${pretty}`.padEnd(45) + "│",
    "│                                            │",
    "└────────────────────────────────────────────┘",
    "",
    "Cara pakai:",
    "  1. Buka WhatsApp di HP",
    "  2. Settings → Linked Devices → Link a Device",
    "  3. Pilih *Link with phone number instead*",
    "  4. Masukkan kode di atas (TANPA tanda dash)",
    "  5. Kode kadaluarsa dalam ~5 menit",
    "",
    "Kalau kode salah/expired:",
    "  - Hapus folder ./session lalu start ulang bot",
    "",
  ];
  console.log(lines.join("\n"));
}

/**
 * Minta pairing code untuk linked device.
 *
 * @param {import('@blckrose/baileys').WASocket} sock
 * @returns {Promise<string|null>}
 */
export async function requestPairingCode(sock) {
  if (sock.authState?.creds?.registered) return null;

  let phone = sanitizePhoneNumber(config.pairingNumber);
  if (!phone) {
    console.log("\n[PAIR] Nomor pairing belum diset di config.js");
    phone = sanitizePhoneNumber(
      await ask("[PAIR] Masukkan nomor (contoh 6289517185039, tanpa +): "),
    );
  }

  // Validasi nomor: minimal 10 digit, max 15
  if (!phone || phone.length < 10 || phone.length > 15) {
    console.error(
      `[PAIR] Nomor tidak valid: '${phone}'. Harus 10-15 digit, tanpa + atau spasi.`,
    );
    return null;
  }

  // Validasi custom code
  let customCode = validateCustomCode(config.pairingCode);
  if (config.pairingCode && !customCode) {
    console.warn(
      `[PAIR] Custom pairingCode '${config.pairingCode}' tidak valid (harus 8 char A-Z/0-9). Pakai random code dari WhatsApp.`,
    );
  }

  // Tunggu socket siap. Beberapa kasus 3 detik tidak cukup.
  console.log("[PAIR] Menunggu socket siap...");
  await new Promise((r) => setTimeout(r, 4000));

  // Retry up to 3x
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const code = customCode
        ? await sock.requestPairingCode(phone, customCode)
        : await sock.requestPairingCode(phone);

      if (!code) throw new Error("Server WA tidak mengembalikan kode");
      const finalCode = String(code).toUpperCase();
      printBox(phone, finalCode);
      return finalCode;
    } catch (err) {
      const msg = err?.message || String(err);
      console.error(
        `[PAIR] Gagal request (percobaan ${attempt}/3): ${msg}`,
      );

      // Kalau custom code yang masalah, coba lagi tanpa custom code
      if (
        attempt === 1 &&
        customCode &&
        /pairing|code|invalid|format/i.test(msg)
      ) {
        console.warn(
          "[PAIR] Custom code mungkin ditolak, retry tanpa custom code...",
        );
        customCode = null;
      }

      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  console.error(
    "[PAIR] Gagal mendapat pairing code setelah 3x percobaan. Cek koneksi internet & nomor.",
  );
  return null;
}

export default requestPairingCode;

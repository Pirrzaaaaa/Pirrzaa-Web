// Ryuuzaa MD — Entry point
// - WhatsApp socket via @blckrose/baileys (ESM)
// - Pairing code "RYUUZAAA" sebagai metode login default
// - Logic pesan dipindah ke ./handler.js
// - Database SQLite via lib/ryuuzaa-database.js (singleton)
// - Auto-restart: uncaught error TIDAK crash permanen, re-init socket otomatis
// - Cocok dijalankan di panel (on 24/7)

import {
  default as makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
} from "@blckrose/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";

import { config } from "./config.js";
import PluginManager from "./lib/ryuuzaa-plugins-loader.js";
import { requestPairingCode } from "./lib/ryuuzaa-pairing.js";
import { logger } from "./lib/ryuuzaa-logger.js";
import { db } from "./lib/ryuuzaa-database.js";
import { createMessageHandler } from "./handler.js";

// Logger Baileys (silent supaya tidak ramai)
const baileysLogger = pino({ level: "silent" });

// Singleton plugin manager
const plugins = new PluginManager();

// ===== Auto-restart config =====
const MAX_RETRIES = config.autoRestart?.maxRetries ?? 10;
const RETRY_DELAY_BASE = config.autoRestart?.retryDelayMs ?? 5000;
let retryCount = 0;
let lastConnectedAt = 0;

function getRetryDelay() {
  // exponential backoff (max 60 detik)
  return Math.min(RETRY_DELAY_BASE * Math.pow(1.5, retryCount), 60000);
}

async function startBot() {
  try {
    // 1. Init database
    logger.info(`Database siap di ${config.databasePath}`);

    // 2. Load plugins (hanya saat pertama kali / fresh start)
    if (plugins.plugins.size === 0) {
      await plugins.loadAll();
      if (config.hotReload) plugins.watch();
    }

    // 3. Auth & socket
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(
      `${config.botName} pakai WA versi ${version.join(".")} (latest=${isLatest})`,
    );

    const sock = makeWASocket({
      version,
      logger: baileysLogger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
      },
      browser: [config.botName, "Chrome", "1.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: !!config.autoOnline,
    });

    sock.ev.on("creds.update", saveCreds);

    // 4. Pairing code request (jika belum register)
    if (config.usePairingCode && !sock.authState.creds.registered) {
      await requestPairingCode(sock);
    }

    // 5. Connection update
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !config.usePairingCode) {
        logger.info("Scan QR berikut dengan WhatsApp di HP:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        logger.success(`Terhubung sebagai ${sock.user?.id}`);
        retryCount = 0; // reset retry karena sudah berhasil konek
        lastConnectedAt = Date.now();
      }

      if (connection === "close") {
        const code =
          new Boom(lastDisconnect?.error)?.output?.statusCode ||
          lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        logger.warn(
          `Koneksi tertutup (code=${code}). Reconnect=${shouldReconnect}`,
        );
        if (shouldReconnect) {
          scheduleRestart("connection closed");
        } else {
          logger.error(
            "Logged out. Hapus folder session lalu start ulang.",
          );
        }
      }
    });

    // 6. Pasang message handler
    sock.ev.on("messages.upsert", createMessageHandler({ sock, plugins }));

    return sock;
  } catch (err) {
    logger.error("startBot error:", err?.message || err);
    scheduleRestart("startBot error");
  }
}

function scheduleRestart(reason) {
  retryCount++;
  if (retryCount > MAX_RETRIES) {
    logger.error(
      `Sudah ${MAX_RETRIES}x retry gagal (${reason}). Bot berhenti. Panel akan auto-restart.`,
    );
    // Keluar dengan code 1 agar panel (PM2/systemd/pterodactyl) restart prosesnya
    process.exit(1);
  }
  const delay = getRetryDelay();
  logger.warn(
    `[AUTO-RESTART] ${reason} — retry ${retryCount}/${MAX_RETRIES} dalam ${Math.round(delay / 1000)}s...`,
  );
  setTimeout(() => startBot(), delay);
}

// ===== Global error handlers (anti-crash) =====
process.on("uncaughtException", (err) => {
  logger.error("[UNCAUGHT]", err?.message || err);
  if (err?.stack) logger.error(err.stack.split("\n").slice(0, 5).join("\n"));
  // JANGAN exit — biarkan event loop lanjut, tapi catat supaya kita tau
});

process.on("unhandledRejection", (reason) => {
  logger.error("[UNHANDLED REJECTION]", reason?.message || reason);
  if (reason?.stack) logger.error(reason.stack.split("\n").slice(0, 5).join("\n"));
  // JANGAN exit — biarkan event loop lanjut
});

// ===== Graceful shutdown =====
const shutdown = (signal) => {
  logger.warn(`Diterima ${signal}, menutup database...`);
  try {
    plugins.stopWatch();
    db.close();
  } catch {}
  process.exit(0);
};
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

// ===== Start =====
logger.info(`${config.botName} starting...`);
startBot();

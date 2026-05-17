// Ryuuzaa MD — Config
// Semua setting bisa diubah di sini tanpa edit source code lain.

export const config = {
  // ===== Identitas =====
  botName: "Ryuuzaa MD",
  ownerName: "Ryuuzaa",
  // Nomor owner (tanpa +)
  owner: ["6289517185039"],

  // ===== Prefix =====
  prefix: [".", "!", "/"],

  // ===== Pairing Code =====
  usePairingCode: true,
  pairingNumber: "", // diminta lewat prompt jika kosong
  // Custom 8-char pairing code (A-Z atau 0-9 saja, tepat 8 karakter).
  // Kalau null/invalid → library pakai default "BLCKRO53".
  // Yang harus diketik di HP = pairingCode di config ini.
  pairingCode: "RYUUZAAA",

  // ===== Sesi & Database =====
  sessionDir: "./session",
  databasePath: "./database/ryuuzaa.db",

  // ===== Logging =====
  logLevel: "info", // 'debug' | 'info' | 'warn' | 'error' | 'silent'
  logMessage: true, // log pesan masuk di terminal

  // ===== Plugin =====
  hotReload: true, // auto reload plugin saat file berubah

  // ===== Auto Behavior (semua bisa true/false) =====
  autoTyping: true, // kirim "sedang mengetik..." saat proses command
  autoRead: false, // auto-read (centang biru) pesan masuk
  autoOnline: true, // tampilkan status online saat bot aktif

  // ===== Auto-Restart (panel 24/7) =====
  autoRestart: {
    enabled: true,
    maxRetries: 10, // max retry sebelum exit (panel auto-restart prosesnya)
    retryDelayMs: 5000, // delay dasar (exponential backoff sampai max 60s)
  },

  // ===== Anti-Spam (sliding window, auto-mute) =====
  antispam: {
    enabled: true,
    windowMs: 5000, // jendela waktu (ms)
    maxHits: 5, // max command dalam window → kena spam → mute
    muteSeconds: 60, // durasi mute (detik)
    bypassOwner: true, // owner kebal anti-spam
    bypassPremium: false, // premium tidak kebal (ubah true jika mau)
  },

  // ===== Rate Limiter (per user, lebih halus dari anti-spam) =====
  rateLimit: {
    enabled: true,
    windowMs: 60000, // 1 menit
    maxRequests: 15, // max 15 command per 1 menit per user
    bypassOwner: true, // owner TIDAK kena rate limit
    bypassPremium: false,
    message: (s) =>
      `Kamu terlalu cepat. Tunggu *${s}* detik sebelum pakai command lagi.`,
  },

  // ===== Error Reporter =====
  errorReport: {
    enabled: true,
    target: null, // null = otomatis ke owner[0]; bisa isi jid spesifik
    includeStack: true, // tampilkan stack trace di report
  },

  // ===== Limit Default =====
  defaultLimit: 30,

  // ===== Caption / Style =====
  // Footer di bawah caption plugin. null = auto small-caps dari botName + ownerName.
  captionFooter: "*ʀʏᴜᴜᴢᴀᴀ ᴍᴅ | ᴏᴡɴᴇʀ: ᴘɪʀʀʀᴢᴀᴀᴀ*",
  // Nama bot bergaya untuk dipakai di header (boleh pakai unicode fancy)
  botFancyName: "ꔫ 𝐑𝐲𝐮𝐮𝐳𝐚𝐚 𝐌𝐃 ₊˚⊹",

  // ===== Newsletter context (gaya verified-look untuk semua reply) =====
  // Pesan yang kena style ini akan kelihatan "diteruskan dari channel" di WA.
  // Ganti `jid` & `name` jika kamu punya newsletter resmi sendiri.
  newsletter: {
    jid: "120363025246125888@newsletter",
    name: "ꔫ 𝐑𝐲𝐮𝐮𝐳𝐚𝐚 𝐌𝐃 ₊˚⊹",
    forwardingScore: 999,
  },

  // ===== m.reply() (validasi/usage/error) =====
  // Style otomatis untuk semua m.reply() di plugin/handler:
  // - newsletter context aktif
  // - tombol "Kembali ke Menu" otomatis
  replyStyle: {
    useInteractive: true,
    useNewsletter: true,
    footer: null, // null = pakai captionFooter
  },

  // ===== m.replyStyled() (hasil utama plugin) =====
  sendStyle: {
    useNewsletter: true, // hasil plugin pakai newsletter context (no button)
  },

  // ===== Pesan Generik =====
  messages: {
    onlyOwner: "Khusus owner.",
    onlyGroup: "Perintah ini hanya untuk grup.",
    onlyPrivate: "Perintah ini hanya untuk private chat.",
    onlyPremium: "Khusus user premium.",
    cooldown: (s) => `Tunggu *${s}* detik sebelum pakai perintah ini lagi.`,
    noLimit: "Limit kamu habis. Hubungi owner.",
    unknownCmd: (p) =>
      `Perintah tidak dikenal. Ketik *${p}menu* untuk daftar perintah.`,
    banned: "Kamu di-ban dari bot ini.",
    spamMuted: (s) =>
      `Terdeteksi spam. Tunggu *${s}* detik sebelum bisa pakai bot lagi.`,
    pluginDisabled: (name) => `Plugin *${name}* sedang dinonaktifkan.`,
  },
};

export default config;

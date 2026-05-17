// case.js — Ryuuzaa MD (sampingan)
//
// Dijalankan untuk:
//  - pesan non-command (tanpa prefix) -> auto-reply ringan
//  - command yang tidak ditemukan di plugins -> fallback / hidden alias
//
// Pesan validasi & info di sini pakai m.reply (newsletter + tombol kembali ke menu).

export default async function handleCase(ctx) {
  const { isCmd, command, body, m, pushName, config, prefix } = ctx;

  // === Fallback command tak dikenal ===
  if (isCmd) {
    switch (command) {
      case "hai":
      case "hi":
      case "halo":
        return m.reply(`Halo *${pushName}* 👋 — _${config.botName}_ siap.`);

      case "owner":
      case "creator":
        return m.reply(
          `Owner: *${config.ownerName}*\nwa.me/${config.owner[0]}`,
        );

      default:
        return m.reply(config.messages.unknownCmd(prefix || config.prefix[0]));
    }
  }

  // === Non-command (auto-reply ringan) ===
  const text = (body || "").toLowerCase().trim();
  switch (true) {
    case /^p+$/i.test(text):
      return m.reply("Iya, ada apa?");

    case ["assalamualaikum", "assalamu'alaikum"].includes(text):
      return m.reply("Wa'alaikumsalam warahmatullahi wabarakatuh 🙏");

    case ["bot?", "bot"].includes(text):
      return m.reply(`Iya, ${config.botName} hadir.`);

    default:
      return; // diam
  }
}

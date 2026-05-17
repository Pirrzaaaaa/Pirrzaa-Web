// Plugin: echo / say
export default {
  name: "echo",
  command: ["echo"],
  alias: ["say"],
  category: "tools",
  description: "Bot ulangi teks yang kamu kirim",
  usage: "<teks>",
  example: ".echo halo dunia",
  limit: 1,
  cooldown: 2000,

  async handler(ctx) {
    const { sock, m, text, prefix, command, pushName, config } = ctx;

    // Validasi → m.reply (newsletter + button)
    if (!text) {
      return m.reply(
        `Cara pakai: *${prefix}${command} <teks>*\nContoh: *${prefix}${command} halo dunia*`,
      );
    }

    // Hasil → sock.sendMessage langsung
    const out = `💬 *Echo*

☁︎ *RESPONSE* ☁︎
→ From: ${pushName}
→ Text: ${text}

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text: out });
  },
};

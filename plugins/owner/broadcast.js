// Plugin: broadcast
export default {
  name: "broadcast",
  command: ["broadcast"],
  alias: ["bc"],
  category: "owner",
  description: "Broadcast pesan ke chat saat ini",
  usage: "<teks>",
  example: ".bc halo semua",
  owner: true,
  limit: 0,
  cooldown: 3000,

  async handler(ctx) {
    const { sock, m, text, prefix, pushName, config } = ctx;

    if (!text) {
      return m.reply(`Cara pakai: *${prefix}bc <pesan>*`);
    }

    const out = `📢 *Broadcast*

☁︎ *PESAN* ☁︎
→ Dari: ${pushName}
→ Isi: ${text}

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text: out });
  },
};

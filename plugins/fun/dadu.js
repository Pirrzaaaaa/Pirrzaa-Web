// Plugin: dadu
const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default {
  name: "dadu",
  command: ["dadu"],
  alias: ["dice", "roll"],
  category: "fun",
  description: "Lempar dadu 1-6",
  usage: "",
  example: ".dadu",
  limit: 1,
  cooldown: 2000,

  async handler(ctx) {
    const { sock, m, pushName, config } = ctx;
    const n = 1 + Math.floor(Math.random() * 6);

    const text = `🎲 *Lempar Dadu*

☁︎ *HASIL* ☁︎
→ Pemain: ${pushName}
→ Hasil: ${FACES[n - 1]} *${n}*

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text });
  },
};

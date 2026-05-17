// Plugin: ban / unban
export default {
  name: "ban",
  command: ["ban", "unban"],
  category: "owner",
  description: "Ban / unban user dari pakai bot",
  usage: "(reply / mention)",
  example: ".ban (reply pesan target)",
  owner: true,
  cooldown: 1000,

  async handler(ctx) {
    const { sock, m, limiter, sender, command, config } = ctx;
    const target = m.quoted?.sender || m.mentions?.[0] || sender;

    const banned = command === "ban";
    limiter.setBanned(target, banned);

    const icon = banned ? "🚫" : "✅";
    const title = banned ? "Ban User" : "Unban User";
    const status = banned ? "Di-ban 🚫" : "Dibebaskan ✅";

    const text = `${icon} *${title}*

☁︎ *HASIL* ☁︎
→ Target: @${target.split("@")[0]}
→ Status: ${status}

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text, mentions: [target] });
  },
};

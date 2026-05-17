// Plugin: setpremium / unpremium
export default {
  name: "setpremium",
  command: ["setpremium", "unpremium"],
  alias: ["addpremium", "delpremium"],
  category: "owner",
  description:
    "Set / unset premium user. Boleh sertakan durasi hari, default permanen.",
  usage: "<hari?>",
  example: ".setpremium 30  (reply / mention)  •  .unpremium",
  owner: true,
  cooldown: 1000,

  async handler(ctx) {
    const { sock, m, args, limiter, sender, command, config } = ctx;
    const target = m.quoted?.sender || m.mentions?.[0] || sender;

    if (command === "unpremium" || command === "delpremium") {
      limiter.setPremium(target, false, null);
      const text = `💎 *Unset Premium*

☁︎ *HASIL* ☁︎
→ Target: @${target.split("@")[0]}
→ Status: Bukan premium lagi

${config.captionFooter}`;
      return sock.sendMessage(m.from, { text, mentions: [target] });
    }

    const days = parseInt(args[0], 10);
    const untilTs = isNaN(days)
      ? null
      : Date.now() + days * 24 * 60 * 60 * 1000;

    limiter.setPremium(target, true, untilTs);
    const sampai = untilTs
      ? new Date(untilTs).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
      : "Permanen";

    const text = `💎 *Set Premium*

☁︎ *HASIL* ☁︎
→ Target: @${target.split("@")[0]}
→ Status: Premium ✅
→ Sampai: ${sampai}

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text, mentions: [target] });
  },
};

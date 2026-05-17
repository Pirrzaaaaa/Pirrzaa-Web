// Plugin: setlimit / addlimit / resetlimit
export default {
  name: "setlimit",
  command: ["setlimit"],
  alias: ["addlimit", "resetlimit"],
  category: "owner",
  description: "Atur/tambah/reset limit user (reply / mention / sender)",
  usage: "<jumlah>",
  example: ".setlimit 50",
  owner: true,
  cooldown: 2000,

  async handler(ctx) {
    const { sock, m, args, limiter, sender, command, prefix, config } = ctx;
    const target = m.quoted?.sender || m.mentions?.[0] || sender;

    const value = parseInt(args[0], 10);
    if (isNaN(value)) {
      return m.reply(
        `Cara pakai: *${prefix}${command} <jumlah>*\nContoh: *${prefix}${command} 50*`,
      );
    }

    if (command === "addlimit") limiter.add(target, value);
    else limiter.reset(target, value);

    const title = command === "addlimit" ? "Add Limit" : "Set Limit";
    const text = `⚡ *${title}*

☁︎ *HASIL* ☁︎
→ Target: @${target.split("@")[0]}
→ Aksi: ${command}
→ Nilai: ${value}
→ Limit Sekarang: ${limiter.getLimit(target)}

${config.captionFooter}`;

    await sock.sendMessage(m.from, {
      text,
      mentions: [target],
    });
  },
};

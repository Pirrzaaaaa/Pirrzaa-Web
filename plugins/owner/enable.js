// Plugin: enable / disable / listdisabled
export default {
  name: "enable",
  command: ["enable", "disable", "listdisabled"],
  category: "owner",
  description: "Aktifkan / nonaktifkan plugin saat runtime",
  usage: "<command>",
  example: ".disable echo  /  .enable echo  /  .listdisabled",
  owner: true,
  cooldown: 1000,

  async handler(ctx) {
    const { sock, m, args, plugins, db, command, prefix, config } = ctx;

    if (command === "listdisabled") {
      const list = db.listDisabledPlugins();
      const items = list.length
        ? list.map((n) => `→ • ${n}`).join("\n")
        : "→ Tidak ada plugin yang dinonaktifkan.";
      const text = `🚫 *Plugin Nonaktif*

☁︎ *DAFTAR* ☁︎
${items}

${config.captionFooter}`;
      return sock.sendMessage(m.from, { text });
    }

    if (!args[0]) {
      return m.reply(
        `Cara pakai: *${prefix}${command} <command>*\nContoh: *${prefix}${command} echo*`,
      );
    }

    const target = plugins.find(args[0]);
    if (!target) {
      return m.reply(`Plugin/command *${args[0]}* tidak ditemukan.`);
    }
    const name = target.name;
    if (!name) {
      return m.reply(
        "Plugin tidak punya field *name*, tidak bisa di-toggle.",
      );
    }

    const disabled = command === "disable";
    db.setPluginDisabled(name, disabled);

    const icon = disabled ? "🚫" : "✅";
    const title = disabled ? "Plugin Disabled" : "Plugin Enabled";
    const status = disabled ? "Nonaktif 🚫" : "Aktif ✅";

    const text = `${icon} *${title}*

☁︎ *HASIL* ☁︎
→ Nama: ${name}
→ Status: ${status}

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text });
  },
};

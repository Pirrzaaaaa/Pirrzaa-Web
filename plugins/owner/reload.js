// Plugin: reload
export default {
  name: "reload",
  command: ["reload"],
  alias: ["rl"],
  category: "owner",
  description: "Reload semua plugin",
  usage: "",
  example: ".reload",
  owner: true,
  cooldown: 2000,

  async handler(ctx) {
    const { sock, m, plugins, config } = ctx;
    const t0 = Date.now();
    const { ok, fail, disabled, totalCmd } = await plugins.loadAll();
    const took = Date.now() - t0;

    const text = `🔄 *Plugin Reload*

☁︎ *HASIL* ☁︎
→ OK: ${ok}
→ Disabled: ${disabled}
→ Gagal: ${fail}
→ Total Command: ${totalCmd}
→ Waktu: ${took}ms

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text });
  },
};

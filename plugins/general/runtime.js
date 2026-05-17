// Plugin: runtime
import os from "os";
import { formatUptime } from "../../lib/ryuuzaa-helper.js";

export default {
  name: "runtime",
  command: ["runtime"],
  alias: ["uptime"],
  category: "general",
  description: "Lama bot menyala",
  usage: "",
  example: ".runtime",
  limit: 0,
  cooldown: 2000,

  async handler(ctx) {
    const { sock, m, config } = ctx;
    const text = `⏱️ *Bot Runtime*

☁︎ *INFORMASI* ☁︎
→ Nama Bot: ${config.botFancyName || config.botName}
→ Bot Uptime: ${formatUptime(process.uptime())}
→ Server Uptime: ${formatUptime(os.uptime())}

${config.captionFooter}`;
    await sock.sendMessage(m.from, { text });
  },
};

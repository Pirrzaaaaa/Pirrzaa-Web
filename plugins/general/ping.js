// Plugin: ping
// - Hasil: sock.sendMessage langsung dengan caption ditulis manual
// - Validasi/error: m.reply (newsletter + tombol kembali ke menu)
import { performance } from "perf_hooks";

export default {
  name: "ping",
  command: ["ping"],
  alias: ["pong", "speed"],
  category: "general",
  description: "Cek latency bot",
  usage: "",
  example: ".ping",
  limit: 0,
  cooldown: 2000,

  async handler(ctx) {
    const { sock, m, config } = ctx;
    const tStart = performance.now();
    let waRoundtrip = 0;
    try {
      const tA = performance.now();
      await sock.sendPresenceUpdate?.("available");
      waRoundtrip = Math.max(1, Math.round(performance.now() - tA));
    } catch {}
    const totalExec = Math.round(performance.now() - tStart);
    const emoji =
      waRoundtrip < 100 ? "🟢" : waRoundtrip < 500 ? "🟡" : "🔴";
    const quality =
      waRoundtrip < 100
        ? "FAST"
        : waRoundtrip < 300
          ? "NORMAL"
          : waRoundtrip < 800
            ? "SLOW"
            : "VERY SLOW";

    const text = `🏓 *Pong!*

☁︎ *RESPONSE* ☁︎
→ Bot: ${config.botFancyName || config.botName}
→ WA Roundtrip: ${waRoundtrip}ms ${emoji}
→ Total Exec: ${totalExec}ms
→ Kualitas: ${quality}

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text });
  },
};

// Plugin: limit
export default {
  name: "limit",
  command: ["limit"],
  alias: ["energy", "mylimit"],
  category: "general",
  description: "Cek sisa limit kamu",
  usage: "",
  example: ".limit",
  limit: 0,
  cooldown: 2000,

  async handler(ctx) {
    const { sock, m, sender, limiter, isOwner, isPremium, pushName, config } =
      ctx;
    const role = isOwner
      ? "👑 Owner (Unlimited)"
      : isPremium
        ? "💎 Premium (Unlimited)"
        : "👤 User";
    const sisa =
      isOwner || isPremium ? "Unlimited" : `${limiter.getLimit(sender)}`;

    const text = `⚡ *Status Limit*

☁︎ *INFORMASI USER* ☁︎
→ Nama: ${pushName}
→ Status: ${role}
→ Sisa Limit: ${sisa}
→ Nomor: ${sender?.split("@")[0]}

☁︎ *CATATAN* ☁︎
→ Limit berkurang saat pakai command yang punya field 'limit'.
→ Hubungi owner jika limit habis.

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text });
  },
};

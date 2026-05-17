// Plugin: sticker (placeholder, butuh ffmpeg/sharp)
export default {
  name: "sticker",
  command: ["sticker"],
  alias: ["s", "stiker"],
  category: "tools",
  description: "Buat stiker dari gambar (reply gambar)",
  usage: "(reply gambar)",
  example: ".sticker (reply gambar)",
  limit: 2,
  cooldown: 5000,

  async handler(ctx) {
    const { m, prefix } = ctx;
    const isImg =
      m.media?.type === "imageMessage" ||
      m.quoted?.media?.type === "imageMessage";
    if (!isImg) {
      return m.reply(`Reply gambar dengan caption *${prefix}sticker*`);
    }
    return m.reply(
      "Fitur stiker butuh ffmpeg/sharp. Belum aktif by default — silakan extend plugin ini.",
    );
  },
};

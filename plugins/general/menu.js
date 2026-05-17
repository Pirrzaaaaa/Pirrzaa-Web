// Plugin: menu / help — caption ditulis manual, kirim via sock.sendMessage
//
// Pemakaian:
//   .menu             -> daftar semua kategori
//   .menu <kategori>  -> daftar command di kategori tertentu
//   .menu <command>   -> detail satu command

const ICON = {
  general: "⚙️",
  tools: "🛠️",
  fun: "🎲",
  downloader: "⬇️",
  owner: "👑",
  group: "👥",
  premium: "💎",
  lainnya: "📦",
};

function tagsOf(plugin) {
  const tags = [];
  if (plugin.owner) tags.push("👑");
  if (plugin.premium) tags.push("💎");
  if (plugin.group) tags.push("👥");
  if (plugin.private) tags.push("🔒");
  if (plugin.admin) tags.push("🛡️");
  if (plugin.botAdmin) tags.push("🤖");
  if (plugin.nsfw) tags.push("🔞");
  if (plugin.limit) tags.push(`⚡${plugin.limit}`);
  return tags;
}

function buildAll(ctx) {
  const { plugins, pushName, sender, limiter, isOwner, isPremium, config } =
    ctx;
  const groups = plugins.listByCategory();
  const stats = plugins.stats();
  const p = config.prefix[0];
  const role = isOwner ? "👑 Owner" : isPremium ? "💎 Premium" : "👤 User";
  const sisa = isOwner || isPremium ? "Unlimited" : limiter.getLimit(sender);

  const order = [
    "general",
    "tools",
    "fun",
    "downloader",
    "group",
    "owner",
    "lainnya",
  ];
  const cats = Object.keys(groups).sort(
    (a, b) =>
      (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? 999 : order.indexOf(b)),
  );

  // Build kategori sections
  let catBlocks = "";
  for (const cat of cats) {
    const icon = ICON[cat] || "•";
    const list = groups[cat];
    const items = list
      .map((plugin) => {
        const main = []
          .concat(plugin.command || [])
          .concat(plugin.alias || [])[0];
        const tags = tagsOf(plugin);
        const tagStr = tags.length ? ` ${tags.join("")}` : "";
        return `→   ${p}${main}${tagStr}`;
      })
      .join("\n");
    catBlocks += `\n☁︎ *${icon} ${cat.toUpperCase()} (${list.length})* ☁︎
${items}
`;
  }

  return `✦ *MENU COMMAND*
_Halo ${pushName}, berikut daftar perintah bot._

☁︎ *INFORMASI USER* ☁︎
→ Nama: ${pushName}
→ Status: ${role}
→ Limit: ${sisa}

☁︎ *INFORMASI BOT* ☁︎
→ Nama Bot: ${config.botFancyName || config.botName}
→ Plugin Aktif: ${stats.activePlugins}
→ Total Command: ${stats.totalCommands}
${catBlocks}
☁︎ *CATATAN* ☁︎
→ Ketik *${p}menu <kategori>* untuk lihat detail per kategori
→ Ketik *${p}menu <command>* untuk lihat usage & contoh

${config.captionFooter}`;
}

function buildCategory(ctx, cat) {
  const { plugins, config } = ctx;
  const groups = plugins.listByCategory();
  const list = groups[cat];
  if (!list) return null;

  const p = config.prefix[0];

  let blocks = "";
  for (const plugin of list) {
    const main = []
      .concat(plugin.command || [])
      .concat(plugin.alias || [])[0];
    const lines = [];
    if (plugin.description) lines.push(`→ Deskripsi: ${plugin.description}`);
    if (plugin.usage) lines.push(`→ Usage: ${p}${main} ${plugin.usage}`);
    if (plugin.example) lines.push(`→ Contoh: ${plugin.example}`);
    if (plugin.limit) lines.push(`→ Limit: ${plugin.limit}`);
    if (plugin.cooldown)
      lines.push(`→ Cooldown: ${Math.round(plugin.cooldown / 1000)}s`);
    blocks += `\n☁︎ *${p}${main}* ☁︎\n${lines.join("\n")}\n`;
  }

  return `${ICON[cat] || "📦"} *KATEGORI: ${cat.toUpperCase()}*
_${list.length} command tersedia_
${blocks}
${config.captionFooter}`;
}

function buildDetail(ctx, plugin) {
  const { config } = ctx;
  const p = config.prefix[0];
  const cmds = []
    .concat(plugin.command || [])
    .concat(plugin.alias || []);
  const main = cmds[0];
  const aliases = cmds.slice(1);
  const tags = tagsOf(plugin);

  const lines = [];
  lines.push(`→ Name: ${plugin.name || main}`);
  lines.push(`→ Command: ${p}${main}`);
  if (aliases.length)
    lines.push(`→ Alias: ${aliases.map((a) => p + a).join(", ")}`);
  lines.push(`→ Category: ${plugin.category || "-"}`);
  if (plugin.description) lines.push(`→ Description: ${plugin.description}`);
  if (plugin.usage) lines.push(`→ Usage: ${p}${main} ${plugin.usage}`);
  if (plugin.example) lines.push(`→ Example: ${plugin.example}`);
  if (plugin.tags?.length) lines.push(`→ Tags: ${plugin.tags.join(", ")}`);
  if (plugin.limit) lines.push(`→ Limit: ${plugin.limit}`);
  if (plugin.cooldown)
    lines.push(`→ Cooldown: ${Math.round(plugin.cooldown / 1000)}s`);
  if (tags.length) lines.push(`→ Akses: ${tags.join(" ")}`);

  return `🔍 *Detail Command: ${p}${main}*

☁︎ *INFORMASI* ☁︎
${lines.join("\n")}

${config.captionFooter}`;
}

export default {
  name: "menu",
  command: ["menu"],
  alias: ["help", "start", "?"],
  category: "general",
  description: "Daftar perintah / detail command",
  usage: "[kategori|command]",
  example: ".menu  /  .menu tools  /  .menu echo",
  limit: 0,
  cooldown: 3000,

  async handler(ctx) {
    const { sock, m, args, plugins, config } = ctx;

    if (!args.length) {
      return sock.sendMessage(m.from, { text: buildAll(ctx) });
    }

    const q = args[0].toLowerCase();
    const plugin = plugins.find(q);
    if (plugin) {
      return sock.sendMessage(m.from, { text: buildDetail(ctx, plugin) });
    }

    const out = buildCategory(ctx, q);
    if (!out) {
      return m.reply(
        `Kategori atau command *${q}* tidak ditemukan. Coba *${config.prefix[0]}menu*.`,
      );
    }
    return sock.sendMessage(m.from, { text: out });
  },
};

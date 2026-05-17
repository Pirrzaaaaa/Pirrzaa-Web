// Ryuuzaa MD — message handler
//
// Tanggung jawab:
// - serialize pesan (m) lengkap
// - parse command
// - anti-spam (kecuali owner sesuai config)
// - rate limiter (kecuali owner sesuai config)
// - auto-typing, auto-read, auto-online (sesuai config)
// - bangun ctx
// - guard akses plugin
// - cooldown & limit
// - dispatch ke plugin atau fallback ke case.js
// - error reporter ke owner (caption manual ☁︎ via sock.sendMessage)

import { config } from "./config.js";
import { parseCommand, isOwner } from "./lib/ryuuzaa-helper.js";
import { serialize } from "./lib/ryuuzaa-serialize.js";
import { limiter } from "./lib/ryuuzaa-limiter.js";
import { antispam } from "./lib/ryuuzaa-antispam.js";
import { db } from "./lib/ryuuzaa-database.js";
import { logger } from "./lib/ryuuzaa-logger.js";
import handleCase from "./case.js";

export function createMessageHandler({ sock, plugins }) {
  return async function onMessagesUpsert({ messages, type }) {
    if (type !== "notify") return;
    for (const raw of messages) {
      try {
        await handleSingleMessage({ sock, plugins, raw });
      } catch (err) {
        logger.error("handler error:", err?.message || err);
      }
    }
  };
}

async function handleSingleMessage({ sock, plugins, raw }) {
  if (!raw.message) return;
  if (raw.key.fromMe) return;

  const m = serialize(raw, sock);
  if (!m) return;

  const { from, sender, pushName, isGroup, body } = m;
  const parsed = parseCommand(body);

  logger.msg(
    "in",
    `${isGroup ? "GRUP" : "PRIV"}:${sender}`,
    pushName,
    body,
  );

  if (config.autoRead) {
    sock.readMessages?.([raw.key]).catch(() => {});
  }

  if (sender) limiter.ensure(sender, config.defaultLimit);

  const ownerFlag = isOwner(sender);
  const premiumFlag = limiter.isPremium(sender);

  if (!ownerFlag && limiter.isBanned(sender)) return;

  const ctx = {
    sock,
    msg: raw,
    m,
    from,
    sender,
    pushName,
    isGroup,
    isOwner: ownerFlag,
    isPremium: premiumFlag,
    plugins,
    limiter,
    db,
    config,
    logger,
    reply: (content, opts) => m.reply(content, opts),
    ...parsed,
  };

  if (parsed.isCmd) {
    const plugin = plugins.find(parsed.command);
    if (plugin) {
      const spam = checkAntiSpam(sender, ownerFlag, premiumFlag);
      if (!spam.ok) {
        return m.reply(
          config.messages.spamMuted(Math.ceil(spam.remain / 1000)),
        );
      }
      const rate = checkRateLimit(sender, ownerFlag, premiumFlag);
      if (!rate.ok) {
        const cfg = config.rateLimit || {};
        const txt =
          typeof cfg.message === "function"
            ? cfg.message(Math.ceil(rate.remain / 1000))
            : `Rate limit. Tunggu ${Math.ceil(rate.remain / 1000)} detik.`;
        return m.reply(txt);
      }

      await runPlugin({ ctx, plugin, parsed, sender, sock, from, m });
      return;
    }
  }

  await handleCase(ctx);
}

function checkAntiSpam(sender, ownerFlag, premiumFlag) {
  const cfg = config.antispam || {};
  if (!cfg.enabled) return { ok: true };
  if (cfg.bypassOwner && ownerFlag) return { ok: true };
  if (cfg.bypassPremium && premiumFlag) return { ok: true };
  return antispam.hit(sender);
}

function checkRateLimit(sender, ownerFlag, premiumFlag) {
  const cfg = config.rateLimit || {};
  if (!cfg.enabled) return { ok: true };
  if (cfg.bypassOwner && ownerFlag) return { ok: true };
  if (cfg.bypassPremium && premiumFlag) return { ok: true };
  return limiter.checkRate(sender);
}

async function runPlugin({ ctx, plugin, parsed, sender, sock, from, m }) {
  const { isGroup, isOwner: ownerFlag, isPremium } = ctx;

  if (plugin.name && db.isPluginDisabled(plugin.name) && !ownerFlag) {
    return m.reply(config.messages.pluginDisabled(plugin.name));
  }

  if (plugin.owner && !ownerFlag) return m.reply(config.messages.onlyOwner);
  if (plugin.group && !isGroup) return m.reply(config.messages.onlyGroup);
  if (plugin.private && isGroup) return m.reply(config.messages.onlyPrivate);
  if (plugin.premium && !isPremium && !ownerFlag)
    return m.reply(config.messages.onlyPremium);

  const cdMs = plugin.cooldown || 0;
  if (cdMs && !ownerFlag) {
    const remain = limiter.getCooldown(parsed.command, sender, cdMs);
    if (remain > 0)
      return m.reply(config.messages.cooldown(Math.ceil(remain / 1000)));
  }

  const cost = plugin.limit ?? plugin.energy ?? 0;
  if (cost > 0 && !ownerFlag && !isPremium) {
    const remaining = limiter.getLimit(sender);
    if (remaining < cost) return m.reply(config.messages.noLimit);
    limiter.consume(sender, cost);
  }

  let typingStop = null;
  if (config.autoTyping) {
    try {
      await sock.sendPresenceUpdate?.("composing", from);
      typingStop = setTimeout(() => {
        sock.sendPresenceUpdate?.("paused", from).catch(() => {});
      }, 15000);
    } catch {}
  }

  try {
    await plugin.handler(ctx);
    if (cdMs) limiter.setCooldown(parsed.command, sender);
  } catch (err) {
    logger.error(
      `plugin ${plugin.name || parsed.command}:`,
      err?.message || err,
    );
    await m.reply(`Error: ${err.message || err}`);
    await reportErrorToOwner({ sock, plugin, parsed, sender, err, ctx });
  } finally {
    if (typingStop) {
      clearTimeout(typingStop);
      sock.sendPresenceUpdate?.("paused", from).catch(() => {});
    }
  }
}

async function reportErrorToOwner({ sock, plugin, parsed, sender, err, ctx }) {
  const cfg = config.errorReport || {};
  if (!cfg.enabled) return;

  const ownerNum = config.owner?.[0];
  const target =
    cfg.target || (ownerNum ? `${ownerNum}@s.whatsapp.net` : null);
  if (!target) return;

  const now = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });

  const stackBlock =
    cfg.includeStack && err?.stack
      ? `\n☁︎ *STACK TRACE* ☁︎\n${String(err.stack).split("\n").slice(0, 8).join("\n")}\n`
      : "";

  const text = `⚠️ *Plugin Error Report*
_Auto-report ke owner_

☁︎ *INFORMASI BOT* ☁︎
→ Bot: ${config.botFancyName || config.botName}
→ Waktu: ${now}
→ Plugin: ${plugin.name || "(tanpa nama)"}
→ Command: ${ctx.prefix}${parsed.command}
→ Category: ${plugin.category || "-"}

☁︎ *INFORMASI USER* ☁︎
→ Sender: ${sender}
→ PushName: ${ctx.pushName}
→ Chat: ${ctx.isGroup ? "GRUP" : "PRIVATE"}
→ From: ${ctx.from}

☁︎ *PESAN ASLI* ☁︎
→ Body: ${ctx.body || "-"}

☁︎ *ERROR DETAIL* ☁︎
→ Type: ${err?.name || "Error"}
→ Message: ${err?.message || String(err)}
${stackBlock}
☁︎ *CATATAN* ☁︎
→ Error sudah ter-log di terminal juga.
→ Cek file plugin terkait dan dependency-nya.

${config.captionFooter}`;

  try {
    await sock.sendMessage(target, { text });
  } catch (e) {
    logger.warn("gagal kirim error report:", e?.message);
  }
}

export default createMessageHandler;

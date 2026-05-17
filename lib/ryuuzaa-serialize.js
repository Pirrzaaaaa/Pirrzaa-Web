// Ryuuzaa MD — Message Serializer
//
// Bikin objek `m` dengan API lengkap dari pesan Baileys mentah:
//
//   m.id, m.from, m.sender, m.pushName, m.isGroup, m.isBot
//   m.fromMe, m.timestamp
//   m.message, m.type, m.mtype, m.body, m.text
//   m.mentions, m.url
//   m.quoted        (juga ter-serialize: id, sender, message, type, text, download, delete, ...)
//   m.media         (info attachment: type, mimetype, fileLength, fileName, ...)
//
//   m.download()    -> Buffer
//   m.reply(text|opts)        -> newsletter-style + tombol "Kembali ke Menu" (untuk validasi/error/usage)
//   m.replyPlain(content)     -> tanpa style/button
//   m.replyStyled(content)    -> hasil utama plugin (newsletter context, no button)
//   m.send(jid, content)
//   m.replyImg(buf, {caption?, ...})
//   m.replyVid(buf, {caption?, ...})
//   m.replyAudio(buf, {ptt?, ...})
//   m.replyDoc(buf, {fileName, mimetype, caption?})
//   m.replySticker(buf)
//   m.react(emoji)
//   m.delete()
//   m.edit(newText)
//   m.copy()
//   m.forward(jid)
//   m.typing(state?)

import { downloadMediaMessage } from "@blckrose/baileys";
import {
  styledReplyOptions,
  styledSendOptions,
} from "./ryuuzaa-style.js";
import { isOwner } from "./ryuuzaa-helper.js";

const MEDIA_TYPES = [
  "imageMessage",
  "videoMessage",
  "audioMessage",
  "stickerMessage",
  "documentMessage",
  "documentWithCaptionMessage",
];

/**
 * Ambil teks dari segala jenis message-content.
 */
export function extractText(messageContent) {
  if (!messageContent) return "";
  return (
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    messageContent.imageMessage?.caption ||
    messageContent.videoMessage?.caption ||
    messageContent.documentMessage?.caption ||
    messageContent.documentWithCaptionMessage?.message?.documentMessage
      ?.caption ||
    messageContent.buttonsResponseMessage?.selectedDisplayText ||
    messageContent.buttonsResponseMessage?.selectedButtonId ||
    messageContent.listResponseMessage?.singleSelectReply?.selectedRowId ||
    messageContent.listResponseMessage?.title ||
    messageContent.templateButtonReplyMessage?.selectedDisplayText ||
    messageContent.templateButtonReplyMessage?.selectedId ||
    messageContent.interactiveResponseMessage?.body?.text ||
    messageContent.interactiveResponseMessage?.nativeFlowResponseMessage
      ?.paramsJson ||
    messageContent.editedMessage?.message?.protocolMessage?.editedMessage
      ?.conversation ||
    ""
  );
}

/**
 * Type pesan utama (key dari m.message).
 */
export function getMessageType(messageContent) {
  if (!messageContent) return null;
  const keys = Object.keys(messageContent).filter(
    (k) => k !== "messageContextInfo",
  );
  return keys[0] || null;
}

/**
 * Unwrap ephemeralMessage / viewOnceMessage / documentWithCaptionMessage / editedMessage.
 */
function unwrap(messageContent) {
  if (!messageContent) return messageContent;
  if (messageContent.ephemeralMessage)
    return unwrap(messageContent.ephemeralMessage.message);
  if (messageContent.viewOnceMessage)
    return unwrap(messageContent.viewOnceMessage.message);
  if (messageContent.viewOnceMessageV2)
    return unwrap(messageContent.viewOnceMessageV2.message);
  if (messageContent.documentWithCaptionMessage)
    return unwrap(messageContent.documentWithCaptionMessage.message);
  if (messageContent.editedMessage)
    return unwrap(
      messageContent.editedMessage.message?.protocolMessage?.editedMessage,
    );
  return messageContent;
}

/**
 * Ambil contextInfo (mention list, quoted, dll).
 */
function getContextInfo(messageContent) {
  if (!messageContent) return null;
  const t = getMessageType(messageContent);
  return messageContent[t]?.contextInfo || null;
}

/**
 * Cari URL pertama di body.
 */
function extractUrl(text = "") {
  const m = String(text).match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

function makeMediaInfo(messageContent) {
  if (!messageContent) return null;
  const type = MEDIA_TYPES.find((t) => messageContent[t]);
  if (!type) return null;
  const m = messageContent[type];
  return {
    type,
    mimetype: m.mimetype,
    fileLength: m.fileLength ? Number(m.fileLength) : undefined,
    fileName: m.fileName,
    caption: m.caption,
    seconds: m.seconds,
    ptt: m.ptt,
    width: m.width,
    height: m.height,
    pageCount: m.pageCount,
    isAnimated: m.isAnimated,
  };
}

/**
 * Serialize pesan jadi `m` siap pakai.
 */
export function serialize(rawMsg, sock) {
  if (!rawMsg) return null;
  const m = {};

  m.raw = rawMsg;
  m.key = rawMsg.key;
  m.id = rawMsg.key?.id;
  m.from = rawMsg.key?.remoteJid;
  m.fromMe = rawMsg.key?.fromMe;
  m.timestamp = Number(rawMsg.messageTimestamp || 0);
  m.pushName = rawMsg.pushName || "";
  m.isGroup = m.from?.endsWith("@g.us") || false;
  m.sender = m.isGroup
    ? rawMsg.key?.participant || rawMsg.participant
    : m.from;
  m.isBot = m.id?.startsWith?.("BAE5") || m.id?.startsWith?.("3EB0") || false;
  m.isOwner = isOwner(m.sender);

  // unwrap message agar selalu kena ke konten asli
  m.message = unwrap(rawMsg.message);
  m.type = getMessageType(m.message);
  m.mtype = m.type;
  m.body = extractText(m.message);
  m.text = m.body;
  m.url = extractUrl(m.body);

  // mentions
  const ctxInfo = getContextInfo(m.message);
  m.mentions = ctxInfo?.mentionedJid || [];

  // media info
  m.media = makeMediaInfo(m.message);

  // ===== QUOTED =====
  m.quoted = null;
  if (ctxInfo?.quotedMessage) {
    const qContent = unwrap(ctxInfo.quotedMessage);
    const qType = getMessageType(qContent);
    const qSender = ctxInfo.participant || ctxInfo.remoteJid || m.from;
    const qFakeRaw = {
      key: {
        remoteJid: m.from,
        fromMe:
          qSender === sock.user?.id ||
          qSender === sock.user?.id?.replace(/:\d+/, ""),
        id: ctxInfo.stanzaId,
        participant: qSender,
      },
      message: qContent,
      pushName: m.pushName,
    };
    m.quoted = {
      key: qFakeRaw.key,
      id: ctxInfo.stanzaId,
      sender: qSender,
      from: m.from,
      message: qContent,
      type: qType,
      mtype: qType,
      text: extractText(qContent),
      body: extractText(qContent),
      media: makeMediaInfo(qContent),
      raw: qFakeRaw,
      download: () => downloadMediaMessage(qFakeRaw, "buffer", {}),
      delete: () =>
        sock.sendMessage(m.from, { delete: qFakeRaw.key }),
      react: (emoji) =>
        sock.sendMessage(m.from, {
          react: { text: emoji || "", key: qFakeRaw.key },
        }),
    };
  }

  // ===== METHODS =====
  m.download = (type = "buffer") => downloadMediaMessage(rawMsg, type, {});

  // helper kirim umum
  m.send = (jid, content, opts = {}) => {
    if (typeof content === "string") content = { text: content };
    return sock.sendMessage(jid, content, opts);
  };

  // styled reply (untuk validasi/usage/error) → newsletter context + tombol "Kembali ke Menu"
  m.reply = (content, options = {}) => {
    if (typeof content === "string") content = { text: content };
    const styled = styledReplyOptions(content);
    return sock.sendMessage(m.from, styled, { quoted: rawMsg, ...options });
  };

  // plain reply (tanpa style/button) — kalau butuh polos
  m.replyPlain = (content, options = {}) => {
    if (typeof content === "string") content = { text: content };
    return sock.sendMessage(m.from, content, { quoted: rawMsg, ...options });
  };

  // styled send (newsletter context, tanpa button, TANPA quoted)
  // → ini SETARA dengan sock.sendMessage(from, content) langsung.
  // Pakai ini untuk hasil utama plugin (caption ☁︎).
  m.replyStyled = (content, options = {}) => {
    if (typeof content === "string") content = { text: content };
    const styled = styledSendOptions(content);
    return sock.sendMessage(m.from, styled, options);
  };

  // media replies
  m.replyImg = (buffer, opts = {}) =>
    sock.sendMessage(m.from, { image: buffer, ...opts }, { quoted: rawMsg });
  m.replyVid = (buffer, opts = {}) =>
    sock.sendMessage(m.from, { video: buffer, ...opts }, { quoted: rawMsg });
  m.replyAudio = (buffer, opts = {}) =>
    sock.sendMessage(
      m.from,
      {
        audio: buffer,
        mimetype: opts.mimetype || "audio/mp4",
        ptt: opts.ptt || false,
        ...opts,
      },
      { quoted: rawMsg },
    );
  m.replyDoc = (buffer, opts = {}) =>
    sock.sendMessage(
      m.from,
      {
        document: buffer,
        mimetype: opts.mimetype || "application/octet-stream",
        fileName: opts.fileName || "file",
        ...opts,
      },
      { quoted: rawMsg },
    );
  m.replySticker = (buffer) =>
    sock.sendMessage(m.from, { sticker: buffer }, { quoted: rawMsg });

  // reactions
  m.react = (emoji) =>
    sock.sendMessage(m.from, {
      react: { text: emoji || "", key: rawMsg.key },
    });

  // delete pesan ini
  m.delete = () => sock.sendMessage(m.from, { delete: rawMsg.key });

  // edit pesan ini (kalau bot yang kirim)
  m.edit = (newText) =>
    sock.sendMessage(m.from, { text: newText, edit: rawMsg.key });

  // forward / copy
  m.copy = () => ({ ...rawMsg });
  m.forward = (jid, opts = {}) =>
    sock.sendMessage(jid, { forward: rawMsg, ...opts });

  // typing indicator helper
  m.typing = async (state = "composing") => {
    try {
      await sock.sendPresenceUpdate?.(state, m.from);
    } catch {}
  };

  return m;
}

export default serialize;

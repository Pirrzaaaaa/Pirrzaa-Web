// Ryuuzaa MD — limit, cooldown & rate limiter
//
// - Limit & premium: persisten di SQLite (lib/ryuuzaa-database.js)
// - Cooldown: in-memory (window pendek, tidak perlu disimpan)
// - Rate limiter: in-memory sliding-window per user (command per menit)
//   → BERBEDA dari anti-spam. Ini membatasi pemakaian normal.
//   → Owner bypass rate limit.

import { db } from "./ryuuzaa-database.js";
import { config } from "../config.js";

class Limiter {
  constructor() {
    /** @type {Map<string, number>} key (cmd|jid) -> last timestamp */
    this.cooldowns = new Map();
    /** @type {Map<string, number[]>} jid -> array timestamp pemakaian (untuk rate limit) */
    this.rateBuckets = new Map();
  }

  // ============= limit (DB) =============
  ensure(jid, defaultLimit = config.defaultLimit) {
    db.ensureUser(jid, defaultLimit);
  }

  consume(jid, amount = 1) {
    return db.consumeLimit(jid, amount);
  }

  add(jid, amount = 1) {
    db.addLimit(jid, amount);
  }

  reset(jid, value) {
    db.setLimit(jid, value);
  }

  resetAll(value) {
    db.resetAllLimit(value);
  }

  getLimit(jid) {
    return db.getLimit(jid);
  }

  // ============= cooldown (in-memory) =============
  getCooldown(cmd, jid, durationMs) {
    if (!durationMs) return 0;
    const key = `${cmd}|${jid}`;
    const last = this.cooldowns.get(key) || 0;
    const elapsed = Date.now() - last;
    return elapsed < durationMs ? durationMs - elapsed : 0;
  }

  setCooldown(cmd, jid) {
    this.cooldowns.set(`${cmd}|${jid}`, Date.now());
  }

  // ============= rate limiter (in-memory) =============
  /**
   * Cek & catat rate limit.
   * Return { ok: true } kalau masih boleh, { ok: false, remain: ms } kalau kena limit.
   * Config: config.rateLimit.{enabled, windowMs, maxRequests, bypassOwner}
   */
  checkRate(jid) {
    const cfg = config.rateLimit;
    if (!cfg || !cfg.enabled) return { ok: true };

    const now = Date.now();
    const win = cfg.windowMs ?? 60000; // default 1 menit
    const max = cfg.maxRequests ?? 15; // default 15 cmd per menit

    // clean expired entries & push current
    const arr = (this.rateBuckets.get(jid) || []).filter(
      (t) => now - t <= win,
    );

    if (arr.length >= max) {
      // cari kapan slot pertama expired
      const oldest = arr[0];
      const remain = win - (now - oldest);
      return { ok: false, remain };
    }

    arr.push(now);
    this.rateBuckets.set(jid, arr);
    return { ok: true };
  }

  resetRate(jid) {
    this.rateBuckets.delete(jid);
  }

  // ============= premium / ban (proxy ke DB) =============
  isPremium(jid) {
    return db.isPremium(jid);
  }
  setPremium(jid, on, untilTs = null) {
    db.setPremium(jid, on, untilTs);
  }
  isBanned(jid) {
    return db.isBanned(jid);
  }
  setBanned(jid, on) {
    db.setBanned(jid, on);
  }
}

export const limiter = new Limiter();
export default limiter;

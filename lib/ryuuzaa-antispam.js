// Ryuuzaa MD — Anti-spam (sliding-window + auto-mute)
//
// Tidak persisten (in-memory): cocok karena spam window biasanya pendek.

import { config } from "../config.js";

class AntiSpam {
  constructor() {
    /** @type {Map<string, number[]>} jid -> array timestamp pemakaian command */
    this.hits = new Map();
    /** @type {Map<string, number>} jid -> mutedUntil ts */
    this.muted = new Map();
  }

  /**
   * Catat 1 hit user. Return:
   *  { ok: true }                              jika tidak spam
   *  { ok: false, reason: 'muted', remain }    jika lagi mute
   *  { ok: false, reason: 'spam', remain }     jika baru-baru saja kena spam
   */
  hit(jid) {
    if (!config.antispam?.enabled) return { ok: true };

    const now = Date.now();

    // 1. cek mute
    const until = this.muted.get(jid) || 0;
    if (until > now) {
      return { ok: false, reason: "muted", remain: until - now };
    } else if (until && until <= now) {
      this.muted.delete(jid);
    }

    // 2. sliding window
    const win = config.antispam.windowMs ?? 5000;
    const max = config.antispam.maxHits ?? 5;
    const arr = (this.hits.get(jid) || []).filter((t) => now - t <= win);
    arr.push(now);
    this.hits.set(jid, arr);

    if (arr.length > max) {
      // muted!
      const muteMs = (config.antispam.muteSeconds ?? 60) * 1000;
      const newUntil = now + muteMs;
      this.muted.set(jid, newUntil);
      this.hits.delete(jid);
      return { ok: false, reason: "spam", remain: muteMs };
    }

    return { ok: true };
  }

  reset(jid) {
    this.hits.delete(jid);
    this.muted.delete(jid);
  }

  isMuted(jid) {
    const until = this.muted.get(jid) || 0;
    return until > Date.now();
  }
}

export const antispam = new AntiSpam();
export default antispam;

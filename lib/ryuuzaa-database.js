// Ryuuzaa MD — SQLite database (better-sqlite3)
//
// Tabel:
// - users         (jid, limit_left, premium, premium_until, banned, registered_at, last_seen)
// - plugins_state (name, disabled, updated_at)
// - settings      (key, value)        — penyimpanan generik

import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";
import { config } from "../config.js";

class RyuuzaaDB {
  constructor(filePath = config.databasePath) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    this.db = new Database(filePath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this._migrate();
    this._prepare();
  }

  _migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        jid            TEXT PRIMARY KEY,
        limit_left     INTEGER NOT NULL DEFAULT 0,
        premium        INTEGER NOT NULL DEFAULT 0,
        premium_until  INTEGER,
        banned         INTEGER NOT NULL DEFAULT 0,
        registered_at  INTEGER,
        last_seen      INTEGER
      );

      CREATE TABLE IF NOT EXISTS plugins_state (
        name        TEXT PRIMARY KEY,
        disabled    INTEGER NOT NULL DEFAULT 0,
        updated_at  INTEGER
      );

      CREATE TABLE IF NOT EXISTS settings (
        key    TEXT PRIMARY KEY,
        value  TEXT
      );
    `);
  }

  _prepare() {
    this.q = {
      // users
      getUser: this.db.prepare(`SELECT * FROM users WHERE jid = ?`),
      upsertUser: this.db.prepare(`
        INSERT INTO users (jid, limit_left, registered_at, last_seen)
        VALUES (@jid, @limit_left, @now, @now)
        ON CONFLICT(jid) DO UPDATE SET last_seen = @now
      `),
      setLimit: this.db.prepare(
        `UPDATE users SET limit_left = ? WHERE jid = ?`,
      ),
      addLimit: this.db.prepare(
        `UPDATE users SET limit_left = limit_left + ? WHERE jid = ?`,
      ),
      consumeLimit: this.db.prepare(
        `UPDATE users SET limit_left = limit_left - ? WHERE jid = ? AND limit_left >= ?`,
      ),
      resetAllLimit: this.db.prepare(`UPDATE users SET limit_left = ?`),

      setPremium: this.db.prepare(
        `UPDATE users SET premium = ?, premium_until = ? WHERE jid = ?`,
      ),
      setBanned: this.db.prepare(
        `UPDATE users SET banned = ? WHERE jid = ?`,
      ),

      // plugins_state
      getPluginState: this.db.prepare(
        `SELECT * FROM plugins_state WHERE name = ?`,
      ),
      upsertPluginState: this.db.prepare(`
        INSERT INTO plugins_state (name, disabled, updated_at)
        VALUES (@name, @disabled, @now)
        ON CONFLICT(name) DO UPDATE SET disabled = @disabled, updated_at = @now
      `),
      listDisabledPlugins: this.db.prepare(
        `SELECT name FROM plugins_state WHERE disabled = 1`,
      ),

      // settings
      getSetting: this.db.prepare(`SELECT value FROM settings WHERE key = ?`),
      setSetting: this.db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `),
    };
  }

  now() {
    return Date.now();
  }

  // ============ users ============
  ensureUser(jid, defaultLimit) {
    const now = this.now();
    this.q.upsertUser.run({ jid, limit_left: defaultLimit, now });
    return this.q.getUser.get(jid);
  }
  getUser(jid) {
    return this.q.getUser.get(jid);
  }
  getLimit(jid) {
    return this.q.getUser.get(jid)?.limit_left ?? 0;
  }
  setLimit(jid, value) {
    this.q.setLimit.run(value, jid);
  }
  addLimit(jid, value) {
    this.q.addLimit.run(value, jid);
  }
  consumeLimit(jid, amount) {
    const r = this.q.consumeLimit.run(amount, jid, amount);
    return r.changes > 0;
  }
  resetAllLimit(value) {
    this.q.resetAllLimit.run(value);
  }
  setPremium(jid, on, untilTs = null) {
    this.q.setPremium.run(on ? 1 : 0, untilTs, jid);
  }
  isPremium(jid) {
    const u = this.q.getUser.get(jid);
    if (!u || !u.premium) return false;
    if (u.premium_until && u.premium_until < this.now()) {
      this.setPremium(jid, false, null);
      return false;
    }
    return true;
  }
  setBanned(jid, on) {
    this.q.setBanned.run(on ? 1 : 0, jid);
  }
  isBanned(jid) {
    return !!this.q.getUser.get(jid)?.banned;
  }

  // ============ plugins state ============
  setPluginDisabled(name, disabled) {
    this.q.upsertPluginState.run({
      name,
      disabled: disabled ? 1 : 0,
      now: this.now(),
    });
  }
  isPluginDisabled(name) {
    return !!this.q.getPluginState.get(name)?.disabled;
  }
  listDisabledPlugins() {
    return this.q.listDisabledPlugins.all().map((r) => r.name);
  }

  // ============ settings ============
  get(key, defaultValue = null) {
    const r = this.q.getSetting.get(key);
    if (!r) return defaultValue;
    try {
      return JSON.parse(r.value);
    } catch {
      return r.value;
    }
  }
  set(key, value) {
    this.q.setSetting.run(key, JSON.stringify(value));
  }

  close() {
    this.db.close();
  }
}

// Singleton
export const db = new RyuuzaaDB();
export default db;

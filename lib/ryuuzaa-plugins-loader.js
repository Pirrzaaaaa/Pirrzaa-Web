// Ryuuzaa MD — plugin loader
//
// - Auto scan folder ./plugins (rekursif) dan import semua file .js
// - Setiap plugin export default object: { name, command, handler, ... }
// - Mendukung hot-reload: file baru/berubah/dihapus akan dimuat ulang otomatis
// - Lookup command dengan plugins.find(name)

import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} Plugin
 * @property {string}            [name]         Nama unik plugin (opsional, default: nama file)
 * @property {string|string[]}   command        Nama command utama
 * @property {string|string[]}   [alias]        Alias tambahan
 * @property {string}            [category]     Kategori untuk grouping menu (general/tools/fun/owner/...)
 * @property {string}            [description]  Deskripsi singkat
 * @property {string}            [usage]        Contoh penggunaan, mis. "<teks>"
 * @property {string}            [example]      Contoh lengkap, mis. ".echo halo"
 * @property {boolean}           [owner]        Khusus owner
 * @property {boolean}           [admin]        Khusus admin grup
 * @property {boolean}           [botAdmin]     Bot harus admin di grup
 * @property {boolean}           [group]        Hanya berjalan di grup
 * @property {boolean}           [private]      Hanya berjalan di private chat
 * @property {boolean}           [premium]      Khusus premium user
 * @property {boolean}           [register]     Wajib user terdaftar
 * @property {boolean}           [hidden]       Sembunyikan dari .menu
 * @property {boolean}           [disabled]     Nonaktifkan plugin
 * @property {boolean}           [nsfw]         Tandai konten dewasa
 * @property {number}            [limit]        Pengurangan limit user per pemakaian (default 0 = tidak pakai limit)
 * @property {number}            [cooldown]     Cooldown antar pemakaian per user (ms)
 * @property {number}            [energy]       Alias dari limit (kompat)
 * @property {string[]}          [tags]         Tag bebas
 * @property {(ctx: any) => any} handler        Fungsi handler utama
 */

export class PluginManager {
  constructor(pluginsDir) {
    this.pluginsDir = pluginsDir || path.resolve(__dirname, "..", "plugins");
    /** @type {Map<string, {file: string, mtimeMs: number, plugin: Plugin}>} */
    this.plugins = new Map(); // key: absolute file path
    /** @type {Map<string, string>} */
    this.commandIndex = new Map(); // command/alias name -> file path
    this._watcher = null;
  }

  // ========== util ==========
  async _walk(dir) {
    const out = [];
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (e) {
      if (e.code === "ENOENT") return out;
      throw e;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...(await this._walk(full)));
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        out.push(full);
      }
    }
    return out;
  }

  async _importFresh(file) {
    // bypass cache supaya hot-reload bisa
    const url = pathToFileURL(file).href + `?t=${Date.now()}`;
    const mod = await import(url);
    return mod.default || mod;
  }

  _collectCmds(plugin) {
    const cmds = []
      .concat(plugin.command || [])
      .concat(plugin.alias || [])
      .map((c) => String(c).toLowerCase().trim())
      .filter(Boolean);
    return [...new Set(cmds)];
  }

  _registerCommands(file, plugin) {
    if (!plugin || typeof plugin.handler !== "function") return;
    if (plugin.disabled) return;
    for (const c of this._collectCmds(plugin)) {
      this.commandIndex.set(c, file);
    }
  }

  _unregisterCommandsOf(file) {
    for (const [cmd, f] of this.commandIndex.entries()) {
      if (f === file) this.commandIndex.delete(cmd);
    }
  }

  _resolveName(file, plugin) {
    if (plugin?.name) return plugin.name;
    const rel = path.relative(this.pluginsDir, file);
    return rel.replace(/\\/g, "/").replace(/\.js$/, "");
  }

  // ========== load / reload ==========
  async loadAll() {
    this.plugins.clear();
    this.commandIndex.clear();

    const files = await this._walk(this.pluginsDir);
    let ok = 0;
    let fail = 0;
    let disabled = 0;

    for (const file of files) {
      try {
        const plugin = await this._importFresh(file);
        if (!plugin || typeof plugin.handler !== "function") {
          fail++;
          console.error(
            `[PLUGIN] Skip ${path.relative(this.pluginsDir, file)}: tidak ada handler`,
          );
          continue;
        }
        const stat = await fs.stat(file);
        plugin.name = this._resolveName(file, plugin);
        this.plugins.set(file, { file, mtimeMs: stat.mtimeMs, plugin });
        if (plugin.disabled) {
          disabled++;
        } else {
          this._registerCommands(file, plugin);
          ok++;
        }
      } catch (err) {
        fail++;
        console.error(
          `[PLUGIN] Gagal load ${path.relative(this.pluginsDir, file)}:`,
          err.message,
        );
      }
    }

    const totalCmd = this.commandIndex.size;
    console.log(
      `[PLUGIN] Loaded ${ok} plugin${ok !== 1 ? "s" : ""}` +
        `${disabled ? `, ${disabled} disabled` : ""}` +
        `${fail ? `, ${fail} gagal` : ""} (${totalCmd} command/alias)`,
    );
    return { ok, fail, disabled, totalCmd };
  }

  async reloadFile(file) {
    try {
      this._unregisterCommandsOf(file);
      const plugin = await this._importFresh(file);
      if (!plugin || typeof plugin.handler !== "function") return;
      const stat = await fs.stat(file);
      plugin.name = this._resolveName(file, plugin);
      this.plugins.set(file, { file, mtimeMs: stat.mtimeMs, plugin });
      if (!plugin.disabled) this._registerCommands(file, plugin);
      console.log(`[PLUGIN] Reload ${path.relative(this.pluginsDir, file)}`);
    } catch (err) {
      console.error(
        `[PLUGIN] Reload gagal ${path.relative(this.pluginsDir, file)}:`,
        err.message,
      );
    }
  }

  async unloadFile(file) {
    if (!this.plugins.has(file)) return;
    this._unregisterCommandsOf(file);
    this.plugins.delete(file);
    console.log(`[PLUGIN] Unload ${path.relative(this.pluginsDir, file)}`);
  }

  /**
   * Polling-based hot-reload (lebih konsisten antar OS daripada fs.watch).
   */
  watch(intervalMs = 1500) {
    if (this._watcher) return;
    const interval = setInterval(async () => {
      try {
        const files = new Set(await this._walk(this.pluginsDir));
        for (const file of [...this.plugins.keys()]) {
          if (!files.has(file)) await this.unloadFile(file);
        }
        for (const file of files) {
          try {
            const stat = await fs.stat(file);
            const cur = this.plugins.get(file);
            if (!cur || cur.mtimeMs !== stat.mtimeMs) {
              await this.reloadFile(file);
            }
          } catch {}
        }
      } catch (err) {
        console.error("[PLUGIN] Watcher error:", err.message);
      }
    }, intervalMs);

    this._watcher = { stop: () => clearInterval(interval) };
    console.log("[PLUGIN] Hot-reload aktif (folder ./plugins)");
  }

  stopWatch() {
    if (this._watcher?.stop) this._watcher.stop();
    this._watcher = null;
  }

  // ========== query ==========
  /**
   * Cari plugin berdasarkan nama command / alias (case-insensitive).
   */
  find(commandName) {
    if (!commandName) return null;
    const file = this.commandIndex.get(String(commandName).toLowerCase());
    if (!file) return null;
    return this.plugins.get(file)?.plugin || null;
  }

  /**
   * Semua plugin (termasuk disabled).
   */
  all() {
    return [...this.plugins.values()].map((v) => v.plugin);
  }

  /**
   * Plugin yang tidak hidden / disabled, dikelompokkan per kategori.
   */
  listByCategory() {
    /** @type {Record<string, Plugin[]>} */
    const groups = {};
    const seen = new Set();
    for (const { plugin } of this.plugins.values()) {
      if (!plugin || plugin.hidden || plugin.disabled) continue;
      if (seen.has(plugin)) continue;
      seen.add(plugin);
      const cat = (plugin.category || "lainnya").toLowerCase();
      groups[cat] = groups[cat] || [];
      groups[cat].push(plugin);
    }
    return groups;
  }

  /**
   * Statistik singkat.
   */
  stats() {
    const total = this.plugins.size;
    const disabled = [...this.plugins.values()].filter(
      (v) => v.plugin?.disabled,
    ).length;
    return {
      totalPlugins: total,
      activePlugins: total - disabled,
      disabledPlugins: disabled,
      totalCommands: this.commandIndex.size,
    };
  }
}

export default PluginManager;

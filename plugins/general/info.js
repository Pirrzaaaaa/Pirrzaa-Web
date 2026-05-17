// Plugin: info — System Performance Monitor
// Hasil: sock.sendMessage langsung dengan caption template literal
import os from "os";
import { performance } from "perf_hooks";
import { formatBytes, formatUptime } from "../../lib/ryuuzaa-helper.js";

function getDiskUsage() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    if (fs.statfsSync) {
      const stat = fs.statfsSync("/");
      const total = Number(stat.blocks) * Number(stat.bsize);
      const free = Number(stat.bavail) * Number(stat.bsize);
      const used = total - free;
      const usage = (used / total) * 100;
      return { total, free, used, usage };
    }
  } catch {}
  return null;
}

export default {
  name: "info",
  command: ["info"],
  alias: ["botinfo", "stat", "status", "spec"],
  category: "general",
  description:
    "System Performance Monitor (info bot, server, cpu, memory, dll)",
  usage: "",
  example: ".info",
  limit: 0,
  cooldown: 3000,

  async handler(ctx) {
    const { sock, m, config, plugins, db } = ctx;
    const t0 = performance.now();

    // ===== Roundtrip =====
    let waRoundtrip = 0;
    try {
      const tA = performance.now();
      await sock.sendPresenceUpdate?.("available");
      waRoundtrip = Math.max(1, Math.round(performance.now() - tA));
    } catch {
      waRoundtrip = 0;
    }

    const responseMs = waRoundtrip || 1;
    const pingEmoji =
      responseMs < 100 ? "🟢" : responseMs < 500 ? "🟡" : "🔴";
    const quality =
      responseMs < 100
        ? "FAST"
        : responseMs < 300
          ? "NORMAL"
          : responseMs < 800
            ? "SLOW"
            : "VERY SLOW";
    const healthPercent = Math.max(0, 100 - Math.min(100, responseMs / 5));
    const healthLabel =
      healthPercent >= 80
        ? `${Math.round(healthPercent)}% EXCELLENT`
        : healthPercent >= 60
          ? `${Math.round(healthPercent)}% GOOD`
          : healthPercent >= 40
            ? `${Math.round(healthPercent)}% FAIR`
            : healthPercent >= 20
              ? `${Math.round(healthPercent)}% POOR`
              : `${Math.round(healthPercent)}% CRITICAL`;

    // ===== Sistem =====
    const host = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const osLabel =
      platform === "linux"
        ? "🐧 Linux"
        : platform === "darwin"
          ? "🍎 macOS"
          : platform === "win32"
            ? "🪟 Windows"
            : `🖥️ ${platform}`;

    // ===== CPU =====
    const cpus = os.cpus();
    const cpuModelRaw = cpus[0]?.model?.trim() || "-";
    const cpuModel =
      cpuModelRaw.length > 38 ? cpuModelRaw.slice(0, 38) + "..." : cpuModelRaw;
    const cpuMhz = cpus[0]?.speed || 0;
    const tCpuStart = performance.now();
    const sample1 = cpus.map((c) => ({ ...c.times }));
    await new Promise((r) => setTimeout(r, 200));
    const sample2 = os.cpus().map((c) => ({ ...c.times }));
    let totalDiff = 0,
      idleDiff = 0;
    for (let i = 0; i < sample1.length; i++) {
      const a = sample1[i];
      const b = sample2[i];
      totalDiff +=
        b.user + b.nice + b.sys + b.idle + b.irq -
        (a.user + a.nice + a.sys + a.idle + a.irq);
      idleDiff += b.idle - a.idle;
    }
    const cpuLoad =
      totalDiff > 0
        ? Math.max(0, Math.min(100, 100 - (idleDiff / totalDiff) * 100))
        : 0;
    const cpuSampleMs = Math.round(performance.now() - tCpuStart);
    const loadAvg = os
      .loadavg()
      .map((n) => n.toFixed(2))
      .join(", ");

    // ===== Memory =====
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;
    const mu = process.memoryUsage();

    // ===== Storage =====
    const disk = getDiskUsage();

    // ===== Network =====
    const ifaces = os.networkInterfaces();
    const ifName =
      Object.keys(ifaces).find(
        (n) => n !== "lo" && ifaces[n]?.some((a) => !a.internal),
      ) || "lo";

    // ===== Database =====
    let users = 0,
      premium = 0;
    try {
      users = db.db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
      premium = db.db
        .prepare("SELECT COUNT(*) AS c FROM users WHERE premium = 1")
        .get().c;
    } catch {}
    let groupCount = "-";
    try {
      const all = await sock.groupFetchAllParticipating?.();
      if (all) groupCount = Object.keys(all).length;
    } catch {}

    // ===== Trace =====
    const totalExec = Math.round(performance.now() - t0);
    const handles =
      typeof process._getActiveHandles === "function"
        ? process._getActiveHandles().length
        : "-";
    const requests =
      typeof process._getActiveRequests === "function"
        ? process._getActiveRequests().length
        : 0;

    const stats = plugins.stats();
    const noteResp =
      responseMs < 100
        ? "Response sangat cepat"
        : responseMs < 500
          ? "Response normal"
          : "Response lambat";

    // Storage block (opsional)
    const storageBlock = disk
      ? `\n☁︎ *PERFORMA STORAGE* ☁︎
→ Disk: ${formatBytes(disk.used)} / ${formatBytes(disk.total)}
→ Free: ${formatBytes(disk.free)}
→ Usage: ${disk.usage.toFixed(1)}%
`
      : "";

    const text = `⚡ *System Performance Monitor*

☁︎ *INFORMASI BOT* ☁︎
→ Nama Bot: ${config.botFancyName || config.botName}
→ Status: Online
→ Response: ${responseMs}ms ${pingEmoji}
→ Kualitas: ${quality}
→ Health: ${healthLabel}
→ Runtime Bot: ${formatUptime(process.uptime())}
→ Runtime Server: ${formatUptime(os.uptime())}

☁︎ *INFORMASI SISTEM* ☁︎
→ Host: ${host}
→ OS: ${osLabel} (${arch})
→ Node.js: ${process.version}
→ V8 Engine: ${process.versions.v8}
→ PID: #${process.pid}

☁︎ *PERFORMA CPU* ☁︎
→ Model: ${cpuModel}
→ Core: ${cpus.length} Core @ ${cpuMhz}MHz
→ Load: ${cpuLoad.toFixed(1)}%
→ Load Avg: ${loadAvg}
→ Sample Time: ${cpuSampleMs}ms

☁︎ *PERFORMA MEMORY* ☁︎
→ RAM: ${formatBytes(usedMem)} / ${formatBytes(totalMem)}
→ Usage: ${memUsage.toFixed(1)}%
→ Heap: ${formatBytes(mu.heapUsed)} / ${formatBytes(mu.heapTotal)}
→ RSS: ${formatBytes(mu.rss)}
→ External: ${formatBytes(mu.external)}
${storageBlock}
☁︎ *INFORMASI NETWORK* ☁︎
→ Interface: ${ifName}
→ Download: -
→ Upload: -
→ Catatan: ${noteResp}

☁︎ *INFORMASI DATABASE* ☁︎
→ Users: ${users}
→ Premium: ${premium}
→ Groups: ${groupCount}
→ Plugins: ${stats.activePlugins}
→ Commands: ${stats.totalCommands}

☁︎ *TRACE EKSEKUSI* ☁︎
→ WA Roundtrip: ${waRoundtrip}ms
→ GC Pause: 0ms
→ Total Exec: ${totalExec}ms
→ Handles: ${handles}
→ Requests: ${requests}

☁︎ *CATATAN* ☁︎
→ Jika response tinggi, kemungkinan server sedang berat atau jaringan delay.
→ Jika fitur error atau bot tidak merespons, segera lapor admin/owner.
→ Gunakan command dengan bijak dan jangan spam request.

${config.captionFooter}`;

    await sock.sendMessage(m.from, { text });
  },
};

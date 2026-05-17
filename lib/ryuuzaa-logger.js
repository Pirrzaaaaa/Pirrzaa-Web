// Ryuuzaa MD — Logger berwarna (chalk + timestamp)

import chalk from "chalk";
import { config } from "../config.js";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

function ts() {
  const d = new Date();
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function shouldLog(level) {
  const cur = LEVELS[config.logLevel || "info"] ?? LEVELS.info;
  return LEVELS[level] >= cur;
}

function fmt(level, color, scope, args) {
  if (!shouldLog(level)) return null;
  const time = chalk.gray(ts());
  const tag = color(`[${level.toUpperCase()}]`);
  const sc = scope ? chalk.cyan(`[${scope}]`) : "";
  return [time, tag, sc, ...args].filter(Boolean);
}

class Logger {
  constructor(scope = "") {
    this.scope = scope;
  }
  child(scope) {
    return new Logger(this.scope ? `${this.scope}:${scope}` : scope);
  }
  debug(...args) {
    const a = fmt("debug", chalk.gray, this.scope, args);
    if (a) console.log(...a);
  }
  info(...args) {
    const a = fmt("info", chalk.blue, this.scope, args);
    if (a) console.log(...a);
  }
  success(...args) {
    const a = fmt("info", chalk.green, this.scope, args);
    if (a) console.log(...a);
  }
  warn(...args) {
    const a = fmt("warn", chalk.yellow, this.scope, args);
    if (a) console.warn(...a);
  }
  error(...args) {
    const a = fmt("error", chalk.red.bold, this.scope, args);
    if (a) console.error(...a);
  }
  // event-style logs
  msg(direction, jid, name, body) {
    if (!shouldLog("info") || !config.logMessage) return;
    const time = chalk.gray(ts());
    const arrow = direction === "in" ? chalk.green("←") : chalk.magenta("→");
    const who = chalk.cyan(`${name} (${jid})`);
    console.log(time, arrow, who, chalk.white(body || ""));
  }
}

export const logger = new Logger("ryuuzaa");
export default logger;

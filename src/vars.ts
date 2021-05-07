const fileLogger = require('log-to-file');

function getLogLvl() {
  let logLvl = process.env.LOG_LVL;
  if (!logLvl) return "BOT";

  if (LOG_LVLS.indexOf(logLvl) !== -1)
    return logLvl;
  else
    return "BOT";
}

export const TOKEN: string = process.env.TOKEN || "";
export const DEV_ID: string = process.env.DEV_ID || "226481854104993792";
// Global logging function (and related vars)
export const LOG_LVLS: string[] = ["INFO", "DEV", "BOT", "WARN", "ERROR"]
export const LOG_LVL: string = getLogLvl();
export function log(msg: string, lvl: string = "BOT") {
  let ind = LOG_LVLS.indexOf(lvl);
  if (ind == -1) {
    ind = 2;
  }
  if (ind < LOG_LVLS.indexOf(LOG_LVL))
    return;

  console.log(`[${lvl}] ${msg}`);
  fileLogger(`[${lvl}] ${msg}`, 'bot.log');
}
export function logAll(msgs: string[], lvl: string = "BOT") {
  let ind = LOG_LVLS.indexOf(lvl);
  if (ind == -1) {
    ind = 0;
    lvl = "BOT"
  }
  if (ind > LOG_LVLS.indexOf(LOG_LVL))
    return;

  msgs.forEach((msg) => {
    console.log(`[${lvl}] ${msg}`);
    fileLogger(`[${lvl}] ${msg}`, 'bot.log') 
  })
}
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
if (/^\/(storage\/emulated|sdcard|mnt\/sdcard)(\/|$)/.test(root)) {
  console.error("\n⛔ Android shared storage не поддерживает symlink для npm. Перенесите проект в ~/atlas-calculator внутри Termux.\n");
  process.exit(1);
}
const cli = join(root, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(cli)) {
  console.error("\nNext.js ещё не установлен. Выполните npm install из каталога проекта (не в /storage/emulated/0).\n");
  process.exit(1);
}
const flags = process.argv.slice(2);
if (process.platform === "android" && !flags.includes("--webpack")) {
  console.log("Android/Termux: запускаем Webpack вместо Turbopack (native bindings могут отсутствовать). ");
  flags.unshift("--webpack");
}
const child = spawn(process.execPath, [cli, "dev", "--hostname", "0.0.0.0", ...flags], {
  cwd: root, stdio: "inherit", env: process.env,
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));

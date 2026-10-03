import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const filename = path.resolve(".env");
let source = await readFile(filename, "utf8").catch(error => { if (error.code !== "ENOENT") throw error; return ""; });
const additions = [];
if (!/^PLOTTWIST_CONFIG_ENCRYPTION_KEY=.+$/m.test(source)) additions.push(`PLOTTWIST_CONFIG_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`);
if (!/^PLOTTWIST_CONFIG_DIRECTORY=.+$/m.test(source)) additions.push(`PLOTTWIST_CONFIG_DIRECTORY=${JSON.stringify(path.resolve(".plottwist", "connections"))}`);
source = source.replace(/^PLOTTWIST_CONFIG_ENCRYPTION_KEY=\s*$/m, "").replace(/^PLOTTWIST_CONFIG_DIRECTORY=\s*$/m, "");
await mkdir(path.resolve(".plottwist", "connections"), { recursive: true });
if (additions.length) await writeFile(filename, `${source.trimEnd()}\n${additions.join("\n")}\n`, { mode: 0o600 });
console.log("Personal-key storage is configured. Start the API, then add your own key in the extension settings.");

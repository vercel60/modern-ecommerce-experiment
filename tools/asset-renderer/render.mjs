// Renders every placeholder asset to public/assets using headless Chrome's GPU.
// usage: node render.mjs [filter] [--spp=24] [--scale=1] [--out=dir]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { jobs } from "./jobs.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const filter = args.find((a) => !a.startsWith("--"));
const spp = Number(opt("spp", 24));
const scale = Number(opt("scale", 1));
const out = path.resolve(opt("out", path.join(here, "../../public/assets")));
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(path.join(tmpdir(), "asset-render-"));
const sleep = (t) => new Promise((r) => setTimeout(r, t));

const chrome = spawn(process.env.CHROME ?? "google-chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  "--use-angle=vulkan", "--disable-gpu-watchdog", "about:blank",
], { stdio: "ignore" });
process.on("exit", () => chrome.kill());
let target;
for (let i = 0; i < 60 && !target; i++) {
  await sleep(400);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = {};
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id) pending[m.id](m); };
const send = (method, params) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => {
  const { result } = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? "eval failed");
  return result.result.value;
};

const sources = { figure: readFileSync(path.join(here, "figure.frag.glsl"), "utf8") };
const room = path.join(here, "room.frag.glsl");
if (existsSync(room)) sources.room = readFileSync(room, "utf8");
await evaluate(`window.SRC=${JSON.stringify(sources)};` + readFileSync(path.join(here, "page.js"), "utf8"));

for (const job of jobs) {
  if (filter && !job.name.includes(filter)) continue;
  const t = Date.now();
  const j = { ...job, w: Math.round(job.w * scale), h: Math.round(job.h * scale), spp: job.spp ?? spp };
  const b64 = await evaluate(`renderJob(${JSON.stringify(j)})`);
  const file = path.join(out, `${job.name}.webp`);
  mkdirSync(path.dirname(file), { recursive: true });
  const buf = Buffer.from(b64, "base64");
  writeFileSync(file, buf);
  console.log(`${job.name}  ${(buf.length / 1024).toFixed(0)}KB  ${((Date.now() - t) / 1000).toFixed(1)}s`);
}
chrome.kill(); await sleep(500);
rmSync(profile, { recursive: true, force: true });
process.exit();

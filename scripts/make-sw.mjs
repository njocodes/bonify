// Writes public/sw.js from the template with a per-build cache version.
import { readFileSync, writeFileSync } from "node:fs";

const build = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 8) || Date.now().toString(36);
const src = readFileSync(new URL("./sw.template.js", import.meta.url), "utf8");
writeFileSync(new URL("../public/sw.js", import.meta.url), src.replaceAll("__BUILD__", build));
console.log(`sw.js built for ${build}`);

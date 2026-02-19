#!/usr/bin/env node
/**
 * 生成 PWA 图标 icon-192.png 和 icon-512.png
 * 需要安装 sharp: npm install -D sharp
 * 运行: node scripts/generate-pwa-icons.mjs
 */
import { createRequire } from "module";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#0a0a0a"/>
  <rect x="96" y="96" width="320" height="320" rx="48" stroke="#00ff00" stroke-width="32" fill="none"/>
  <circle cx="256" cy="256" r="64" fill="#00ff00"/>
</svg>`;

try {
  const sharp = (await import("sharp")).default;
  const buf = Buffer.from(svg);
  for (const size of [192, 512]) {
    const out = await sharp(buf).resize(size, size).png().toBuffer();
    writeFileSync(join(publicDir, `icon-${size}.png`), out);
    console.log(`Created public/icon-${size}.png`);
  }
} catch (e) {
  console.error("需要安装 sharp: npm install -D sharp");
  console.error(e.message);
  process.exit(1);
}

// One-off generator for placeholder PWA icons (solid background + glyph block).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size) {
  const bg = [11, 15, 26];
  const fg = [90, 169, 255];
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  const m = Math.floor(size * 0.28);
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter type
    for (let x = 0; x < size; x++) {
      const inGlyph = x > m && x < size - m && y > m && y < size - m;
      const c = inGlyph ? fg : bg;
      raw[p++] = c[0];
      raw[p++] = c[1];
      raw[p++] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(new URL('../public/icons/', import.meta.url), { recursive: true });
for (const size of [192, 512]) {
  const out = new URL(`../public/icons/icon-${size}.png`, import.meta.url);
  writeFileSync(out, png(size));
  console.log('wrote', out.pathname);
}

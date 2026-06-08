/**
 * syncMoments.ts
 *
 * Build-time only script — run via `npm run sync` before `next build`.
 *
 * Pipeline per image:
 *   Notion HEIC/HEIF/JPG/PNG/URL
 * → download buffer
 *     → HEIC/HEIF? heic-convert → JPEG buffer
 *     → sharp → WebP
 *     → verify with metadata()
 *     → save to public/moments/{id}-{version}.webp
 *
 * No Python required —100% Node.js.
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync, unlinkSync, readdirSync, readFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public', 'moments');
const DATA_FILE = join(ROOT, 'data', 'moments.json');

// ─── Notion client ────────────────────────────────────────────────────────────

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? '';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** True if bytes 8-12 match a known HEIC/HEIF brand. */
function isHeicBrand(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const brand = buf.toString('ascii', 8, 12);
  return ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'avif'].some(
    (b) => brand === b
  );
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const protocol = url.startsWith('https') ? https : http;
  await new Promise<void>((resolve, reject) => {
    protocol.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
               return downloadBuffer(res.headers.location!).then(() => resolve()).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve());
      res.on('error', reject);
    }).on('error', reject);
  });
  return Buffer.concat(chunks);
}

async function toWebp(inputBuf: Buffer, outputPath: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sharp = require('sharp');

  let buf = inputBuf;

  if (isHeicBrand(inputBuf)) {
    // HEIC/HEIF → heic-convert → JPEG buffer → sharp → WebP
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const heicConvert = require('heic-convert');
    const jpegBuf = await heicConvert({
      buffer: inputBuf,
      format: 'JPEG',
      quality: 90,
    });
    buf = Buffer.from(jpegBuf);
  }

  await sharp(buf).webp({ quality: 82 }).toFile(outputPath);

  // Verify the output is a valid image
  const meta = await sharp(outputPath).metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`Invalid WebP generated: ${outputPath}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '✔ set' : '✗ MISSING');
  console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✔ set' : '✗ MISSING');

  // Clear old images before syncing — removes stale/bad files
  try {
    const old = readdirSync(PUBLIC_DIR);
    for (const f of old) {
      unlinkSync(join(PUBLIC_DIR, f));
    }
    console.log(`Cleared ${old.length} old files from public/moments`);
  } catch {
    // directory empty or missing — fine
  }

  mkdirSync(PUBLIC_DIR, { recursive: true });
  mkdirSync(dirname(DATA_FILE), { recursive: true });

  console.log('Fetching moments from Notion…');
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: 'published', checkbox: { equals: true } },
    sorts: [{ property: 'date', direction: 'descending' }],
    page_size: 100,
  });

  const moments: {
    id: string;
    caption: string;
    date: string;
    image?: string;
    placeholderBg?: string;
    placeholderIcon?: string;
  }[] = [];

  const PLACEHOLDER_ICON_MAP: Record<number, string> = {
    0: 'coffee', 1: 'mountain', 2: 'headphones', 3: 'book', 4: 'camera',
    5: 'soup', 6: 'flower', 7: 'bike', 8: 'feather', 9: 'home',
  };
  const PLACEHOLDER_BG_MAP: Record<number, string> = {
    0: 'rgba(239, 159, 39, 0.18)', 1: 'rgba(29, 158, 117, 0.18)',
    2: 'rgba(127, 119, 221, 0.18)', 3: 'rgba(56, 138, 221, 0.18)',
    4: 'rgba(136, 135, 128, 0.20)', 5: 'rgba(216, 90, 48, 0.18)',
    6: 'rgba(212, 83, 126, 0.16)', 7: 'rgba(15, 142, 158, 0.18)',
    8: 'rgba(239, 159, 39, 0.15)', 9: 'rgba(56, 138, 221, 0.13)',
  };

  const downloadPromises: Promise<void>[] = [];

  for (const page of response.results) {
    const p = page as any;
    const props = p.properties;

    const captionRaw = props.caption?.title?.[0]?.plain_text ?? '';
    const dateRaw = props.date?.date?.start ?? '';
    const imageFiles = props.image?.files;
    const imageUrl =
      imageFiles?.[0]?.type === 'external'
        ? imageFiles[0].external?.url
        : imageFiles?.[0]?.type === 'file'
        ? imageFiles[0].file?.url
        : undefined;

    const moment: typeof moments[0] = {
      id: p.id,
      caption: captionRaw,
      date: dateRaw,
    };

    if (imageUrl) {
      // Versioned filename — URL changes when Notion content updates
      const version = (p.last_edited_time ?? Date.now())
        .replaceAll('-', '')
        .replaceAll(':', '')
        .replaceAll('.', '');
      const localFile = `${p.id}-${version}.webp`;
      const localPath = join(PUBLIC_DIR, localFile);

      downloadPromises.push(
        (async () => {
          console.log(`  Download: ${captionRaw.slice(0, 40)}…`);
          const buf = await downloadBuffer(imageUrl);
          await toWebp(buf, localPath);
          moment.image = `/moments/${localFile}`;
        })()
      );
    } else {
      const idx = moments.length % 10;
      moment.placeholderIcon = PLACEHOLDER_ICON_MAP[idx];
      moment.placeholderBg = PLACEHOLDER_BG_MAP[idx];
    }

    moments.push(moment);
  }

  await Promise.all(downloadPromises);

  writeFileSync(DATA_FILE, JSON.stringify(moments, null, 2));
  console.log(`Done! ${moments.length} moments → data/moments.json`);
}

main().catch((err) => {
  console.error('syncMoments failed:', err);
  process.exit(1);
});
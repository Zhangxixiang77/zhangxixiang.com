/**
 * syncMoments.ts
 *
 * Build-time only script (run via `npm run sync` before `next build`).
 * Downloads all moment images from Notion, converts them to WebP,
 * and writes a static moments.json that the app reads at runtime.
 *
 * No Notion API calls happen during `next build` / `next start`.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { writeFileSync, mkdirSync, createWriteStream, unlinkSync, copyFileSync } from 'fs';
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

// ─── HTTP download helper ─────────────────────────────────────────────────────

async function downloadFile(url: string, dest: string): Promise<void> {
  mkdirSync(dirname(dest), { recursive: true });
  const file = createWriteStream(dest);
  const protocol = url.startsWith('https') ? https : http;
  await new Promise<void>((resolve, reject) => {
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location!, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      pipeline(res, file).then(() => resolve()).catch(reject);
    }).on('error', reject);
  });
}

// ─── Image conversion ──────────────────────────────────────────────────────────

async function toWebp(inputPath: string, outputPath: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sharp = require('sharp');

  try {
    await sharp(inputPath).webp({ quality: 82 }).toFile(outputPath);
  } catch {
    // sharp can't decode HEIC — use Python pillow-heif to convert via PIL
    const { execSync } = require('child_process');
    const pngPath = inputPath + '.png';
    try {
      // Use a Python script file to avoid shell escaping issues on Windows
      const pythonScript = [
        'from PIL import Image',
        'import pillow_heif',
        'pillow_heif.register_heif_opener()',
        `img = Image.open(r'${inputPath}')`,
        `img.save(r'${pngPath}')`,
      ].join('; ');
      execSync(`python -c "${pythonScript}"`, { stdio: 'pipe' });
      await sharp(pngPath).webp({ quality: 82 }).toFile(outputPath);
    } catch (err) {
      // Fallback: just copy the file
      copyFileSync(inputPath, outputPath);
    } finally {
      try { unlinkSync(pngPath); } catch { /* ignore */ }
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '✔ set' : '✗ MISSING');
  console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✔ set' : '✗ MISSING');
  console.log('Fetching moments from Notion…');
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { property: 'published', checkbox: { equals: true } },
    sorts: [{ property: 'date', direction: 'descending' }],
    page_size: 100,
  });

  mkdirSync(PUBLIC_DIR, { recursive: true });
  mkdirSync(dirname(DATA_FILE), { recursive: true });

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
      const localFile = `${p.id}.webp`;
      const localPath = join(PUBLIC_DIR, localFile);
      const tmpPath = join(PUBLIC_DIR, `${p.id}_tmp`);

      downloadPromises.push(
        (async () => {
          console.log(`  Download: ${captionRaw.slice(0, 40)}…`);
          try {
            await downloadFile(imageUrl, tmpPath);
            await toWebp(tmpPath, localPath);
            unlinkSync(tmpPath);
            moment.image = `/moments/${localFile}`;
          } catch (err) {
            console.warn(`  Failed: "${captionRaw.slice(0, 30)}":`, err);
            try { unlinkSync(tmpPath); } catch { /* ignore */ }
          }
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
  console.log(`Done! ${moments.length} moments -> data/moments.json`);
}

main().catch((err) => {
  console.error('syncMoments failed:', err);
  process.exit(1);
});
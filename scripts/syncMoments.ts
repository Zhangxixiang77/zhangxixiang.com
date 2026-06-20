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
 * No Python required — 100% Node.js.
 *
 * Resilience:
 *   - Notion query and image downloads are retried with exponential backoff.
 *   - A single failed image falls back to a placeholder instead of killing the build.
 *   - If Notion is completely unreachable but a previous sync exists,
 *     the build continues with the last good data/moments.json.
 */

import 'dotenv/config';
import {
  writeFileSync,
  mkdirSync,
  unlinkSync,
  readdirSync,
  existsSync,
} from 'fs';
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
// timeoutMs gives each request a hard ceiling instead of hanging forever.
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  timeoutMs: 60_000,
});
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? '';

// ─── Retry helper ───────────────────────────────────────────────────────────────

/** Decide whether an error is worth retrying (transient) vs. fatal (e.g. auth). */
function isRetryable(err: unknown): boolean {
  const e = err as any;
  // Notion APIResponseError carries a numeric `status`.
  if (typeof e?.status === 'number') {
    return e.status === 429 || e.status >= 500; // rate-limited or server error
  }
  // Network / stream level errors — this is where "Premature close" lands.
  const msg = `${e?.code ?? ''} ${e?.message ?? ''}`;
  return /premature close|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|network|fetch failed|aborted|timeout/i.test(
    msg
  );
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  { retries = 4, baseDelayMs = 800 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isRetryable(err)) break;
      const delay = baseDelayMs * 2 ** (attempt - 1); // 0.8s, 1.6s, 3.2s…
      console.warn(
        `  ↻ ${label} failed (attempt ${attempt}/${retries}): ${(err as Error).message}. Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** True if bytes 8-12 match a known HEIC/HEIF brand. */
function isHeicBrand(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const brand = buf.toString('ascii', 8, 12);
  return ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'avif'].some(
    (b) => brand === b
  );
}

/**
 * Download a URL into a Buffer.
 * Fixes the original redirect bug: the buffer from a redirected response is
 * now actually returned (previously it was discarded, yielding an empty image).
 * Adds a per-request timeout and drains skipped responses to avoid leaks.
 */
function downloadBuffer(url: string, redirectsLeft = 5): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      const status = res.statusCode ?? 0;

      // Follow redirects — and actually return the resulting buffer.
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume(); // drain the redirect response
        if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
        const next = new URL(res.headers.location, url).toString();
        return resolve(downloadBuffer(next, redirectsLeft - 1));
      }

      if (status !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${status}`));
      }

      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(30_000, () => req.destroy(new Error('Download timeout')));
  });
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

type Moment = {
  id: string;
  caption: string;
  date: string;
  image?: string;
  placeholderBg?: string;
  placeholderIcon?: string;
};

function applyPlaceholder(moment: Moment, index: number) {
  moment.placeholderIcon = PLACEHOLDER_ICON_MAP[index % 10];
  moment.placeholderBg = PLACEHOLDER_BG_MAP[index % 10];
}

async function main() {
  console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '✔ set' : '✗ MISSING');
  console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✔ set' : '✗ MISSING');

  // Fetch FIRST (with retry). If this throws, we exit before touching any files,
  // so the previous build's images and data stay intact for the fallback path.
  console.log('Fetching moments from Notion…');
  const response = await withRetry('Notion query', () =>
    notion.databases.query({
      database_id: DATABASE_ID,
      filter: { property: 'published', checkbox: { equals: true } },
      sorts: [{ property: 'date', direction: 'descending' }],
      page_size: 100,
    })
  );

  // Only now that we have fresh data do we clear the old images.
  mkdirSync(PUBLIC_DIR, { recursive: true });
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  try {
    const old = readdirSync(PUBLIC_DIR);
    for (const f of old) unlinkSync(join(PUBLIC_DIR, f));
    console.log(`Cleared ${old.length} old files from public/moments`);
  } catch {
    // directory empty or missing — fine
  }

  const moments: Moment[] = [];
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

    const moment: Moment = { id: p.id, caption: captionRaw, date: dateRaw };
    moments.push(moment);
    const momentIndex = moments.length - 1;

    if (imageUrl) {
      const version = (p.last_edited_time ?? Date.now())
        .toString()
        .replaceAll('-', '')
        .replaceAll(':', '')
        .replaceAll('.', '');
      const localFile = `${p.id}-${version}.webp`;
      const localPath = join(PUBLIC_DIR, localFile);

      downloadPromises.push(
        (async () => {
          console.log(`  Download: ${captionRaw.slice(0, 40)}…`);
          try {
            const buf = await withRetry(`image "${captionRaw.slice(0, 20)}"`, () =>
              downloadBuffer(imageUrl)
            );
            await toWebp(buf, localPath);
            moment.image = `/moments/${localFile}`;
          } catch (err) {
            // One bad image must not fail the whole build — degrade gracefully.
            console.warn(
              `  ⚠ image failed for "${captionRaw.slice(0, 20)}", using placeholder: ${(err as Error).message}`
            );
            applyPlaceholder(moment, momentIndex);
          }
        })()
      );
    } else {
      applyPlaceholder(moment, momentIndex);
    }
  }

  // Each promise handles its own errors, so this never rejects.
  await Promise.all(downloadPromises);

  writeFileSync(DATA_FILE, JSON.stringify(moments, null, 2));
  console.log(`Done! ${moments.length} moments → data/moments.json`);
}

main().catch((err) => {
  console.error('syncMoments failed:', err);

  // Graceful degradation: if a previous successful sync exists, let the build
  // continue with the last good data instead of failing the deployment.
  if (existsSync(DATA_FILE)) {
    console.warn('⚠ Notion sync failed — building with the previous data/moments.json.');
    process.exit(0);
  }

  // No prior data to fall back on — a hard failure is the honest outcome here.
  process.exit(1);
});

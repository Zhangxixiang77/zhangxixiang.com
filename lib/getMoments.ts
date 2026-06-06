/**
 * Moments — data source.
 *
 * Fetches from Notion database. The returned shape matches what
 * MomentsGrid and MomentsArchive expect, so no downstream changes needed.
 */

import { Client } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type Moment = {
  id: string;
  caption: string;
  date: string;
  image?: string;
  placeholderBg?: string;
  placeholderIcon?: string;
};

// Singleton Notion client — created once per serverless cold-start.
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? '';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Extract the first file/image URL from a Notion files property. */
function extractFileUrl(files: any): string | undefined {
  if (!files || !Array.isArray(files)) return undefined;
  const first = files[0];
  if (!first) return undefined;
  // Notion returns { type: "file", file: { url: "..." } } or external.
  if (first.type === 'external') return first.external?.url;
  if (first.type === 'file') return first.file?.url;
  return undefined;
}

/** Fallback icon when no image is present. */
const PLACEHOLDER_ICON_MAP: Record<number, string> = {
  0: 'coffee',
  1: 'mountain',
  2: 'headphones',
  3: 'book',
  4: 'camera',
  5: 'soup',
  6: 'flower',
  7: 'bike',
  8: 'feather',
  9: 'home',
};

const PLACEHOLDER_BG_MAP: Record<number, string> = {
  0: 'rgba(239, 159, 39, 0.18)',
  1: 'rgba(29, 158, 117, 0.18)',
  2: 'rgba(127, 119, 221, 0.18)',
  3: 'rgba(56, 138, 221, 0.18)',
  4: 'rgba(136, 135, 128, 0.20)',
  5: 'rgba(216, 90, 48, 0.18)',
  6: 'rgba(212, 83, 126, 0.16)',
  7: 'rgba(15, 142, 158, 0.18)',
  8: 'rgba(239, 159, 39, 0.15)',
  9: 'rgba(56, 138, 221, 0.13)',
};

/** Fetch image URL from the page body blocks (first image found). */
async function fetchCoverImage(pageId: string): Promise<string | undefined> {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 50,
    });
    for (const block of blocks.results as BlockObjectResponse[]) {
      if (block.type === 'image') {
        const img = (block as any).image;
        if (img.type === 'external') return img.external?.url;
        if (img.type === 'file') return img.file?.url;
      }
    }
  } catch {
    // No blocks or no image — fine.
  }
  return undefined;
}

// ─── main fetch ────────────────────────────────────────────────────────────

/** Retry a function up to N times on failure. */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError;
}

/**
 * Returns all published moments, newest-first.
 */
export async function getMoments(): Promise<Moment[]> {
  const response = await withRetry(() =>
    notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'published',
        checkbox: { equals: true },
      },
      sorts: [{ property: 'date', direction: 'descending' }],
      page_size: 100,
    }),
  );

  const moments: Moment[] = [];

  for (const page of response.results) {
    const p = page as any;
    const props = p.properties;

    const captionRaw = props.caption?.title?.[0]?.plain_text ?? '';
    const dateRaw = props.date?.date?.start ?? '';
    const imageFiles = props.image?.files;

    const imageUrl = extractFileUrl(imageFiles) ?? (await fetchCoverImage(p.id));

    const moment: Moment = {
      id: p.id,
      caption: captionRaw,
      date: dateRaw,
      image: imageUrl,
    };

    // Assign placeholder style only when there's no real image.
    if (!imageUrl) {
      const idx = moments.length % 10;
      moment.placeholderIcon = PLACEHOLDER_ICON_MAP[idx];
      moment.placeholderBg = PLACEHOLDER_BG_MAP[idx];
    }

    moments.push(moment);
  }

  return moments;
}

/** Latest N moments (for the home page grid). */
export async function getRecentMoments(n = 6): Promise<Moment[]> {
  const all = await getMoments();
  return all.slice(0, n);
}

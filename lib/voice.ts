/**
 * Microcopy lives here so the site's "voice" is unified
 * and easy to tune in one place.
 *
 * Rules:
 * - lowercase like notes (for prose voice)
 * - proper case for proper nouns (names, brands, abbreviations)
 * - playful + self-aware + not corny
 */

export const voice = {
  // Section labels
  sections: {
    about: 'about',
    moments: 'moments',
  },

  // Hints + tiny captions
  hints: {
    seeAllMoments: 'see all',
  },

  // Footer
  footer: {
    signature: 'still under construction (probably forever) · zhangxixiang.com',
  },

  // Empty states
  empty: {
    moments: 'nothing yet · come back later',
  },
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

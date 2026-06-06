import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { getMoments } from '@/lib/getMoments';
import { formatDateShort } from '@/lib/voice';
import MomentsArchive from '@/components/MomentsArchive';

export const revalidate = 60;

export default async function MomentsPage() {
  const all = await getMoments();

  // Group by month
  const groups = new Map<string, typeof all>();
  for (const m of all) {
    const d = new Date(m.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const sortedKeys = Array.from(groups.keys()).sort().reverse();

  const monthLabels: Record<string, string> = {
    '01': 'jan', '02': 'feb', '03': 'mar', '04': 'apr',
    '05': 'may', '06': 'jun', '07': 'jul', '08': 'aug',
    '09': 'sep', '10': 'oct', '11': 'nov', '12': 'dec',
  };

  return (
    <main className="mx-auto max-w-[680px] px-5 pb-10">
      <div className="pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] tracking-[0.05em] text-ink-soft transition-colors hover:text-ink"
        >
          <IconArrowLeft size={14} stroke={1.5} />
          back home
        </Link>
        <h1 className="mt-6 font-serif text-[28px] tracking-[0.1em] text-ink">
          moments
        </h1>
        <p className="mt-1 text-[12px] italic tracking-[0.05em] text-ink-faint">
          everything · {all.length} so far
        </p>
      </div>

      <MomentsArchive
        groups={sortedKeys.map((key) => {
          const [y, m] = key.split('-');
          return {
            key,
            label: `${monthLabels[m]} ${y}`,
            moments: groups.get(key)!,
          };
        })}
      />
    </main>
  );
}

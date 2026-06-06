'use client';

import { useState } from 'react';
import {
  IconSchool,
  IconMapPin,
  IconMessageQuestion,
  IconHeart,
} from '@tabler/icons-react';
import Modal from './Modal';

import education from '@/content/education.json';
import places from '@/content/places.json';
import qa from '@/content/qa.json';
import likes from '@/content/likes.json';

type CardKey = 'education' | 'places' | 'qa' | 'likes';

type CardDef = {
  key: CardKey;
  label: string;
  meta: string;
  Icon: React.ComponentType<{ size?: number; stroke?: number }>;
};

const CARDS: CardDef[] = [
  {
    key: 'education',
    label: 'education',
    meta: `${education.items.length}\nstops`,
    Icon: IconSchool,
  },
  {
    key: 'places',
    label: 'places lived',
    meta: `${places.items.length}\ncities`,
    Icon: IconMapPin,
  },
  {
    key: 'qa',
    label: 'Q&A with myself',
    meta: `${qa.items.length}\nquestions`,
    Icon: IconMessageQuestion,
  },
  {
    key: 'likes',
    label: 'likes',
    meta: `${likes.items.length}\nthings`,
    Icon: IconHeart,
  },
];

function EducationBody() {
  return (
    <ul className="space-y-3">
      {education.items.map((it, i) => (
        <li
          key={i}
          className="grid grid-cols-[110px_1fr] gap-3 border-b border-hairline pb-2 last:border-0 last:pb-0"
        >
          <span className="text-[11px] tracking-[0.08em] text-ink-faint">
            {it.year}
          </span>
          <div>
            <div className="text-[13px] text-ink">{it.name}</div>
            <div className="text-[11.5px] text-ink-soft">
              {it.place} · {it.note}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlacesBody() {
  return (
    <ul className="space-y-3">
      {places.items.map((it, i) => (
        <li
          key={i}
          className="grid grid-cols-[110px_1fr] gap-3 border-b border-hairline pb-2 last:border-0 last:pb-0"
        >
          <span className="text-[11px] tracking-[0.08em] text-ink-faint">
            {it.years}
          </span>
          <div>
            <div className="text-[13px] text-ink">{it.city}</div>
            {it.note && (
              <div className="text-[11.5px] italic text-ink-soft">{it.note}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function QaBody() {
  return (
    <ul className="space-y-4">
      {qa.items.map((it, i) => {
        const item = it as {
          q: string;
          a: string;
          linkLabel?: string;
          linkHref?: string;
        };
        return (
          <li
            key={i}
            className="border-b border-hairline pb-3 last:border-0 last:pb-0"
          >
            <p className="text-[12px] italic tracking-[0.02em] text-ink-soft">
              {item.q}
            </p>
            <p className="mt-1 text-[13px] text-ink">
              {item.a}
              {item.linkLabel && item.linkHref && (
                <>
                  {' '}
                  <a
                    href={item.linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 border-b border-ink-faint transition-colors hover:border-ink"
                  >
                    {item.linkLabel}
                  </a>
                </>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function LikesBody() {
  return (
    <ul className="grid grid-cols-1 gap-y-1.5">
      {likes.items.map((it, i) => {
        const item = it as { kind: string; value: string; hex?: string };
        return (
          <li
            key={i}
            className="grid grid-cols-[90px_1fr] gap-3 border-b border-hairline py-1.5 last:border-0"
          >
            <span className="text-[11px] tracking-[0.08em] text-ink-faint">
              {item.kind}
            </span>
            <span className="flex items-center gap-2 text-[13px] text-ink">
              {item.hex && (
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-sm border border-hairline"
                  style={{ background: item.hex }}
                  aria-hidden="true"
                />
              )}
              <span>
                {item.value}
                {item.hex && (
                  <span className="ml-2 font-mono text-[11px] tracking-[0.03em] text-ink-faint">
                    {item.hex}
                  </span>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const BODIES: Record<CardKey, React.ReactNode> = {
  education: <EducationBody />,
  places: <PlacesBody />,
  qa: <QaBody />,
  likes: <LikesBody />,
};

const TITLES: Record<CardKey, { kicker: string; title: string }> = {
  education: { kicker: 'about', title: education.title },
  places: { kicker: 'about', title: places.title },
  qa: { kicker: 'about', title: qa.title },
  likes: { kicker: 'about', title: likes.title },
};

export default function AboutCards() {
  const [open, setOpen] = useState<CardKey | null>(null);

  return (
    <>
      <div className="mx-auto grid max-w-[480px] grid-cols-1 gap-2 sm:grid-cols-2">
        {CARDS.map(({ key, label, meta, Icon }) => (
          <button
            key={key}
            onClick={() => setOpen(key)}
            className="flex items-center gap-2.5 rounded-md border border-hairline bg-paper px-4 py-3.5 text-left transition-colors hover:border-ink-faint focus:outline-none focus-visible:border-ink"
          >
            <Icon size={16} stroke={1.5} />
            <span className="flex-1 text-center text-[13px] tracking-[0.02em] text-ink">
              {label}
            </span>
            <span className="whitespace-pre-line text-center text-[10.5px] tracking-[0.05em] text-ink-faint">
              {meta}
            </span>
          </button>
        ))}
      </div>

      {open && (
        <Modal
          open={open !== null}
          onClose={() => setOpen(null)}
          kicker={TITLES[open].kicker}
          title={TITLES[open].title}
          maxWidth={460}
        >
          {BODIES[open]}
        </Modal>
      )}
    </>
  );
}

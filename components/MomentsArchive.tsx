'use client';

import { useState } from 'react';
import {
  IconCoffee,
  IconMountain,
  IconHeadphones,
  IconBook,
  IconCamera,
  IconSoup,
  IconFlower,
  IconBike,
  IconFeather,
  IconHome,
  IconTool,
  IconSnowflake,
  IconList,
} from '@tabler/icons-react';
import Modal from './Modal';
import { formatDateShort, formatDate } from '@/lib/voice';
import type { Moment } from '@/lib/getMoments';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; stroke?: number }>> = {
  coffee: IconCoffee,
  mountain: IconMountain,
  headphones: IconHeadphones,
  book: IconBook,
  camera: IconCamera,
  soup: IconSoup,
  flower: IconFlower,
  bike: IconBike,
  feather: IconFeather,
  home: IconHome,
  tool: IconTool,
  snowflake: IconSnowflake,
  list: IconList,
};

function PlaceholderIcon({
  name,
  size = 28,
}: {
  name?: string;
  size?: number;
}) {
  const Icon = (name && ICON_MAP[name]) || IconCamera;
  return <Icon size={size} stroke={1.4} />;
}

type Group = {
  key: string;
  label: string;
  moments: Moment[];
};

type Props = {
  groups: Group[];
};

export default function MomentsArchive({ groups }: Props) {
  const [open, setOpen] = useState<Moment | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <div className="mt-10 space-y-12">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              {g.label}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {g.moments.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setOpen(m)}
                  className="group relative aspect-square overflow-hidden rounded-md bg-cover bg-center p-2 transition-opacity hover:opacity-90"
                  style={m.image
                    ? { backgroundImage: `url(${m.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: m.placeholderBg ?? 'rgb(var(--paper-soft))' }
                  }
                  aria-label={m.caption}
                >
                  <span className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink/55">
                    <PlaceholderIcon name={m.placeholderIcon} />
                  </span>
                  <span className="absolute bottom-2 left-2.5 text-[10px] tracking-[0.05em] text-white/80">
                    {formatDateShort(m.date)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && (
        <Modal
          open={true}
          onClose={() => setOpen(null)}
          kicker="moment"
          title={formatDate(open.date)}
          maxWidth={360}
        >
          <div className="flex gap-3">
            {open.image ? (
              <button
                onClick={() => open.image && setLightbox(open.image)}
                className="flex h-[64px] w-[64px] flex-shrink-0 overflow-hidden rounded-md"
                aria-label="view full image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={open.image}
                  alt={open.caption}
                  className="h-full w-full object-cover transition-opacity hover:opacity-85"
                />
              </button>
            ) : (
              <div
                className="flex h-[64px] w-[64px] flex-shrink-0 items-center justify-center rounded-md"
                style={{ background: open.placeholderBg ?? 'rgb(var(--paper-soft))' }}
              >
                <span className="text-ink/55">
                  <PlaceholderIcon name={open.placeholderIcon} />
                </span>
              </div>
            )}
            <p className="flex-1 self-center text-[13.5px] leading-relaxed text-ink">
              {open.caption}
            </p>
          </div>
        </Modal>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-5"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 text-white/70 hover:text-white"
            aria-label="close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

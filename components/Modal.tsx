'use client';

import { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** A small uppercase label above the title (e.g. "the night of week 18") */
  kicker?: string;
  /** Larger serif title (e.g. a date or a card name) */
  title?: string;
  /** Optional footnote in the modal foot */
  footnote?: string;
  /** Max width override for the modal box */
  maxWidth?: number;
};

export default function Modal({
  open,
  onClose,
  children,
  kicker,
  title,
  footnote,
  maxWidth = 380,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 bg-paper/82 backdrop-blur-[2px]"
      />
      <div
        className="relative w-full animate-fadeup rounded-xl border border-hairline bg-paper-soft p-6 shadow-none"
        style={{ maxWidth }}
      >
        <button
          onClick={onClose}
          aria-label="close"
          className="absolute right-3 top-3 inline-flex p-1 text-ink-faint transition-colors hover:text-ink"
        >
          <IconX size={16} stroke={1.5} />
        </button>

        {kicker && (
          <p className="m-0 mb-1.5 text-[10px] uppercase tracking-[0.15em] text-ink-faint">
            {kicker}
          </p>
        )}
        {title && (
          <h3 className="m-0 mb-4 font-serif text-[18px] tracking-[0.04em] text-ink">
            {title}
          </h3>
        )}

        <div className="text-[13.5px] leading-relaxed text-ink">{children}</div>

        {footnote && (
          <p className="mt-5 border-t border-hairline pt-3 text-center text-[10px] italic tracking-[0.05em] text-ink-faint">
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}

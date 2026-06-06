import Image from 'next/image';

/**
 * Profile avatar — 208px circular crop of the illustration.
 *
 * To swap the photo:
 *   1. Replace `/public/avatar.png` with a new file (same name) or
 *   2. Update the `src` below and put the file in `/public/`.
 */
export default function Avatar() {
  return (
    <div className="mx-auto mb-10 h-52 w-52 overflow-hidden rounded-full border border-hairline bg-paper-soft">
      <Image
        src="/avatar.png"
        alt="Zhang Xixiang"
        width={512}
        height={512}
        priority
        className="h-full w-full object-cover"
      />
    </div>
  );
}

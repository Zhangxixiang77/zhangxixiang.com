type Props = {
  label: string;
};

export default function SectionHeader({ label }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] tracking-[0.2em] text-ink-faint">
        {label}
      </span>
      <span className="hdr-line" />
    </div>
  );
}

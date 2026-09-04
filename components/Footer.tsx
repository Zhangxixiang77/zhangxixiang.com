import { IconMail, IconBrandGithub } from '@tabler/icons-react';
import { voice } from '@/lib/voice';

const LINKS = [
  {
    href: 'https://github.com/Zhangxixiang77',
    label: 'GitHub',
    Icon: IconBrandGithub,
    external: true,
  },
  {
    href: 'mailto:52300936020@stu.ecnu.edu.cn',
    label: 'Email',
    Icon: IconMail,
    external: false, // mailto opens email client, no new tab needed
  },
];

export default function Footer() {
  return (
    <footer className="mx-auto mt-20 max-w-[640px] border-t border-hairline pt-7 text-center">
      <div className="flex flex-wrap justify-center gap-7 text-[14px]">
        {LINKS.map(({ href, label, Icon, external }) => (
          <a
            key={label}
            href={href}
            {...(external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className="group inline-flex items-center gap-1.5 rounded-sm px-1 py-0.5 text-ink-soft transition-colors hover:text-ink focus:outline-none focus-visible:text-ink"
          >
            <Icon
              size={15}
              stroke={1.5}
              className="transition-transform group-hover:-translate-y-px"
            />
            <span className="border-b border-transparent transition-colors group-hover:border-ink group-focus-visible:border-ink">
              {label}
            </span>
          </a>
        ))}
      </div>
      <p className="mt-7 text-[13px] italic tracking-[0.05em] text-ink-faint opacity-75">
        {voice.footer.signature}
      </p>
    </footer>
  );
}

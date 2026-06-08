import Hero from '@/components/Hero';
import Avatar from '@/components/Avatar';
import AboutCards from '@/components/AboutCards';
import MomentsGrid from '@/components/MomentsGrid';
import Footer from '@/components/Footer';
import SectionHeader from '@/components/SectionHeader';
import { getRecentMoments, getMoments } from '@/lib/getMoments';
import { voice } from '@/lib/voice';

// Static — regenerated at build time via `npm run sync`
export const revalidate = false;

export default async function Home() {
  const [recent, all] = await Promise.all([getRecentMoments(9), getMoments()]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      <Hero />

      <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-16 md:mt-16 md:grid-cols-[5fr_7fr]">
        <section>
          <Avatar />
          <SectionHeader label={voice.sections.about} />
          <div className="mt-7">
            <AboutCards />
          </div>
        </section>

        <section>
          <SectionHeader label={voice.sections.moments} />
          <div className="mt-7">
            <MomentsGrid moments={recent} totalCount={all.length} />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

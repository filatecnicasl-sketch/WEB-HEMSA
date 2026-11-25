import { PageHero } from "@/components/site/PageHero";
import { Card } from "@/components/site/Blocks";
import { LEGAL_PAGES } from "@/data/legal";

const Block = ({ b }) => (
  <div className="mt-10 first:mt-0">
    <h2 className="text-xl font-bold text-[var(--hemsa-ink)]">{b.h}</h2>
    {b.p?.map((t) => <p key={t.slice(0, 40)} className="mt-3 text-[var(--hemsa-grey)] leading-relaxed">{t}</p>)}
    {b.list && <ul className="mt-3 space-y-2 list-disc pl-5 text-[var(--hemsa-grey)] leading-relaxed">{b.list.map((t) => <li key={t.slice(0, 40)}>{t}</li>)}</ul>}
  </div>
);

export default function LegalPage({ page }) {
  const data = LEGAL_PAGES[page];
  return (
    <div data-testid={`legal-page-${page}`}>
      <PageHero eyebrow={data.title} title={data.title} intro={data.intro} />
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <Card>{data.blocks.map((b) => <Block key={b.h} b={b} />)}</Card>
        </div>
      </section>
    </div>
  );
}

import { HISTORY, IMG } from "@/data/content";

export const HistoryB = () => (
  <section id="historia" data-testid="history-section" className="py-24 lg:py-32 bg-white rounded-[3rem] mx-3 sm:mx-6">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-14 items-center">
      <div className="relative">
        <div className="rounded-[2.5rem] overflow-hidden aspect-[4/3.5]">
          <img src={IMG.calle} alt="Calle blanca andaluza" className="h-full w-full object-cover" />
        </div>
        <div className="absolute -bottom-8 right-6 bg-white rounded-3xl shadow-xl p-4 w-40">
          <img src={IMG.logoV} alt="Logotipo de HEMSA" className="w-full" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--hemsa)]">Nuestra historia</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[var(--hemsa-ink)] leading-tight">{HISTORY.title}</h2>
        <p className="mt-6 text-[var(--hemsa-grey)] leading-relaxed">{HISTORY.intro}</p>
        <p className="mt-4 text-[var(--hemsa-grey)] leading-relaxed">{HISTORY.p2} {HISTORY.p3}</p>
        <ol className="mt-10 space-y-4" data-testid="history-timeline">
          {HISTORY.timeline.map((t) => (
            <li key={t.year} className="flex gap-5 items-start rounded-3xl bg-[var(--hemsa-mist)] p-5">
              <span className="shrink-0 rounded-2xl bg-white text-[var(--hemsa)] font-bold px-4 py-2 shadow-sm">{t.year}</span>
              <div>
                <p className="font-semibold text-[var(--hemsa-ink)]">{t.title}</p>
                <p className="text-sm text-[var(--hemsa-grey)] mt-1 leading-relaxed">{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

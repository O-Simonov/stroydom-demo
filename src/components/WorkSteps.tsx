import { WORK_STEPS } from "@/data/content";

export function WorkSteps() {
  return (
    <section id="steps" className="section-pad bg-[var(--paper)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Этапы работы</p>
          <h2 className="section-title">От заявки до сдачи дома</h2>
          <p className="section-lead">
            Последовательный процесс без хаоса: сначала вводные и расчёт, затем
            проект и строительство с контролем на каждом шаге.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORK_STEPS.map((item, index) => (
            <li
              key={item.step}
              className="relative rounded-2xl border border-[var(--line)] bg-[var(--sand)]/30 p-6"
            >
              {index < WORK_STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 bg-[var(--line)] lg:block"
                  aria-hidden
                />
              ) : null}
              <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-[var(--brass)]">
                {item.step}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

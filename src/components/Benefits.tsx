import { BENEFITS } from "@/data/content";

export function Benefits() {
  return (
    <section id="benefits" className="section-pad bg-[var(--paper)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Преимущества</p>
          <h2 className="section-title">Строим так, чтобы процесс был понятен</h2>
          <p className="section-lead">
            Демонстрационный лендинг показывает, как можно подать сильные стороны
            строительной компании: смета, контроль, сроки и качество работ.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item, index) => (
            <li
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--sand)]/40 p-6 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--forest)_35%,var(--line))] hover:bg-[var(--sand)]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--forest)]/10 font-[family-name:var(--font-display)] text-sm text-[var(--forest)]"
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold text-[var(--ink)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { CUSTOMER_GETS } from "@/data/content";

export function CustomerValue() {
  return (
    <section id="value" className="section-pad bg-[var(--sand)]/55">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Для заказчика</p>
          <h2 className="section-title">Что получает заказчик</h2>
          <p className="section-lead">
            Вместо вымышленных отзывов — блок ценности. Позже его можно заменить
            реальными отзывами клиентов.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {CUSTOMER_GETS.map((item) => (
            <li
              key={item.title}
              className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7"
            >
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

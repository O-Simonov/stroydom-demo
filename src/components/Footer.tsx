import { NAV_LINKS } from "@/data/content";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.06em]">
            СТРОЙДОМ
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[color-mix(in_srgb,var(--paper)_70%,transparent)]">
            Демонстрационный проект для портфолио: сайт строительной компании,
            приём заявок, уведомления в Telegram и mini-CRM для обработки
            обращений.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--brass)]">Навигация</p>
          <ul className="mt-4 space-y-2 text-sm text-[color-mix(in_srgb,var(--paper)_78%,transparent)]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="transition hover:text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brass)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#calculator"
                className="transition hover:text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brass)]"
              >
                Калькулятор
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--brass)]">Контакты</p>
          <ul className="mt-4 space-y-2 text-sm text-[color-mix(in_srgb,var(--paper)_78%,transparent)]">
            <li>Телефон: +7 (000) 000-00-00</li>
            <li>Email: hello@stroydom.demo</li>
            <li>Telegram: @stroydom_demo</li>
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-[color-mix(in_srgb,var(--paper)_55%,transparent)]">
            Контакты-заглушки для демонстрации интерфейса.
          </p>
        </div>
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--paper)_12%,transparent)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-[color-mix(in_srgb,var(--paper)_55%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Демонстрационный проект для портфолио</p>
          <p>СТРОЙДОМ · DEMO PROJECT 01</p>
        </div>
      </div>
    </footer>
  );
}

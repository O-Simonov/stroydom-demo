import Link from "next/link";
import { NAV_LINKS } from "@/data/content";

type FooterProps = {
  siteMode?: "demo" | "production";
};

export function Footer({ siteMode = "demo" }: FooterProps) {
  const demo = siteMode === "demo";

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.06em]">
            СТРОЙДОМ
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[color-mix(in_srgb,var(--paper)_70%,transparent)]">
            {demo
              ? "Демонстрационный проект для портфолио: пример дизайна и разработки сайта строительной компании, формы заявки и закрытого раздела для обработки обращений."
              : "Сайт строительной компании: услуги, подбор параметров дома и приём обращений."}
          </p>
          {demo ? (
            <p className="mt-3 text-xs tracking-wide text-[color-mix(in_srgb,var(--brass)_90%,transparent)]">
              Демонстрационный проект
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--brass)]">Навигация</p>
          <ul className="mt-4 space-y-2 text-sm text-[color-mix(in_srgb,var(--paper)_78%,transparent)]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                  className="transition hover:text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brass)]"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--brass)]">Документы</p>
          <ul className="mt-4 space-y-2 text-sm text-[color-mix(in_srgb,var(--paper)_78%,transparent)]">
            <li>
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brass)]"
              >
                Политика обработки персональных данных
              </Link>
            </li>
            <li>
              <Link
                href="/personal-data-consent"
                className="underline underline-offset-2 hover:text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brass)]"
              >
                Согласие на обработку персональных данных
              </Link>
            </li>
            <li>
              <Link
                href="/cookies"
                className="underline underline-offset-2 hover:text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brass)]"
              >
                Файлы cookie
              </Link>
            </li>
            {demo ? (
              <li className="pt-2 text-xs text-[color-mix(in_srgb,var(--paper)_55%,transparent)]">
                Контакты реальной компании здесь не публикуются.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--paper)_12%,transparent)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-[color-mix(in_srgb,var(--paper)_55%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            {demo
              ? "Создан для демонстрации дизайна и разработки. Не является сайтом реальной строительной компании."
              : "СТРОЙДОМ"}
          </p>
          <p>{demo ? "Демонстрационный проект" : null}</p>
        </div>
      </div>
    </footer>
  );
}

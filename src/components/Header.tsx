"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/data/content";

type HeaderProps = {
  onCalcClick: () => void;
};

export function Header({ onCalcClick }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter,color] duration-300 ${
        solid
          ? "border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] text-[var(--ink)] shadow-[0_10px_40px_rgba(20,24,22,0.06)] backdrop-blur-md"
          : "border-transparent bg-transparent text-[var(--paper)]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <a
          href="#top"
          className={`font-[family-name:var(--font-display)] text-lg font-semibold tracking-[0.04em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
            solid
              ? "text-[var(--ink)] focus-visible:outline-[var(--forest)]"
              : "text-[var(--paper)] focus-visible:outline-[var(--paper)]"
          }`}
        >
          СТРОЙДОМ
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Основная навигация">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-[0.9375rem] font-medium tracking-[0.01em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
                solid
                  ? "text-[color-mix(in_srgb,var(--ink)_78%,transparent)] hover:text-[var(--ink)] focus-visible:outline-[var(--forest)]"
                  : "text-[color-mix(in_srgb,var(--paper)_88%,transparent)] hover:text-[var(--paper)] focus-visible:outline-[var(--paper)]"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCalcClick}
            className={`hidden rounded-full px-4 py-2.5 text-sm font-medium transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:inline-flex ${
              solid
                ? "bg-[var(--forest)] text-[var(--paper)] hover:bg-[var(--forest-deep)] focus-visible:outline-[var(--forest)]"
                : "bg-[var(--brass)] text-[var(--ink)] hover:bg-[var(--brass-soft)] focus-visible:outline-[var(--paper)]"
            }`}
          >
            Получить расчёт
          </button>

          <button
            type="button"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 md:hidden ${
              solid
                ? "border-[var(--line)] text-[var(--ink)] focus-visible:outline-[var(--forest)]"
                : "border-[color-mix(in_srgb,var(--paper)_45%,transparent)] text-[var(--paper)] focus-visible:outline-[var(--paper)]"
            }`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Меню</span>
            <span aria-hidden className="flex w-5 flex-col gap-1.5">
              <span
                className={`h-0.5 w-full bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`}
              />
              <span className={`h-0.5 w-full bg-current transition ${open ? "opacity-0" : ""}`} />
              <span
                className={`h-0.5 w-full bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`border-t border-[var(--line)] bg-[var(--paper)] md:hidden ${open ? "block" : "hidden"}`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Мобильная навигация">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-3 text-base text-[var(--ink)] hover:bg-[var(--sand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forest)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            className="mt-2 rounded-full bg-[var(--forest)] px-4 py-3 text-left text-base font-medium text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forest)]"
            onClick={() => {
              setOpen(false);
              onCalcClick();
            }}
          >
            Получить расчёт
          </button>
        </nav>
      </div>
    </header>
  );
}

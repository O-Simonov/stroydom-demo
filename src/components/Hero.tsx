import Image from "next/image";
import { HERO_IMAGE } from "@/data/content";

type HeroProps = {
  onCalcClick: () => void;
};

export function Hero({ onCalcClick }: HeroProps) {
  return (
    <section id="top" className="relative min-h-[100svh] overflow-hidden bg-[var(--ink)] text-[var(--paper)]">
      <Image
        src={HERO_IMAGE}
        alt="Современный загородный дом с панорамным остеклением на участке"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[72%_center] sm:object-center"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,24,22,0.86)_0%,rgba(20,24,22,0.68)_28%,rgba(20,24,22,0.38)_58%,rgba(20,24,22,0.14)_78%,rgba(20,24,22,0.04)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,22,0.28)_0%,transparent_28%,transparent_78%,rgba(20,24,22,0.22)_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:px-8 lg:pb-24 lg:pt-32">
        <div className="hero-rise max-w-[22rem] sm:max-w-xl lg:max-w-[34rem]">
          <p className="mb-5 font-[family-name:var(--font-display)] text-[0.7rem] tracking-[0.18em] text-[var(--brass)] sm:text-sm sm:tracking-[0.2em]">
            СТРОИТЕЛЬСТВО ПОД КЛЮЧ
          </p>
          <h1 className="max-w-[11.5ch] font-[family-name:var(--font-display)] text-[clamp(2.05rem,4.6vw,3.15rem)] leading-[1.1] tracking-[-0.02em] text-balance sm:max-w-[13ch] lg:max-w-[12.5ch]">
            Строительство загородных домов под ключ
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[color-mix(in_srgb,var(--paper)_90%,transparent)] sm:text-lg">
            От проекта до сдачи готового дома — проектирование, строительство и
            сопровождение на каждом этапе. Помогаем собрать понятный план работ и
            смету под ваш участок и сценарий жизни.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onCalcClick}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brass)] px-6 py-3.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--brass-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--paper)]"
            >
              Получить расчёт
            </button>
            <a
              href="#projects"
              className="inline-flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--paper)_45%,transparent)] px-6 py-3.5 text-sm font-medium text-[var(--paper)] transition hover:border-[var(--paper)] hover:bg-[color-mix(in_srgb,var(--paper)_8%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--paper)]"
            >
              Посмотреть проекты
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

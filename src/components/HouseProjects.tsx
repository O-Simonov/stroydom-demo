import Image from "next/image";
import { HOUSE_PROJECTS } from "@/data/content";
import type { CalculatorValues } from "@/lib/types";

type HouseProjectsProps = {
  onRequestQuote: (preset: Partial<CalculatorValues>) => void;
};

export function HouseProjects({ onRequestQuote }: HouseProjectsProps) {
  return (
    <section id="projects" className="section-pad bg-[var(--sand)]/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Проекты домов</p>
            <h2 className="section-title">Четыре формата под разные задачи</h2>
            <p className="section-lead">
              Площади и планировочные сценарии — ориентиры для обсуждения. Точную
              стоимость считаем после консультации по участку и комплектации.
            </p>
          </div>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {HOUSE_PROJECTS.map((house) => (
            <li
              key={house.id}
              className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_20px_50px_rgba(20,24,22,0.04)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={house.imageSrc}
                  alt={house.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="motion-safe-zoom object-cover transition duration-700 hover:scale-[1.03]"
                />
              </div>
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                  <span>{house.area} м²</span>
                  <span aria-hidden>·</span>
                  <span>
                    {house.floors}{" "}
                    {house.floors === 1 ? "этаж" : "этажа"}
                  </span>
                </div>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {house.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {house.summary}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onRequestQuote({
                      area: house.area,
                      floors: house.floors,
                    })
                  }
                  className="mt-6 inline-flex rounded-full border border-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--forest)]"
                >
                  Получить расчёт
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

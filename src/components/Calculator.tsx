"use client";

import { useState } from "react";
import { MATERIALS, PACKAGES } from "@/data/content";
import type { CalculatorValues, Material, PackageOption } from "@/lib/types";

type CalculatorProps = {
  initial?: Partial<CalculatorValues>;
  onSubmit: (values: CalculatorValues) => void;
};

const defaults: CalculatorValues = {
  area: 150,
  floors: 2,
  material: "газобетон",
  packageOption: "под ключ",
};

export function Calculator({ initial, onSubmit }: CalculatorProps) {
  const [values, setValues] = useState<CalculatorValues>({
    ...defaults,
    ...initial,
  });

  return (
    <section id="calculator" className="on-dark section-pad bg-[var(--ink)] text-[var(--paper)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <p className="eyebrow">Калькулятор</p>
          <h2 className="section-title">Подберите параметры дома</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[color-mix(in_srgb,var(--paper)_75%,transparent)]">
            Выберите параметры дома: площадь, этажность, материал и
            комплектацию. Они перейдут в заявку, а итоговый расчёт можно
            уточнить после консультации.
          </p>
        </div>

        <form
          className="rounded-3xl border border-[color-mix(in_srgb,var(--paper)_14%,transparent)] bg-[color-mix(in_srgb,var(--paper)_6%,transparent)] p-6 sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(values);
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label htmlFor="calc-area" className="field-label">
                Площадь дома, м²
              </label>
              <input
                id="calc-area"
                name="area"
                type="number"
                min={60}
                max={500}
                required
                inputMode="numeric"
                value={values.area}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    area: Number(e.target.value) || 0,
                  }))
                }
                className="field-input dark-field"
              />
            </div>

            <div>
              <label htmlFor="calc-floors" className="field-label">
                Количество этажей
              </label>
              <select
                id="calc-floors"
                name="floors"
                value={values.floors}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    floors: Number(e.target.value),
                  }))
                }
                className="field-input dark-field"
              >
                <option value={1}>1 этаж</option>
                <option value={2}>2 этажа</option>
                <option value={3}>3 этажа</option>
              </select>
            </div>

            <div>
              <label htmlFor="calc-material" className="field-label">
                Материал
              </label>
              <select
                id="calc-material"
                name="material"
                value={values.material}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    material: e.target.value as Material,
                  }))
                }
                className="field-input dark-field"
              >
                {MATERIALS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="calc-package" className="field-label">
                Комплектация
              </label>
              <select
                id="calc-package"
                name="packageOption"
                value={values.packageOption}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    packageOption: e.target.value as PackageOption,
                  }))
                }
                className="field-input dark-field"
              >
                {PACKAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[var(--brass)] px-6 py-3.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--brass-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--paper)] sm:w-auto"
          >
            Получить расчёт
          </button>
        </form>
      </div>
    </section>
  );
}

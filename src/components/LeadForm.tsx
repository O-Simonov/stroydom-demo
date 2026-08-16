"use client";

import { useEffect, useState, type FormEvent } from "react";
import { readAttributionFromLocation } from "@/lib/attribution";
import type { CalculatorValues } from "@/lib/types";

type LeadFormProps = {
  calculatorValues: CalculatorValues | null;
};

type FormState = {
  name: string;
  phone: string;
  telegram: string;
  comment: string;
  website: string;
};

const empty: FormState = {
  name: "",
  phone: "",
  telegram: "",
  comment: "",
  website: "",
};

const DEFAULT_SERVICE = "Строительство дома";

export function LeadForm({ calculatorValues }: LeadFormProps) {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<"name" | "phone", string>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!calculatorValues) return;
    setSubmitted(false);
    setFormError(null);
  }, [calculatorValues]);

  function validate(values: FormState) {
    const next: Partial<Record<"name" | "phone", string>> = {};
    if (!values.name.trim()) next.name = "Укажите имя";
    if (!values.phone.trim()) next.phone = "Укажите телефон";
    else if (values.phone.replace(/\D/g, "").length < 10) {
      next.phone = "Проверьте номер телефона";
    }
    return next;
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitted(false);
    setFormError(null);
    if (field === "name" || field === "phone") {
      const key: "name" | "phone" = field;
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitted(false);
      return;
    }

    setLoading(true);
    setFormError(null);
    setSubmitted(false);

    const attribution = readAttributionFromLocation();

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      telegram: form.telegram.trim() || undefined,
      comment: form.comment.trim() || undefined,
      service: DEFAULT_SERVICE,
      area: calculatorValues?.area,
      floors: calculatorValues?.floors,
      material: calculatorValues?.material,
      package: calculatorValues?.packageOption,
      source: attribution.source,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmContent: attribution.utmContent,
      utmTerm: attribution.utmTerm,
      landingUrl: attribution.landingUrl,
      website: form.website,
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 201) {
        setSubmitted(true);
        setForm({
          name: "",
          phone: "",
          telegram: "",
          comment: "",
          website: "",
        });
        setErrors({});
        return;
      }

      if (response.status === 429) {
        setFormError("Слишком много попыток. Попробуйте немного позже.");
        return;
      }

      if (response.status === 400) {
        setFormError("Проверьте заполнение формы.");
        return;
      }

      setFormError("Не удалось отправить заявку. Попробуйте ещё раз.");
    } catch {
      setFormError("Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="section-pad bg-[var(--paper)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="eyebrow">Заявка</p>
          <h2 className="section-title">Получите консультацию</h2>
          <p className="section-lead">
            Оставьте контакты и параметры дома — заявка сохранится в системе,
            менеджер получит уведомление в Telegram, а обращение появится в
            mini-CRM.
          </p>

          {calculatorValues ? (
            <dl className="mt-8 grid gap-3 rounded-3xl border border-[var(--line)] bg-[var(--sand)]/40 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Площадь</dt>
                <dd className="font-medium text-[var(--ink)]">{calculatorValues.area} м²</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Этажи</dt>
                <dd className="font-medium text-[var(--ink)]">{calculatorValues.floors}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Материал</dt>
                <dd className="font-medium text-[var(--ink)]">{calculatorValues.material}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Комплектация</dt>
                <dd className="font-medium text-[var(--ink)]">
                  {calculatorValues.packageOption}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-8 text-sm text-[var(--muted)]">
              Параметры из калькулятора появятся здесь после нажатия «Получить
              расчёт».
            </p>
          )}
        </div>

        <form
          id="lead-form"
          onSubmit={onSubmit}
          noValidate
          className="relative rounded-3xl border border-[var(--line)] bg-[var(--sand)]/25 p-6 sm:p-8"
        >
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="lead-website">Website</label>
            <input
              id="lead-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
            />
          </div>

          <div className="grid gap-5">
            <div>
              <label htmlFor="lead-name" className="field-label">
                Имя *
              </label>
              <input
                id="lead-name"
                name="name"
                autoComplete="name"
                required
                disabled={loading}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="field-input"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "lead-name-error" : undefined}
              />
              {errors.name ? (
                <p id="lead-name-error" className="mt-2 text-sm text-red-700">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="lead-phone" className="field-label">
                Телефон *
              </label>
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                disabled={loading}
                placeholder="+7 ..."
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="field-input"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "lead-phone-error" : undefined}
              />
              {errors.phone ? (
                <p id="lead-phone-error" className="mt-2 text-sm text-red-700">
                  {errors.phone}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="lead-telegram" className="field-label">
                Telegram
              </label>
              <input
                id="lead-telegram"
                name="telegram"
                autoComplete="off"
                disabled={loading}
                placeholder="@username"
                value={form.telegram}
                onChange={(e) => updateField("telegram", e.target.value)}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="lead-comment" className="field-label">
                Комментарий
              </label>
              <textarea
                id="lead-comment"
                name="comment"
                rows={4}
                disabled={loading}
                value={form.comment}
                onChange={(e) => updateField("comment", e.target.value)}
                className="field-input min-h-[120px] resize-y"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[var(--forest)] px-6 py-3.5 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--forest-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--forest)] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {loading ? "Отправляем..." : "Получить консультацию"}
          </button>

          {submitted ? (
            <p
              className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--forest)_25%,var(--line))] bg-[color-mix(in_srgb,var(--forest)_8%,var(--paper))] px-4 py-3 text-sm text-[var(--forest-deep)]"
              role="status"
            >
              Спасибо! Заявка отправлена.
            </p>
          ) : null}

          {formError ? (
            <p
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

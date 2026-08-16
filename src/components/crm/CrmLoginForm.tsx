"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CrmLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/crm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (response.status === 429) {
        setError("Слишком много попыток. Попробуйте позже.");
        return;
      }

      if (!response.ok || !data.success) {
        setError(data.error || "Неверный пароль");
        return;
      }

      router.replace("/leads");
      router.refresh();
    } catch {
      setError("Не удалось войти. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_20px_50px_rgba(20,24,22,0.06)] sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--forest)] font-[family-name:var(--font-display)] text-sm text-[var(--paper)]"
        >
          СД
        </span>
        <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.18em] text-[var(--brass)]">
          СТРОЙДОМ
        </p>
      </div>

      <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Mini CRM
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Вход в систему обработки заявок
      </p>

      <label htmlFor="crm-password" className="field-label mt-6">
        Пароль
      </label>
      <input
        id="crm-password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        disabled={loading}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "crm-login-error" : undefined}
        className="field-input"
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--paper)] transition hover:bg-[var(--forest-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forest)] disabled:opacity-70"
      >
        {loading ? "Входим..." : "Войти"}
      </button>

      {error ? (
        <p
          id="crm-login-error"
          className="mt-4 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

type CrmEmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function CrmEmptyState({ title, description, action }: CrmEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--paper)] px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sand)] font-[family-name:var(--font-display)] text-lg text-[var(--brass)]"
      >
        СД
      </div>
      <p className="mt-4 font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

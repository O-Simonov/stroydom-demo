import type { CrmLead } from "@/lib/crm/types";
import { IN_PROGRESS_STATUSES } from "@/lib/crm/status";

type CrmStatsProps = {
  leads: CrmLead[];
};

export function CrmStats({ leads }: CrmStatsProps) {
  const total = leads.length;
  const neu = leads.filter((l) => l.status === "NEW").length;
  const progress = leads.filter((l) =>
    IN_PROGRESS_STATUSES.includes(l.status),
  ).length;
  const won = leads.filter((l) => l.status === "WON").length;

  const items = [
    { label: "Всего", value: total },
    { label: "Новые", value: neu },
    { label: "В работе", value: progress },
    { label: "Продажи", value: won },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.label}
          className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            {item.label}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {item.value}
          </p>
        </li>
      ))}
    </ul>
  );
}

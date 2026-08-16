'use client';

export function StatusBadge({ status }: { status: string }) {
  const cls = `badge badge-${status.toLowerCase().replace(/\s+/g, '')}`;
  return <span className={cls}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const cls = `badge badge-${priority.toLowerCase()}`;
  return <span className={cls}>{priority}</span>;
}

export function SLABadge({ sla }: { sla: { status: string; remainingHours: number } }) {
  const cls = `badge badge-${sla.status.toLowerCase()}`;
  const label = sla.status === 'Breached' ? 'SLA Breached' : sla.status === 'AtRisk' ? `At Risk (${sla.remainingHours}h)` : `On Track (${sla.remainingHours}h)`;
  return <span className={cls}>{label}</span>;
}

export function CategoryBadge({ category }: { category: string }) {
  const cls = `badge badge-${category.toLowerCase()}`;
  return <span className={cls}>{category}</span>;
}

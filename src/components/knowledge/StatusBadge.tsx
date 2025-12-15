import { cn } from '@/lib/utils';
import { OfferStatus, OfferWorkStatus, ProjectStatus } from '@/types/knowledge';

interface StatusBadgeProps {
  status: OfferStatus | OfferWorkStatus | ProjectStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Offer status
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-muted',
  },
  won: {
    label: 'Won',
    className: 'bg-status-won/10 text-status-won border-status-won/20',
  },
  lost: {
    label: 'Lost',
    className: 'bg-status-lost/10 text-status-lost border-status-lost/20',
  },
  // Offer work status
  delivered: {
    label: 'Delivered',
    className: 'bg-status-completed/10 text-status-completed border-status-completed/20',
  },
  under_development: {
    label: 'Under Development',
    className: 'bg-status-active/10 text-status-active border-status-active/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-status-pending/10 text-status-pending border-status-pending/20',
  },
  // Project status
  active: {
    label: 'Active',
    className: 'bg-status-active/10 text-status-active border-status-active/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-status-completed/10 text-status-completed border-status-completed/20',
  },
  archived: {
    label: 'Archived',
    className: 'bg-muted text-muted-foreground border-muted',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

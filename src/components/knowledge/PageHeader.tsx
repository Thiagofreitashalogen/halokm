import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  icon?: ReactNode;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function PageHeader({ 
  title, 
  description, 
  count, 
  icon,
  showAddButton = true,
  onAddClick 
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {typeof count === 'number' && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {showAddButton && (
        <Button onClick={onAddClick} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Entry
        </Button>
      )}
    </div>
  );
}

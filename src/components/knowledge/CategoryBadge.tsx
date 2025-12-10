import { cn } from '@/lib/utils';
import { KnowledgeCategory } from '@/types/knowledge';
import { FolderOpen, FileText, Lightbulb } from 'lucide-react';

interface CategoryBadgeProps {
  category: KnowledgeCategory;
  className?: string;
}

const categoryConfig = {
  project: {
    label: 'Project',
    icon: FolderOpen,
    className: 'bg-category-project/10 text-category-project border-category-project/20',
  },
  offer: {
    label: 'Offer',
    icon: FileText,
    className: 'bg-category-offer/10 text-category-offer border-category-offer/20',
  },
  method: {
    label: 'Method',
    icon: Lightbulb,
    className: 'bg-category-method/10 text-category-method border-category-method/20',
  },
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

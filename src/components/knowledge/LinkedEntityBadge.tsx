import { Badge } from '@/components/ui/badge';
import { KnowledgeCategory } from '@/types/knowledge';

interface LinkedEntityBadgeProps {
  id: string;
  title: string;
  category: KnowledgeCategory;
  onClick?: (id: string, category: KnowledgeCategory) => void;
}

export function LinkedEntityBadge({ id, title, category, onClick }: LinkedEntityBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className="font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(id, category);
      }}
    >
      {title}
    </Badge>
  );
}

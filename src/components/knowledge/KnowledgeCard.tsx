import { KnowledgeEntry } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Building2, Calendar } from 'lucide-react';

interface KnowledgeCardProps {
  entry: KnowledgeEntry;
  onClick?: () => void;
}

export function KnowledgeCard({ entry, onClick }: KnowledgeCardProps) {
  const status = entry.offerOutcome || entry.projectStatus;

  return (
    <Card
      className="hover-lift cursor-pointer border-border/60 hover:border-border transition-all bg-card"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={entry.category} />
              {status && <StatusBadge status={status} />}
            </div>
            <h3 className="font-medium text-foreground leading-tight line-clamp-2">
              {entry.title}
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {entry.description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          {entry.client && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {entry.client}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(entry.updatedAt, 'MMM d, yyyy')}
          </span>
        </div>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-1.5 py-0 font-normal"
              >
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 font-normal text-muted-foreground"
              >
                +{entry.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

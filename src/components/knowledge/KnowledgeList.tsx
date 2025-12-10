import { KnowledgeEntry } from '@/types/knowledge';
import { KnowledgeCard } from './KnowledgeCard';

interface KnowledgeListProps {
  entries: KnowledgeEntry[];
  onEntryClick?: (entry: KnowledgeEntry) => void;
}

export function KnowledgeList({ entries, onEntryClick }: KnowledgeListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">No entries found</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => (
        <KnowledgeCard
          key={entry.id}
          entry={entry}
          onClick={() => onEntryClick?.(entry)}
        />
      ))}
    </div>
  );
}

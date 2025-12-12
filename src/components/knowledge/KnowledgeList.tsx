import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { KnowledgeEntry } from '@/types/knowledge';
import { KnowledgeCard } from './KnowledgeCard';
import { KnowledgeTable } from './KnowledgeTable';
import { Toggle } from '@/components/ui/toggle';

interface KnowledgeListProps {
  entries: KnowledgeEntry[];
  onEntryClick?: (entry: KnowledgeEntry) => void;
  onEntriesDeleted?: () => void;
}

type ViewMode = 'cards' | 'table';

export function KnowledgeList({ entries, onEntryClick, onEntriesDeleted }: KnowledgeListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

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
    <div className="space-y-4">
      <div className="flex justify-end gap-1">
        <Toggle
          pressed={viewMode === 'cards'}
          onPressedChange={() => setViewMode('cards')}
          size="sm"
          aria-label="Card view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={viewMode === 'table'}
          onPressedChange={() => setViewMode('table')}
          size="sm"
          aria-label="Table view"
        >
          <List className="h-4 w-4" />
        </Toggle>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <KnowledgeCard
              key={entry.id}
              entry={entry}
              onClick={() => onEntryClick?.(entry)}
            />
          ))}
        </div>
      ) : (
        <KnowledgeTable entries={entries} onEntryClick={onEntryClick} onEntriesDeleted={onEntriesDeleted} />
      )}
    </div>
  );
}

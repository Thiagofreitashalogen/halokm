import { useMemo } from 'react';
import { KnowledgeEntry, KnowledgeCategory } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { useLinkedClientsForTable } from '@/hooks/useLinkedEntities';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LinkedEntity {
  id: string;
  title: string;
}

interface KnowledgeTableProps {
  entries: KnowledgeEntry[];
  onEntryClick?: (entry: KnowledgeEntry) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  category?: KnowledgeCategory | null;
  refreshKey?: number;
}

// Define column configurations per category
const getCategoryColumns = (category: KnowledgeCategory | null | undefined) => {
  switch (category) {
    case 'project':
      return {
        col1: { header: 'Status', width: 'w-[100px]' },
        col2: { header: 'Client', width: '' },
      };
    case 'offer':
      return {
        col1: { header: 'Status', width: 'w-[100px]' },
        col2: { header: 'Client', width: '' },
      };
    case 'method':
      return {
        col1: { header: 'Field', width: 'w-[120px]' },
        col2: { header: 'Domain', width: '' },
      };
    case 'client':
      return {
        col1: { header: 'Industry', width: 'w-[120px]' },
        col2: { header: 'Projects', width: '' },
      };
    case 'person':
      return {
        col1: { header: 'Position', width: 'w-[120px]' },
        col2: { header: 'Studio', width: '' },
      };
    default:
      // Mixed categories (e.g., search results, All Entries)
      return {
        col1: { header: 'Status', width: 'w-[100px]' },
        col2: { header: 'Details', width: '' },
      };
  }
};

// Get cell content based on category - now accepts linkedClients map for dynamic lookup
const getCellContent = (
  entry: KnowledgeEntry, 
  column: 'col1' | 'col2',
  linkedClients: Record<string, LinkedEntity | null>
) => {
  const category = entry.category;
  
  if (column === 'col1') {
    switch (category) {
      case 'project':
        return entry.projectStatus ? <StatusBadge status={entry.projectStatus} /> : '—';
      case 'offer':
        return entry.offerStatus ? <StatusBadge status={entry.offerStatus} /> : '—';
      case 'method':
        return entry.field || '—';
      case 'client':
        return entry.industry || '—';
      case 'person':
        return entry.position || '—';
      default:
        return entry.projectStatus ? <StatusBadge status={entry.projectStatus} /> : 
               entry.offerStatus ? <StatusBadge status={entry.offerStatus} /> : '—';
    }
  } else {
    switch (category) {
      case 'project':
        // Use linked client from junction table, fallback to text field for legacy data
        return linkedClients[entry.id]?.title || entry.client || '—';
      case 'offer':
        // Use linked client from junction table, fallback to text field for legacy data
        return linkedClients[entry.id]?.title || entry.client || '—';
      case 'method':
        return entry.domain || '—';
      case 'client':
        // Would need project count, showing placeholder for now
        return entry.industry ? 'View details' : '—';
      case 'person':
        return entry.studio || '—';
      default:
        // For mixed view, check linked clients first for projects
        if (entry.category === 'project' && linkedClients[entry.id]) {
          return linkedClients[entry.id]?.title;
        }
        return entry.client || entry.domain || entry.studio || '—';
    }
  }
};

export function KnowledgeTable({ entries, onEntryClick, selectedIds, onSelectionChange, category, refreshKey }: KnowledgeTableProps) {
  // Prepare entries data for the linked clients hook
  const entriesForLinking = useMemo(() => 
    entries.map(e => ({ id: e.id, category: e.category })),
    [entries]
  );
  
  // Fetch linked clients for projects dynamically
  const { linkedClients } = useLinkedClientsForTable(entriesForLinking, refreshKey);
  
  const allSelected = entries.length > 0 && selectedIds.size === entries.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < entries.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(entries.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

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

  const columns = getCategoryColumns(category);
  const showCategoryColumn = !category; // Only show category column when viewing mixed entries

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-[250px]">Title</TableHead>
            {showCategoryColumn && (
              <TableHead className="w-[100px]">Category</TableHead>
            )}
            <TableHead className={columns.col1.width}>{columns.col1.header}</TableHead>
            <TableHead className={columns.col2.width}>{columns.col2.header}</TableHead>
            <TableHead className="w-[120px]">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className="cursor-pointer"
              onClick={() => onEntryClick?.(entry)}
              data-state={selectedIds.has(entry.id) ? 'selected' : undefined}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(entry.id)}
                  onCheckedChange={() => toggleSelect(entry.id)}
                  aria-label={`Select ${entry.title}`}
                />
              </TableCell>
              <TableCell className="font-medium">{entry.title}</TableCell>
              {showCategoryColumn && (
                <TableCell>
                  <CategoryBadge category={entry.category} />
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {getCellContent(entry, 'col1', linkedClients)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getCellContent(entry, 'col2', linkedClients)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(entry.updatedAt, 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import { KnowledgeEntry } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface KnowledgeTableProps {
  entries: KnowledgeEntry[];
  onEntryClick?: (entry: KnowledgeEntry) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function KnowledgeTable({ entries, onEntryClick, selectedIds, onSelectionChange }: KnowledgeTableProps) {
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
            <TableHead className="w-[100px]">Category</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Client</TableHead>
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
              <TableCell>
                <CategoryBadge category={entry.category} />
              </TableCell>
              <TableCell>
                {entry.projectStatus && (
                  <StatusBadge status={entry.projectStatus} />
                )}
                {entry.offerStatus && (
                  <StatusBadge status={entry.offerStatus} />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {entry.client || '—'}
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

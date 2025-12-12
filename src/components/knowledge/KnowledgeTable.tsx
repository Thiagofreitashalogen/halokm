import { KnowledgeEntry } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
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
}

export function KnowledgeTable({ entries, onEntryClick }: KnowledgeTableProps) {
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
            >
              <TableCell className="font-medium">{entry.title}</TableCell>
              <TableCell>
                <CategoryBadge category={entry.category} />
              </TableCell>
              <TableCell>
                {entry.projectStatus && (
                  <StatusBadge status={entry.projectStatus} />
                )}
                {entry.offerOutcome && (
                  <StatusBadge status={entry.offerOutcome} />
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

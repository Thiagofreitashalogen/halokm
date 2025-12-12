import { useState } from 'react';
import { KnowledgeEntry } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeTableProps {
  entries: KnowledgeEntry[];
  onEntryClick?: (entry: KnowledgeEntry) => void;
  onEntriesDeleted?: () => void;
}

export function KnowledgeTable({ entries, onEntryClick, onEntriesDeleted }: KnowledgeTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const allSelected = entries.length > 0 && selectedIds.size === entries.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < entries.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('knowledge_entries')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: `${selectedIds.size} ${selectedIds.size === 1 ? 'entry' : 'entries'} deleted successfully`,
      });

      setSelectedIds(new Set());
      onEntriesDeleted?.();
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entries',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
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
    <div className="space-y-3">
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

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
                    onCheckedChange={() => {
                      const newSelected = new Set(selectedIds);
                      if (newSelected.has(entry.id)) {
                        newSelected.delete(entry.id);
                      } else {
                        newSelected.add(entry.id);
                      }
                      setSelectedIds(newSelected);
                    }}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {selectedIds.size === 1 ? 'entry' : 'entries'} and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

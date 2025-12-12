import { useState } from 'react';
import { LayoutGrid, List, Trash2 } from 'lucide-react';
import { KnowledgeEntry } from '@/types/knowledge';
import { KnowledgeCard } from './KnowledgeCard';
import { KnowledgeTable } from './KnowledgeTable';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
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

interface KnowledgeListProps {
  entries: KnowledgeEntry[];
  onEntryClick?: (entry: KnowledgeEntry) => void;
  onEntriesDeleted?: () => void;
}

type ViewMode = 'cards' | 'table';

export function KnowledgeList({ entries, onEntryClick, onEntriesDeleted }: KnowledgeListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

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
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={selectedIds.size === 0 || isDeleting}
          className="text-muted-foreground hover:text-destructive disabled:opacity-40"
        >
          {selectedIds.size > 0 && (
            <span className="text-xs mr-1">{selectedIds.size}</span>
          )}
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border" />
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
        <KnowledgeTable
          entries={entries}
          onEntryClick={onEntryClick}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

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

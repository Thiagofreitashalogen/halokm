import { useState } from 'react';
import { FileText, Clock, Users, Trash2, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Draft {
  id: string;
  title: string;
  status: string;
  tender_summary: string | null;
  winning_strategy: string | null;
  draft_content: string | null;
  currently_editing_by: string | null;
  currently_editing_since: string | null;
  created_at: string;
  updated_at: string;
}

interface DraftsListProps {
  drafts: Draft[];
  onOpenDraft: (draft: Draft) => void;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-yellow-500/10 text-yellow-600',
  approved: 'bg-green-500/10 text-green-600',
  published: 'bg-blue-500/10 text-blue-600',
};

export const DraftsList = ({ drafts, onOpenDraft, onRefresh }: DraftsListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('content_drafts')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast.success('Draft deleted');
      onRefresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete draft');
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      const { error } = await supabase
        .from('content_drafts')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedIds.size} draft(s) deleted`);
      setSelectedIds(new Set());
      onRefresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete drafts');
    }
  };

  const allSelected = drafts.length > 0 && selectedIds.size === drafts.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < drafts.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(drafts.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  if (drafts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">No drafts yet</p>
        <p className="text-sm">Create a new offer to get started</p>
      </div>
    );
  }

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
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
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="w-[140px]">Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map(draft => (
              <TableRow
                key={draft.id}
                className="cursor-pointer"
                onClick={() => onOpenDraft(draft)}
                data-state={selectedIds.has(draft.id) ? 'selected' : undefined}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(draft.id)}
                    onCheckedChange={() => toggleSelect(draft.id)}
                    aria-label={`Select ${draft.title}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{draft.title}</span>
                    {draft.currently_editing_by && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600">
                        <Users className="w-3 h-3" />
                        Editing
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[draft.status] || statusColors.draft}>
                    {draft.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm truncate max-w-[300px]">
                  {draft.tender_summary || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(draft.updated_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteId(draft.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

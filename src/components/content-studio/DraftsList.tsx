import { FileText, Clock, Users, Trash2, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

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
      <div className="space-y-3">
        {drafts.map(draft => (
          <Card 
            key={draft.id} 
            className="border-border/60 hover:border-border transition-colors cursor-pointer"
            onClick={() => onOpenDraft(draft)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{draft.title}</h3>
                    <Badge className={statusColors[draft.status] || statusColors.draft}>
                      {draft.status}
                    </Badge>
                  </div>
                  {draft.tender_summary && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {draft.tender_summary}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </span>
                    {draft.currently_editing_by && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <Users className="w-3 h-3" />
                        Being edited by {draft.currently_editing_by}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(draft.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
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

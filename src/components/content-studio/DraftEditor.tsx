import { useState, useEffect, useCallback } from 'react';
import { Save, X, History, Send, AlertCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatDistanceToNow, format } from 'date-fns';

interface DraftEditorProps {
  draftId: string;
  initialContent: string;
  onClose: () => void;
  onPublish: () => void;
}

interface Version {
  id: string;
  version_number: number;
  content: string;
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
}

const EDITOR_ID = `user-${Date.now()}`; // Simple unique ID for this session

export const DraftEditor = ({ draftId, initialContent, onClose, onPublish }: DraftEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentEditor, setCurrentEditor] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  // Claim editing lock
  useEffect(() => {
    const claimLock = async () => {
      const { data: draft } = await supabase
        .from('content_drafts')
        .select('currently_editing_by, currently_editing_since, title')
        .eq('id', draftId)
        .single();

      if (draft) {
        setDraftTitle(draft.title);
        
        // Check if someone else is editing (within last 5 minutes)
        if (draft.currently_editing_by && 
            draft.currently_editing_by !== EDITOR_ID &&
            draft.currently_editing_since) {
          const editingSince = new Date(draft.currently_editing_since);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          
          if (editingSince > fiveMinutesAgo) {
            setCurrentEditor(draft.currently_editing_by);
          }
        }
      }

      // Set ourselves as the current editor
      await supabase
        .from('content_drafts')
        .update({
          currently_editing_by: EDITOR_ID,
          currently_editing_since: new Date().toISOString(),
        })
        .eq('id', draftId);
    };

    claimLock();

    // Refresh lock periodically
    const interval = setInterval(async () => {
      await supabase
        .from('content_drafts')
        .update({ currently_editing_since: new Date().toISOString() })
        .eq('id', draftId);
    }, 60000); // Every minute

    // Release lock on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from('content_drafts')
        .update({
          currently_editing_by: null,
          currently_editing_since: null,
        })
        .eq('id', draftId);
    };
  }, [draftId]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== initialContent);
  }, [content, initialContent]);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from('content_draft_versions')
      .select('*')
      .eq('draft_id', draftId)
      .order('version_number', { ascending: false });

    if (!error && data) {
      setVersions(data as Version[]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get current version count
      const { data: currentVersions } = await supabase
        .from('content_draft_versions')
        .select('version_number')
        .eq('draft_id', draftId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (currentVersions?.[0]?.version_number || 0) + 1;

      // Save new version
      await supabase.from('content_draft_versions').insert({
        draft_id: draftId,
        version_number: nextVersion,
        content: content,
        changed_by: EDITOR_ID,
        change_summary: `Version ${nextVersion} saved`,
      });

      // Update draft content
      await supabase
        .from('content_drafts')
        .update({ draft_content: content })
        .eq('id', draftId);

      setHasUnsavedChanges(false);
      toast.success('Draft saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Update draft status to published
      await supabase
        .from('content_drafts')
        .update({ 
          status: 'published',
          draft_content: content,
        })
        .eq('id', draftId);

      // Create an offer in knowledge_entries
      const { error: offerError } = await supabase
        .from('knowledge_entries')
        .insert([{
          title: draftTitle,
          description: content.slice(0, 500),
          full_description: content,
          category: 'offer' as const,
          offer_status: 'pending' as const,
          offer_work_status: 'under_development' as const,
        }]);

      if (offerError) throw offerError;

      toast.success('Offer published to knowledge base');
      setShowPublishConfirm(false);
      onPublish();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish offer');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRestoreVersion = async (version: Version) => {
    setContent(version.content);
    setShowHistory(false);
    toast.success(`Restored to version ${version.version_number}`);
  };

  return (
    <div className="space-y-4">
      {currentEditor && currentEditor !== EDITOR_ID && (
        <Alert variant="destructive">
          <Users className="w-4 h-4" />
          <AlertDescription>
            This draft is currently being edited by another user. Your changes may conflict.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-lg">{draftTitle || 'Untitled Draft'}</CardTitle>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-yellow-600">Unsaved changes</Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => { fetchVersions(); setShowHistory(true); }}>
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" onClick={() => setShowPublishConfirm(true)}>
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="font-mono text-sm"
            placeholder="Edit your offer content..."
          />
        </CardContent>
      </Card>

      {/* Version History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {versions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No versions saved yet</p>
            ) : (
              versions.map(version => (
                <Card key={version.id} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">v{version.version_number}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(version.created_at), 'PPp')}
                          </span>
                        </div>
                        {version.change_summary && (
                          <p className="text-sm text-muted-foreground mt-1">{version.change_summary}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {version.content.slice(0, 200)}...
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRestoreVersion(version)}
                      >
                        Restore
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation */}
      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Offer</AlertDialogTitle>
            <AlertDialogDescription>
              This will publish the offer to the main Offers database. The draft will be marked as published.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? 'Publishing...' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

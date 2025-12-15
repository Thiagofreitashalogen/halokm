import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  Pencil, 
  X, 
  Save, 
  Loader2, 
  History, 
  Send, 
  Users, 
  FileText,
  Target,
  Package,
  ClipboardList,
  Sparkles,
  Calendar,
  Lightbulb,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LinkedEntityBadge } from '@/components/knowledge/LinkedEntityBadge';
import { KnowledgeCategory } from '@/types/knowledge';

interface Draft {
  id: string;
  title: string;
  status: string;
  tender_summary: string | null;
  winning_strategy: string | null;
  challenges: string[] | null;
  deliverables: string[] | null;
  requirements: string[] | null;
  draft_content: string | null;
  currently_editing_by: string | null;
  currently_editing_since: string | null;
  created_at: string;
  updated_at: string;
  selected_template_id: string | null;
  selected_style_guide_id: string | null;
  referenced_offers: string[] | null;
  referenced_methods: string[] | null;
}

interface Version {
  id: string;
  version_number: number;
  content: string;
  changed_by: string | null;
  change_summary: string | null;
  created_at: string;
}

interface ReferencedEntity {
  id: string;
  title: string;
  category: KnowledgeCategory;
}

interface DraftDetailSheetProps {
  draft: Draft | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftUpdated?: () => void;
  onNavigateToEntry?: (id: string, category: KnowledgeCategory) => void;
}

const EDITOR_ID = `user-${Date.now()}`;

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-yellow-500/10 text-yellow-600',
  approved: 'bg-green-500/10 text-green-600',
  published: 'bg-blue-500/10 text-blue-600',
};

export function DraftDetailSheet({ draft, open, onOpenChange, onDraftUpdated, onNavigateToEntry }: DraftDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentEditor, setCurrentEditor] = useState<string | null>(null);
  
  // Referenced entities
  const [referencedOffers, setReferencedOffers] = useState<ReferencedEntity[]>([]);
  const [referencedMethods, setReferencedMethods] = useState<ReferencedEntity[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  
  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStrategy, setEditStrategy] = useState('');

  // Fetch referenced entities when draft opens
  useEffect(() => {
    if (!draft || !open) {
      setReferencedOffers([]);
      setReferencedMethods([]);
      return;
    }

    const fetchReferencedEntities = async () => {
      setLoadingReferences(true);
      
      try {
        const offerIds = draft.referenced_offers || [];
        const methodIds = draft.referenced_methods || [];
        
        // Fetch offers and methods in parallel
        const [offersResult, methodsResult] = await Promise.all([
          offerIds.length > 0 
            ? supabase
                .from('knowledge_entries')
                .select('id, title, category')
                .in('id', offerIds)
            : Promise.resolve({ data: [], error: null }),
          methodIds.length > 0
            ? supabase
                .from('knowledge_entries')
                .select('id, title, category')
                .in('id', methodIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (offersResult.data) {
          setReferencedOffers(offersResult.data as ReferencedEntity[]);
        }
        if (methodsResult.data) {
          setReferencedMethods(methodsResult.data as ReferencedEntity[]);
        }
      } catch (error) {
        console.error('Error fetching referenced entities:', error);
      } finally {
        setLoadingReferences(false);
      }
    };

    fetchReferencedEntities();
  }, [draft?.id, draft?.referenced_offers, draft?.referenced_methods, open]);

  // Fetch full draft data and claim lock when editing
  useEffect(() => {
    if (!draft || !open) return;

    const checkEditingStatus = async () => {
      const { data } = await supabase
        .from('content_drafts')
        .select('currently_editing_by, currently_editing_since')
        .eq('id', draft.id)
        .single();

      if (data?.currently_editing_by && 
          data.currently_editing_by !== EDITOR_ID &&
          data.currently_editing_since) {
        const editingSince = new Date(data.currently_editing_since);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (editingSince > fiveMinutesAgo) {
          setCurrentEditor(data.currently_editing_by);
        } else {
          setCurrentEditor(null);
        }
      } else {
        setCurrentEditor(null);
      }
    };

    checkEditingStatus();
  }, [draft?.id, open]);

  // Initialize edit state when entering edit mode
  useEffect(() => {
    if (isEditing && draft) {
      setEditTitle(draft.title);
      setEditContent(draft.draft_content || '');
      setEditStrategy(draft.winning_strategy || '');
      
      // Claim editing lock
      supabase
        .from('content_drafts')
        .update({
          currently_editing_by: EDITOR_ID,
          currently_editing_since: new Date().toISOString(),
        })
        .eq('id', draft.id);
    }
  }, [isEditing, draft]);

  // Release lock when stopping edit
  useEffect(() => {
    if (!isEditing && draft) {
      supabase
        .from('content_drafts')
        .update({
          currently_editing_by: null,
          currently_editing_since: null,
        })
        .eq('id', draft.id);
    }
  }, [isEditing, draft]);

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (draft && isEditing) {
        supabase
          .from('content_drafts')
          .update({
            currently_editing_by: null,
            currently_editing_since: null,
          })
          .eq('id', draft.id);
      }
    };
  }, [draft, isEditing]);

  const fetchVersions = async () => {
    if (!draft) return;
    
    const { data, error } = await supabase
      .from('content_draft_versions')
      .select('*')
      .eq('draft_id', draft.id)
      .order('version_number', { ascending: false });

    if (!error && data) {
      setVersions(data as Version[]);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    
    setIsSaving(true);
    try {
      // Get current version count
      const { data: currentVersions } = await supabase
        .from('content_draft_versions')
        .select('version_number')
        .eq('draft_id', draft.id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = (currentVersions?.[0]?.version_number || 0) + 1;

      // Save new version
      await supabase.from('content_draft_versions').insert({
        draft_id: draft.id,
        version_number: nextVersion,
        content: editContent,
        changed_by: EDITOR_ID,
        change_summary: `Version ${nextVersion} saved`,
      });

      // Update draft
      const { error } = await supabase
        .from('content_drafts')
        .update({ 
          title: editTitle,
          draft_content: editContent,
          winning_strategy: editStrategy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draft.id);

      if (error) throw error;

      toast.success('Draft saved');
      setIsEditing(false);
      onDraftUpdated?.();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    
    setIsPublishing(true);
    try {
      // Update draft status to published
      await supabase
        .from('content_drafts')
        .update({ 
          status: 'published',
          draft_content: isEditing ? editContent : draft.draft_content,
        })
        .eq('id', draft.id);

      // Create an offer in knowledge_entries
      const { error: offerError } = await supabase
        .from('knowledge_entries')
        .insert([{
          title: isEditing ? editTitle : draft.title,
          description: (isEditing ? editContent : draft.draft_content)?.slice(0, 500),
          full_description: isEditing ? editContent : draft.draft_content,
          category: 'offer' as const,
          offer_status: 'pending' as const,
          offer_work_status: 'under_development' as const,
        }]);

      if (offerError) throw offerError;

      toast.success('Offer published to knowledge base');
      setShowPublishConfirm(false);
      setIsEditing(false);
      onOpenChange(false);
      onDraftUpdated?.();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish offer');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRestoreVersion = (version: Version) => {
    setEditContent(version.content);
    setShowHistory(false);
    setIsEditing(true);
    toast.success(`Restored to version ${version.version_number}`);
  };

  const handleClose = () => {
    setIsEditing(false);
    onOpenChange(false);
  };

  const handleEntityClick = (id: string, category: KnowledgeCategory) => {
    if (onNavigateToEntry) {
      onNavigateToEntry(id, category);
    }
  };

  if (!draft) return null;

  const hasReferences = referencedOffers.length > 0 || referencedMethods.length > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-semibold"
                    placeholder="Draft title..."
                  />
                ) : (
                  <SheetTitle className="text-xl font-semibold pr-8">
                    {draft.title}
                  </SheetTitle>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { fetchVersions(); setShowHistory(true); }}
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={statusColors[draft.status] || statusColors.draft}>
                {draft.status}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Updated {format(new Date(draft.updated_at), 'MMM d, yyyy')}
              </span>
            </div>
          </SheetHeader>

          {currentEditor && currentEditor !== EDITOR_ID && (
            <Alert variant="destructive" className="mt-4">
              <Users className="w-4 h-4" />
              <AlertDescription>
                This draft is currently being edited by another user. Your changes may conflict.
              </AlertDescription>
            </Alert>
          )}

          <Separator className="my-6" />

          <div className="space-y-6">
            {/* Tender Summary */}
            {draft.tender_summary && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Tender Summary
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {draft.tender_summary}
                </p>
              </div>
            )}

            {/* Analysis Details */}
            {(draft.challenges?.length || draft.deliverables?.length || draft.requirements?.length) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {draft.challenges && draft.challenges.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      Challenges
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {draft.challenges.map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {draft.deliverables && draft.deliverables.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      Deliverables
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {draft.deliverables.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {draft.requirements && draft.requirements.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      Requirements
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {draft.requirements.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Winning Strategy */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Winning Strategy
              </div>
              {isEditing ? (
                <Textarea
                  value={editStrategy}
                  onChange={(e) => setEditStrategy(e.target.value)}
                  rows={4}
                  className="text-sm"
                  placeholder="Winning strategy..."
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {draft.winning_strategy || '—'}
                </p>
              )}
            </div>

            {/* AI References Section */}
            {(hasReferences || loadingReferences) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="w-4 h-4 text-muted-foreground" />
                    AI References
                  </div>
                  
                  {loadingReferences ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading references...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referencedOffers.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Similar Offers</p>
                          <div className="flex flex-wrap gap-2">
                            {referencedOffers.map(offer => (
                              <LinkedEntityBadge
                                key={offer.id}
                                id={offer.id}
                                title={offer.title}
                                category={offer.category}
                                onClick={handleEntityClick}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {referencedMethods.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Recommended Methods</p>
                          <div className="flex flex-wrap gap-2">
                            {referencedMethods.map(method => (
                              <LinkedEntityBadge
                                key={method.id}
                                id={method.id}
                                title={method.title}
                                category={method.category}
                                onClick={handleEntityClick}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Draft Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Draft Content
                </div>
                {!isEditing && draft.status !== 'published' && (
                  <Button size="sm" onClick={() => setShowPublishConfirm(true)}>
                    <Send className="w-4 h-4 mr-2" />
                    Publish
                  </Button>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Edit your offer content..."
                />
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {draft.draft_content || 'No content yet'}
                  </pre>
                </div>
              )}
            </div>

            {/* Metadata */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {format(new Date(draft.created_at), 'PPp')}</p>
              <p>Last updated: {format(new Date(draft.updated_at), 'PPp')}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
                      <div className="flex-1 min-w-0">
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
    </>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Link, FileText, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EntityAutocomplete } from './EntityAutocomplete';

interface ProjectSummary {
  title: string;
  description: string;
  full_description: string;
  client: string | null;
  deliverables: string[];
  methods: string[];
  tags: string[];
  learnings: string[];
}

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectAdded: () => void;
}

type Step = 'input' | 'processing' | 'review';

export const AddProjectDialog = ({ open, onOpenChange, onProjectAdded }: AddProjectDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [driveContent, setDriveContent] = useState('');
  const [miroContent, setMiroContent] = useState('');
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newMethod, setNewMethod] = useState('');
  const [newLearning, setNewLearning] = useState('');

  const resetDialog = () => {
    setStep('input');
    setDriveContent('');
    setMiroContent('');
    setSummary(null);
    setNewTag('');
    setNewDeliverable('');
    setNewMethod('');
    setNewLearning('');
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleProcess = async () => {
    if (!driveContent.trim() && !miroContent.trim()) {
      toast({
        title: 'Content required',
        description: 'Please paste content from at least one source.',
        variant: 'destructive',
      });
      return;
    }

    setStep('processing');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('summarize-project', {
        body: { driveContent, miroContent },
      });

      if (error) throw error;

      if (data.summary) {
        setSummary(data.summary);
        setStep('review');
      } else {
        throw new Error('No summary returned');
      }
    } catch (error) {
      console.error('Error processing content:', error);
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process content',
        variant: 'destructive',
      });
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!summary) return;

    setIsSaving(true);

    try {
      // Ensure client exists if provided
      let clientId: string | null = null;
      if (summary.client?.trim()) {
        const { data: existingClient } = await supabase
          .from('knowledge_entries')
          .select('id')
          .eq('category', 'client')
          .ilike('title', summary.client.trim())
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('knowledge_entries')
            .insert({
              category: 'client' as const,
              title: summary.client.trim(),
              description: `Client created from project: ${summary.title}`,
            })
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Save the project
      const { data: projectData, error: projectError } = await supabase
        .from('knowledge_entries')
        .insert({
          category: 'project' as const,
          title: summary.title,
          description: summary.description,
          full_description: summary.full_description,
          client: summary.client,
          project_status: 'completed' as const,
          deliverables: summary.deliverables,
          tags: summary.tags,
          learnings: summary.learnings,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Link project to client
      if (clientId) {
        await supabase
          .from('project_client_links')
          .insert({
            project_id: projectData.id,
            client_id: clientId,
          });
      }

      // For each method, check if it exists or create it
      for (const methodName of summary.methods) {
        // Check if method already exists
        const { data: existingMethod } = await supabase
          .from('knowledge_entries')
          .select('id')
          .eq('category', 'method')
          .ilike('title', methodName)
          .maybeSingle();

        let methodId: string;

        if (existingMethod) {
          methodId = existingMethod.id;
        } else {
          // Create new method
          const { data: newMethod, error: methodError } = await supabase
            .from('knowledge_entries')
            .insert({
              category: 'method' as const,
              title: methodName,
              description: `Method identified from project: ${summary.title}`,
              use_cases: [`Used in: ${summary.title}`],
            })
            .select()
            .single();

          if (methodError) throw methodError;
          methodId = newMethod.id;
        }

        // Create the link between project and method
        await supabase
          .from('project_method_links')
          .insert({
            project_id: projectData.id,
            method_id: methodId,
          })
          .single();
      }

      toast({
        title: 'Project saved',
        description: `"${summary.title}" has been added to your knowledge base.`,
      });

      handleClose();
      onProjectAdded();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save project',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSummary = (field: keyof ProjectSummary, value: any) => {
    if (summary) {
      setSummary({ ...summary, [field]: value });
    }
  };

  const addToArray = (field: 'tags' | 'deliverables' | 'methods' | 'learnings', value: string, setValue: (v: string) => void) => {
    if (value.trim() && summary) {
      updateSummary(field, [...summary[field], value.trim()]);
      setValue('');
    }
  };

  const removeFromArray = (field: 'tags' | 'deliverables' | 'methods' | 'learnings', index: number) => {
    if (summary) {
      updateSummary(field, summary[field].filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'input' && (
              <>
                <Link className="w-5 h-5" />
                Add Project from Sources
              </>
            )}
            {step === 'processing' && (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                Analyzing Content...
              </>
            )}
            {step === 'review' && (
              <>
                <FileText className="w-5 h-5" />
                Review Project Summary
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Paste content from your Google Drive documents and Miro boards.'}
            {step === 'processing' && 'AI is extracting project details from your content.'}
            {step === 'review' && 'Review and edit the extracted information before saving.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="drive-content">Google Drive Content</Label>
              <Textarea
                id="drive-content"
                placeholder="Paste the content from your Google Drive documents here..."
                value={driveContent}
                onChange={(e) => setDriveContent(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="miro-content">Miro Board Content</Label>
              <Textarea
                id="miro-content"
                placeholder="Paste the content from your Miro boards here..."
                value={miroContent}
                onChange={(e) => setMiroContent(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleProcess}>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Extracting project details...</p>
          </div>
        )}

        {step === 'review' && summary && (
          <div className="space-y-6 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={summary.title}
                onChange={(e) => updateSummary('title', e.target.value)}
              />
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <EntityAutocomplete
                category="client"
                value={summary.client || ''}
                onChange={(value) => updateSummary('client', value || null)}
                placeholder="Search or create client..."
              />
              <p className="text-xs text-muted-foreground">
                Type to search existing clients or create a new one
              </p>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Short Summary</Label>
              <p className="text-xs text-muted-foreground">Maximum 3 paragraphs</p>
              <Textarea
                id="description"
                value={summary.description}
                onChange={(e) => updateSummary('description', e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <Label htmlFor="full_description">Detailed Summary</Label>
              <p className="text-xs text-muted-foreground">Goals, process, methods, and deliverables (up to 2000 words)</p>
              <Textarea
                id="full_description"
                value={summary.full_description}
                onChange={(e) => updateSummary('full_description', e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>

            {/* Deliverables */}
            <div className="space-y-2">
              <Label>Deliverables</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {summary.deliverables.map((item, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeFromArray('deliverables', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add deliverable..."
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToArray('deliverables', newDeliverable, setNewDeliverable)}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray('deliverables', newDeliverable, setNewDeliverable)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Methods */}
            <div className="space-y-2">
              <Label>Methods & Tools</Label>
              <p className="text-xs text-muted-foreground">These will be added to your Methods & Tools database</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {summary.methods.map((item, index) => (
                  <Badge key={index} variant="outline" className="gap-1 border-primary/50 text-primary">
                    {item}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeFromArray('methods', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add method or tool..."
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToArray('methods', newMethod, setNewMethod)}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray('methods', newMethod, setNewMethod)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {summary.tags.map((item, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeFromArray('tags', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToArray('tags', newTag, setNewTag)}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray('tags', newTag, setNewTag)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Learnings */}
            <div className="space-y-2">
              <Label>Key Learnings</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {summary.learnings.map((item, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeFromArray('learnings', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add learning..."
                  value={newLearning}
                  onChange={(e) => setNewLearning(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addToArray('learnings', newLearning, setNewLearning)}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => addToArray('learnings', newLearning, setNewLearning)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Project
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

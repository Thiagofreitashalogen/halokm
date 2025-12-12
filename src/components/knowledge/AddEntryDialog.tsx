import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Upload, Link, FileText, X, Plus, File, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';

interface EntrySummary {
  category: KnowledgeCategory;
  title: string;
  description: string;
  client: string | null;
  deliverables: string[];
  methods: string[];
  tags: string[];
  learnings: string[];
  // Offer specific
  offerStatus?: 'won' | 'lost' | 'pending' | 'draft';
  winFactors?: string[];
  lossFactors?: string[];
  // Project specific
  projectStatus?: 'active' | 'completed' | 'archived';
  // Method specific
  useCases?: string[];
  steps?: string[];
}

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryAdded: () => void;
  defaultCategory?: KnowledgeCategory;
}

type Step = 'input' | 'processing' | 'review';

interface UploadedFile {
  name: string;
  content: string;
  type: string;
}

export const AddEntryDialog = ({ open, onOpenChange, onEntryAdded, defaultCategory }: AddEntryDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [summary, setSummary] = useState<EntrySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // New item inputs
  const [newTag, setNewTag] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newMethod, setNewMethod] = useState('');
  const [newLearning, setNewLearning] = useState('');
  const [newUseCase, setNewUseCase] = useState('');
  const [newStep, setNewStep] = useState('');
  const [newWinFactor, setNewWinFactor] = useState('');
  const [newLossFactor, setNewLossFactor] = useState('');

  const resetDialog = () => {
    setStep('input');
    setUploadedFiles([]);
    setLinkInput('');
    setPastedContent('');
    setSummary(null);
    setNewTag('');
    setNewDeliverable('');
    setNewMethod('');
    setNewLearning('');
    setNewUseCase('');
    setNewStep('');
    setNewWinFactor('');
    setNewLossFactor('');
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // For text-based files, read as text
      if (file.type.includes('text') || 
          file.name.endsWith('.md') || 
          file.name.endsWith('.txt') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        // For other files, we'll note that we can't read the content directly
        resolve(`[File: ${file.name} - ${file.type}] - Binary file content cannot be extracted directly. Please paste relevant text content.`);
      }
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      try {
        const content = await readFileContent(file);
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          content,
          type: file.type
        }]);
      } catch (error) {
        toast({
          title: 'File read error',
          description: `Could not read ${file.name}`,
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      try {
        const content = await readFileContent(file);
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          content,
          type: file.type
        }]);
      } catch (error) {
        toast({
          title: 'File read error',
          description: `Could not read ${file.name}`,
          variant: 'destructive',
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    const hasContent = uploadedFiles.length > 0 || pastedContent.trim() || linkInput.trim();
    
    if (!hasContent) {
      toast({
        title: 'Content required',
        description: 'Please upload files, paste content, or enter a link.',
        variant: 'destructive',
      });
      return;
    }

    setStep('processing');
    setIsLoading(true);

    try {
      // Combine all content
      const fileContents = uploadedFiles.map(f => `--- File: ${f.name} ---\n${f.content}`).join('\n\n');
      
      const { data, error } = await supabase.functions.invoke('analyze-entry', {
        body: { 
          fileContents,
          pastedContent,
          links: linkInput,
          suggestedCategory: defaultCategory 
        },
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
      // Build insert data based on category
      let insertData: {
        category: KnowledgeCategory;
        title: string;
        description: string;
        client: string | null;
        tags: string[];
        learnings: string[];
        deliverables: string[];
        project_status?: 'active' | 'completed' | 'archived';
        offer_status?: 'won' | 'lost' | 'pending' | 'draft';
        win_factors?: string[];
        loss_factors?: string[];
        use_cases?: string[];
        steps?: string[];
      } = {
        category: summary.category,
        title: summary.title,
        description: summary.description,
        client: summary.client,
        tags: summary.tags,
        learnings: summary.learnings,
        deliverables: summary.deliverables,
      };

      // Add category-specific fields
      if (summary.category === 'project') {
        insertData.project_status = summary.projectStatus || 'completed';
      } else if (summary.category === 'offer') {
        insertData.offer_status = summary.offerStatus || 'draft';
        insertData.win_factors = summary.winFactors || [];
        insertData.loss_factors = summary.lossFactors || [];
      } else if (summary.category === 'method') {
        insertData.use_cases = summary.useCases || [];
        insertData.steps = summary.steps || [];
      }

      const { data: entryData, error: entryError } = await supabase
        .from('knowledge_entries')
        .insert(insertData)
        .select()
        .single();

      if (entryError) throw entryError;

      // If it's a project, link methods
      if (summary.category === 'project' && summary.methods.length > 0) {
        for (const methodName of summary.methods) {
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
            const { data: newMethod, error: methodError } = await supabase
              .from('knowledge_entries')
              .insert({
                category: 'method' as const,
                title: methodName,
                description: `Method identified from: ${summary.title}`,
                use_cases: [`Used in: ${summary.title}`],
              })
              .select()
              .single();

            if (methodError) throw methodError;
            methodId = newMethod.id;
          }

          await supabase
            .from('project_method_links')
            .insert({
              project_id: entryData.id,
              method_id: methodId,
            });
        }
      }

      toast({
        title: 'Entry saved',
        description: `"${summary.title}" has been added to your knowledge base.`,
      });

      handleClose();
      onEntryAdded();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save entry',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSummary = (field: keyof EntrySummary, value: any) => {
    if (summary) {
      setSummary({ ...summary, [field]: value });
    }
  };

  const addToArray = (field: keyof EntrySummary, value: string, setValue: (v: string) => void) => {
    if (value.trim() && summary) {
      const currentArray = (summary[field] as string[]) || [];
      updateSummary(field, [...currentArray, value.trim()]);
      setValue('');
    }
  };

  const removeFromArray = (field: keyof EntrySummary, index: number) => {
    if (summary) {
      const currentArray = (summary[field] as string[]) || [];
      updateSummary(field, currentArray.filter((_, i) => i !== index));
    }
  };

  const getCategoryLabel = (category: KnowledgeCategory) => {
    switch (category) {
      case 'project': return 'Project';
      case 'offer': return 'Offer';
      case 'method': return 'Method & Tool';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'input' && (
              <>
                <Upload className="w-5 h-5" />
                Add New Entry
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
                Review Entry
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Upload files, paste content, or enter links. AI will analyze and categorize the entry.'}
            {step === 'processing' && 'AI is analyzing your content and extracting details.'}
            {step === 'review' && 'Review and edit the extracted information before saving.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 mt-4">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop files here, or
              </p>
              <label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".txt,.md,.csv,.json,.doc,.docx,.pdf"
                />
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">Browse Files</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Supports .txt, .md, .csv, .json files
              </p>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files</Label>
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 py-1.5">
                      <File className="w-3 h-3" />
                      {file.name}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => removeFile(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Link Input */}
            <div className="space-y-2">
              <Label htmlFor="link-input" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Links
              </Label>
              <Input
                id="link-input"
                placeholder="Enter URLs (Google Drive, Miro, etc.)"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Note: Links are stored for reference. Paste the content below for AI analysis.
              </p>
            </div>

            {/* Content Paste Area */}
            <div className="space-y-2">
              <Label htmlFor="pasted-content">Paste Content</Label>
              <Textarea
                id="pasted-content"
                placeholder="Paste text content from documents, emails, or other sources..."
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                className="min-h-[150px] resize-none"
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
            <p className="text-muted-foreground">Analyzing content and extracting details...</p>
          </div>
        )}

        {step === 'review' && summary && (
          <div className="space-y-6 mt-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={summary.category}
                onValueChange={(value: KnowledgeCategory) => updateSummary('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="method">Method & Tool</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                AI detected this as a {getCategoryLabel(summary.category)}
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={summary.title}
                onChange={(e) => updateSummary('title', e.target.value)}
              />
            </div>

            {/* Client (for projects and offers) */}
            {(summary.category === 'project' || summary.category === 'offer') && (
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={summary.client || ''}
                  onChange={(e) => updateSummary('client', e.target.value || null)}
                  placeholder="Client name"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={summary.description}
                onChange={(e) => updateSummary('description', e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Status fields based on category */}
            {summary.category === 'project' && (
              <div className="space-y-2">
                <Label>Project Status</Label>
                <Select
                  value={summary.projectStatus || 'completed'}
                  onValueChange={(value) => updateSummary('projectStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {summary.category === 'offer' && (
              <div className="space-y-2">
                <Label>Offer Status</Label>
                <Select
                  value={summary.offerStatus || 'draft'}
                  onValueChange={(value) => updateSummary('offerStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Deliverables (projects/offers) */}
            {(summary.category === 'project' || summary.category === 'offer') && (
              <ArrayField
                label="Deliverables"
                items={summary.deliverables}
                onAdd={(value) => addToArray('deliverables', value, setNewDeliverable)}
                onRemove={(index) => removeFromArray('deliverables', index)}
                inputValue={newDeliverable}
                setInputValue={setNewDeliverable}
                placeholder="Add deliverable..."
              />
            )}

            {/* Methods (projects) */}
            {summary.category === 'project' && (
              <ArrayField
                label="Methods & Tools"
                hint="These will be linked to your Methods & Tools database"
                items={summary.methods}
                onAdd={(value) => addToArray('methods', value, setNewMethod)}
                onRemove={(index) => removeFromArray('methods', index)}
                inputValue={newMethod}
                setInputValue={setNewMethod}
                placeholder="Add method or tool..."
                badgeVariant="outline"
              />
            )}

            {/* Use Cases (methods) */}
            {summary.category === 'method' && (
              <>
                <ArrayField
                  label="Use Cases"
                  items={summary.useCases || []}
                  onAdd={(value) => addToArray('useCases', value, setNewUseCase)}
                  onRemove={(index) => removeFromArray('useCases', index)}
                  inputValue={newUseCase}
                  setInputValue={setNewUseCase}
                  placeholder="Add use case..."
                />
                <ArrayField
                  label="Steps"
                  items={summary.steps || []}
                  onAdd={(value) => addToArray('steps', value, setNewStep)}
                  onRemove={(index) => removeFromArray('steps', index)}
                  inputValue={newStep}
                  setInputValue={setNewStep}
                  placeholder="Add step..."
                />
              </>
            )}

            {/* Win/Loss Factors (offers) */}
            {summary.category === 'offer' && (
              <>
                <ArrayField
                  label="Win Factors"
                  items={summary.winFactors || []}
                  onAdd={(value) => addToArray('winFactors', value, setNewWinFactor)}
                  onRemove={(index) => removeFromArray('winFactors', index)}
                  inputValue={newWinFactor}
                  setInputValue={setNewWinFactor}
                  placeholder="Add win factor..."
                />
                <ArrayField
                  label="Loss Factors"
                  items={summary.lossFactors || []}
                  onAdd={(value) => addToArray('lossFactors', value, setNewLossFactor)}
                  onRemove={(index) => removeFromArray('lossFactors', index)}
                  inputValue={newLossFactor}
                  setInputValue={setNewLossFactor}
                  placeholder="Add loss factor..."
                />
              </>
            )}

            {/* Tags */}
            <ArrayField
              label="Tags"
              items={summary.tags}
              onAdd={(value) => addToArray('tags', value, setNewTag)}
              onRemove={(index) => removeFromArray('tags', index)}
              inputValue={newTag}
              setInputValue={setNewTag}
              placeholder="Add tag..."
            />

            {/* Learnings */}
            <ArrayField
              label="Key Learnings"
              items={summary.learnings}
              onAdd={(value) => addToArray('learnings', value, setNewLearning)}
              onRemove={(index) => removeFromArray('learnings', index)}
              inputValue={newLearning}
              setInputValue={setNewLearning}
              placeholder="Add learning..."
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Entry
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper component for array fields
interface ArrayFieldProps {
  label: string;
  hint?: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  placeholder: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

function ArrayField({ 
  label, 
  hint, 
  items, 
  onAdd, 
  onRemove, 
  inputValue, 
  setInputValue, 
  placeholder,
  badgeVariant = 'secondary'
}: ArrayFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, index) => (
          <Badge 
            key={index} 
            variant={badgeVariant} 
            className={`gap-1 ${badgeVariant === 'outline' ? 'border-primary/50 text-primary' : ''}`}
          >
            {item}
            <X
              className="w-3 h-3 cursor-pointer hover:text-destructive"
              onClick={() => onRemove(index)}
            />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd(inputValue))}
        />
        <Button
          size="icon"
          variant="outline"
          onClick={() => onAdd(inputValue)}
          type="button"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Upload, Link, FileText, X, Plus, File, AlertCircle, PenLine } from 'lucide-react';
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
  offerWorkStatus?: 'under_development' | 'delivered';
  winningStrategy?: string;
  lossReasons?: string;
  // Project specific
  projectStatus?: 'under_development' | 'delivered';
  referencesLinks?: string[];
  // Method specific
  useCases?: string[];
  field?: string;
  domain?: string;
  fullDescription?: string;
  // People specific
  studio?: string;
  position?: string;
  // Client specific
  industry?: string;
}

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryAdded: () => void;
  defaultCategory?: KnowledgeCategory;
}

type Step = 'input' | 'processing' | 'review';
type TabMode = 'upload' | 'scratch';

interface UploadedFile {
  name: string;
  content: string;
  type: string;
}

export const AddEntryDialog = ({ open, onOpenChange, onEntryAdded, defaultCategory }: AddEntryDialogProps) => {
  const { toast } = useToast();
  const [tabMode, setTabMode] = useState<TabMode>('upload');
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
  const [newReference, setNewReference] = useState('');

  const getDefaultSummary = (): EntrySummary => ({
    category: defaultCategory || 'project',
    title: '',
    description: '',
    client: null,
    deliverables: [],
    methods: [],
    tags: [],
    learnings: [],
    projectStatus: 'under_development',
    offerStatus: 'pending',
    offerWorkStatus: 'under_development',
    referencesLinks: [],
    useCases: [],
    field: '',
    domain: '',
    fullDescription: '',
    studio: '',
    position: '',
    industry: '',
  });

  const resetDialog = () => {
    setStep('input');
    setTabMode('upload');
    setUploadedFiles([]);
    setLinkInput('');
    setPastedContent('');
    setSummary(null);
    setNewTag('');
    setNewDeliverable('');
    setNewMethod('');
    setNewLearning('');
    setNewUseCase('');
    setNewReference('');
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
      
      if (file.type.includes('text') || 
          file.name.endsWith('.md') || 
          file.name.endsWith('.txt') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
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

  const handleStartFromScratch = () => {
    setSummary(getDefaultSummary());
    setStep('review');
  };

  const handleSave = async () => {
    if (!summary) return;

    if (!summary.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for this entry.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const insertData: Record<string, any> = {
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
        insertData.project_status = summary.projectStatus || 'under_development';
        insertData.references_links = summary.referencesLinks || [];
      } else if (summary.category === 'offer') {
        insertData.offer_status = summary.offerStatus || 'pending';
        insertData.offer_work_status = summary.offerWorkStatus || 'under_development';
        insertData.winning_strategy = summary.winningStrategy || null;
        insertData.loss_reasons = summary.lossReasons || null;
      } else if (summary.category === 'method') {
        insertData.use_cases = summary.useCases || [];
        insertData.field = summary.field || null;
        insertData.domain = summary.domain || null;
        insertData.full_description = summary.fullDescription || null;
        insertData.references_links = summary.referencesLinks || [];
      } else if (summary.category === 'person') {
        insertData.studio = summary.studio || null;
        insertData.position = summary.position || null;
      } else if (summary.category === 'client') {
        insertData.industry = summary.industry || null;
      }

      const { data: entryData, error: entryError } = await supabase
        .from('knowledge_entries')
        .insert(insertData as any)
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
              } as any)
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
      case 'client': return 'Client';
      case 'person': return 'Person';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            {step === 'input' && (
              <>
                <Plus className="w-4 h-4" />
                Add New Entry
              </>
            )}
            {step === 'processing' && (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Analyzing...
              </>
            )}
            {step === 'review' && (
              <>
                <FileText className="w-4 h-4" />
                {tabMode === 'upload' ? 'Review Entry' : 'Create Entry'}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 'input' && 'Choose how you want to add a new entry.'}
            {step === 'processing' && 'AI is analyzing your content.'}
            {step === 'review' && 'Fill in the details and save.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <Tabs value={tabMode} onValueChange={(v) => setTabMode(v as TabMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upload" className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="scratch" className="flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5" />
                Create from Scratch
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3 mt-0">
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-4 text-center transition-colors
                  ${isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-3">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">
                      Drag files here or{' '}
                      <label className="text-primary hover:underline cursor-pointer">
                        browse
                        <input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".txt,.md,.csv,.json,.doc,.docx,.pdf"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground">.txt, .md, .csv, .json</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uploadedFiles.map((file, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 py-1 text-xs">
                      <File className="w-3 h-3" />
                      {file.name}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive ml-1"
                        onClick={() => removeFile(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Link Input */}
              <div className="space-y-1">
                <Label htmlFor="link-input" className="text-xs flex items-center gap-1.5">
                  <Link className="w-3 h-3" />
                  Links (optional)
                </Label>
                <Input
                  id="link-input"
                  placeholder="Google Drive, Miro URLs..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Content Paste Area */}
              <div className="space-y-1">
                <Label htmlFor="pasted-content" className="text-xs">Paste Content</Label>
                <Textarea
                  id="pasted-content"
                  placeholder="Paste text from documents, emails, etc..."
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  className="min-h-[100px] resize-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleProcess}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Analyze with AI
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="scratch" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={defaultCategory || 'project'}
                  onValueChange={(value: KnowledgeCategory) => {
                    const newSummary = getDefaultSummary();
                    newSummary.category = value;
                    setSummary(newSummary);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="method">Method & Tool</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="person">Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-muted-foreground">
                Create a new entry by filling in the fields manually.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleStartFromScratch}>
                  <PenLine className="w-3.5 h-3.5 mr-1.5" />
                  Continue
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing content and extracting details...</p>
          </div>
        )}

        {step === 'review' && summary && (
          <div className="space-y-4 mt-4">
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
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
              {tabMode === 'upload' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  AI detected this as a {getCategoryLabel(summary.category)}
                </p>
              )}
            </div>

            {/* Title / Name */}
            <div className="space-y-2">
              <Label htmlFor="title">{summary.category === 'person' ? 'Name' : 'Title'}</Label>
              <Input
                id="title"
                value={summary.title}
                onChange={(e) => updateSummary('title', e.target.value)}
                placeholder={summary.category === 'person' ? 'Full name' : 'Entry title'}
              />
            </div>

            {/* People specific: Studio & Position */}
            {summary.category === 'person' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studio">Studio</Label>
                  <Input
                    id="studio"
                    value={summary.studio || ''}
                    onChange={(e) => updateSummary('studio', e.target.value)}
                    placeholder="e.g., Design Studio A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={summary.position || ''}
                    onChange={(e) => updateSummary('position', e.target.value)}
                    placeholder="e.g., Senior Designer"
                  />
                </div>
              </div>
            )}

            {/* Client specific: Industry */}
            {summary.category === 'client' && (
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={summary.industry || ''}
                  onChange={(e) => updateSummary('industry', e.target.value)}
                  placeholder="e.g., Healthcare, Finance, Technology"
                />
              </div>
            )}

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

            {/* Description / Summary */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {summary.category === 'method' ? 'Summary' : 'Description'}
              </Label>
              <Textarea
                id="description"
                value={summary.description}
                onChange={(e) => updateSummary('description', e.target.value)}
                className="min-h-[80px] resize-none"
                placeholder={summary.category === 'method' ? 'Brief summary of the method' : 'Description'}
              />
            </div>

            {/* Method specific: Field & Domain */}
            {summary.category === 'method' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field">Field</Label>
                  <Input
                    id="field"
                    value={summary.field || ''}
                    onChange={(e) => updateSummary('field', e.target.value)}
                    placeholder="e.g., UX Design"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={summary.domain || ''}
                    onChange={(e) => updateSummary('domain', e.target.value)}
                    placeholder="e.g., Healthcare"
                  />
                </div>
              </div>
            )}

            {/* Method specific: Full Description */}
            {summary.category === 'method' && (
              <div className="space-y-2">
                <Label htmlFor="fullDescription">Full Description</Label>
                <Textarea
                  id="fullDescription"
                  value={summary.fullDescription || ''}
                  onChange={(e) => updateSummary('fullDescription', e.target.value)}
                  className="min-h-[100px] resize-none"
                  placeholder="Detailed description of the method..."
                />
              </div>
            )}

            {/* Status fields based on category */}
            {summary.category === 'project' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={summary.projectStatus || 'under_development'}
                  onValueChange={(value) => updateSummary('projectStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_development">Under Development</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {summary.category === 'offer' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={summary.offerWorkStatus || 'under_development'}
                    onValueChange={(value) => updateSummary('offerWorkStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_development">Under Development</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Outcome</Label>
                  <Select
                    value={summary.offerStatus || 'pending'}
                    onValueChange={(value) => updateSummary('offerStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Offer specific: Winning Strategy & Loss Reasons */}
            {summary.category === 'offer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="winningStrategy">Winning Strategy</Label>
                  <Textarea
                    id="winningStrategy"
                    value={summary.winningStrategy || ''}
                    onChange={(e) => updateSummary('winningStrategy', e.target.value)}
                    className="min-h-[60px] resize-none"
                    placeholder="What made this offer successful..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lossReasons">Loss Reasons</Label>
                  <Textarea
                    id="lossReasons"
                    value={summary.lossReasons || ''}
                    onChange={(e) => updateSummary('lossReasons', e.target.value)}
                    className="min-h-[60px] resize-none"
                    placeholder="Reasons for not winning..."
                  />
                </div>
              </>
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
              <ArrayField
                label="Use Cases"
                items={summary.useCases || []}
                onAdd={(value) => addToArray('useCases', value, setNewUseCase)}
                onRemove={(index) => removeFromArray('useCases', index)}
                inputValue={newUseCase}
                setInputValue={setNewUseCase}
                placeholder="Add use case..."
              />
            )}

            {/* References (projects, methods) */}
            {(summary.category === 'project' || summary.category === 'method') && (
              <ArrayField
                label="References"
                hint="Links to related files or resources"
                items={summary.referencesLinks || []}
                onAdd={(value) => addToArray('referencesLinks', value, setNewReference)}
                onRemove={(index) => removeFromArray('referencesLinks', index)}
                inputValue={newReference}
                setInputValue={setNewReference}
                placeholder="Add link (https://...)"
              />
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

            {/* Learnings (projects) */}
            {summary.category === 'project' && (
              <ArrayField
                label="Key Learnings"
                items={summary.learnings}
                onAdd={(value) => addToArray('learnings', value, setNewLearning)}
                onRemove={(index) => removeFromArray('learnings', index)}
                inputValue={newLearning}
                setInputValue={setNewLearning}
                placeholder="Add learning..."
              />
            )}

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => setStep('input')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Entry
                </Button>
              </div>
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
      {items.length > 0 && (
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
      )}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd(inputValue))}
          className="h-8 text-sm"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={() => onAdd(inputValue)}
          type="button"
          className="h-8 w-8"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

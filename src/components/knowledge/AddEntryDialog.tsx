import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Upload, Link, FileText, X, Plus, File, AlertCircle, PenLine, LogIn, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { EntityAutocomplete } from './EntityAutocomplete';

interface EntrySummary {
  category: KnowledgeCategory;
  title: string;
  description: string;
  client: string | null;
  deliverables: string[];
  methods: string[];
  tags: string[];
  learnings: string[];
  offerStatus?: 'won' | 'lost' | 'pending' | 'draft';
  offerWorkStatus?: 'under_development' | 'delivered';
  winningStrategy?: string;
  lossReasons?: string;
  projectStatus?: 'active' | 'completed' | 'archived';
  referencesLinks?: string[];
  useCases?: string[];
  field?: string;
  domain?: string;
  fullDescription?: string;
  studio?: string;
  position?: string;
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
  isParsed?: boolean;
}

export const AddEntryDialog = ({ open, onOpenChange, onEntryAdded, defaultCategory }: AddEntryDialogProps) => {
  const { toast } = useToast();
  const { isGoogleConnected, accessToken, signInWithGoogle, user } = useGoogleAuth();
  
  const [tabMode, setTabMode] = useState<TabMode>('upload');
  const [step, setStep] = useState<Step>('input');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [summary, setSummary] = useState<EntrySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
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
    projectStatus: 'active',
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
    setProcessingStatus('');
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

  const pollForJobCompletion = async (jobId: string): Promise<string> => {
    const maxAttempts = 120; // 2 minutes max with 1 second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document?jobId=${jobId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'completed') {
        return data.content;
      } else if (data.status === 'failed') {
        throw new Error(data.error || 'Document processing failed');
      }
      
      // Still processing, wait and retry
      setProcessingStatus(`Processing document... (${attempts + 1}s)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Document processing timed out. Please try a smaller file.');
  };

  const parseDocumentWithUnstructured = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse document');
    }

    const data = await response.json();
    
    // Check if async processing was started
    if (data.jobId) {
      setProcessingStatus('Document queued for processing...');
      return await pollForJobCompletion(data.jobId);
    }
    
    return data.content;
  };

  const fetchGoogleDriveFile = async (url: string): Promise<{ content: string; fileName: string }> => {
    if (!accessToken) {
      throw new Error('Please sign in with Google to access private files');
    }

    // Step 1: Fetch file from Google Drive
    setProcessingStatus('Fetching file from Google Drive...');
    const { data: driveData, error: driveError } = await supabase.functions.invoke('fetch-google-drive', {
      body: { url, accessToken },
    });

    if (driveError || !driveData?.success) {
      throw new Error(driveData?.error || driveError?.message || 'Failed to fetch file from Google Drive');
    }

    // Step 2: If it's a PDF or binary file, parse it with Unstructured
    if (driveData.isBase64 && (driveData.mimeType.includes('pdf') || driveData.originalMimeType?.includes('presentation'))) {
      setProcessingStatus('Parsing document content...');
      
      // Convert base64 to blob
      const byteCharacters = atob(driveData.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      // Create a file-like blob for the parser
      const fileBlob = new Blob([byteArray], { type: driveData.mimeType });
      Object.defineProperty(fileBlob, 'name', { value: driveData.fileName });

      const parsedContent = await parseDocumentWithUnstructured(fileBlob as File);
      return { content: parsedContent, fileName: driveData.fileName };
    }

    // For text content, return directly
    return { content: driveData.content, fileName: driveData.fileName };
  };

  const readFileContent = async (file: File): Promise<string> => {
    // Check if it's a complex document that needs parsing
    const complexTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-powerpoint',
      'application/vnd.ms-excel',
    ];

    if (complexTypes.includes(file.type) || 
        file.name.endsWith('.pdf') || 
        file.name.endsWith('.docx') || 
        file.name.endsWith('.pptx') || 
        file.name.endsWith('.xlsx')) {
      // Parse with Unstructured
      return await parseDocumentWithUnstructured(file);
    }

    // For simple text files, read directly
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
        resolve(`[File: ${file.name} - ${file.type}] - Binary file content cannot be extracted directly.`);
      }
    });
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      try {
        setProcessingStatus(`Processing ${file.name}...`);
        const content = await readFileContent(file);
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          content,
          type: file.type,
          isParsed: true
        }]);
        setProcessingStatus('');
      } catch (error) {
        toast({
          title: 'File processing error',
          description: `Could not process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        });
        setProcessingStatus('');
      }
    }
  }, [toast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      try {
        setProcessingStatus(`Processing ${file.name}...`);
        const content = await readFileContent(file);
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          content,
          type: file.type,
          isParsed: true
        }]);
        setProcessingStatus('');
      } catch (error) {
        toast({
          title: 'File processing error',
          description: `Could not process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive',
        });
        setProcessingStatus('');
      }
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isGoogleDriveUrl = (url: string): boolean => {
    return url.includes('drive.google.com') || 
           url.includes('docs.google.com');
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

    // Check if trying to use Google Drive without being connected
    if (linkInput.trim() && isGoogleDriveUrl(linkInput) && !isGoogleConnected) {
      toast({
        title: 'Google sign-in required',
        description: 'Please sign in with Google to access private Drive files.',
        variant: 'destructive',
      });
      return;
    }

    setStep('processing');
    setIsLoading(true);

    try {
      let fileContents = uploadedFiles.map(f => `--- File: ${f.name} ---\n${f.content}`).join('\n\n');
      let additionalContent = '';

      // Process Google Drive links
      if (linkInput.trim() && isGoogleDriveUrl(linkInput)) {
        try {
          setProcessingStatus('Fetching content from Google Drive...');
          const { content, fileName } = await fetchGoogleDriveFile(linkInput.trim());
          additionalContent = `--- File: ${fileName} (from Google Drive) ---\n${content}`;
        } catch (error) {
          console.error('Google Drive fetch error:', error);
          toast({
            title: 'Google Drive error',
            description: error instanceof Error ? error.message : 'Failed to fetch file',
            variant: 'destructive',
          });
          setStep('input');
          setIsLoading(false);
          setProcessingStatus('');
          return;
        }
      }

      setProcessingStatus('Analyzing content with AI...');
      
      const { data, error } = await supabase.functions.invoke('analyze-entry', {
        body: { 
          fileContents: fileContents + (additionalContent ? '\n\n' + additionalContent : ''),
          pastedContent,
          links: isGoogleDriveUrl(linkInput) ? '' : linkInput, // Don't pass Google Drive URLs as raw links
          suggestedCategory: defaultCategory 
        },
      });

      if (error) throw error;

      if (data.summary) {
        // Clear methods for projects - users should add these manually
        if (data.summary.category === 'project') {
          data.summary.methods = [];
        }
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
      setProcessingStatus('');
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
      // If creating a project or offer with a client name, ensure the client exists
      let clientId: string | null = null;
      if ((summary.category === 'project' || summary.category === 'offer') && summary.client?.trim()) {
        // Check if client exists
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
              description: `Client created from ${summary.category}: ${summary.title}`,
            } as any)
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      const insertData: Record<string, any> = {
        category: summary.category,
        title: summary.title,
        description: summary.description,
        client: summary.client, // Keep the string for display
        tags: summary.tags,
        deliverables: summary.deliverables,
      };

      if (summary.category === 'project') {
        insertData.project_status = summary.projectStatus || 'active';
        insertData.references_links = summary.referencesLinks || [];
        insertData.full_description = summary.fullDescription || null;
        // learnings is now a text field, not auto-generated
      } else if (summary.category === 'offer') {
        insertData.offer_status = summary.offerStatus || 'pending';
        insertData.offer_work_status = summary.offerWorkStatus || 'under_development';
        insertData.winning_strategy = summary.winningStrategy || null;
        insertData.loss_reasons = summary.lossReasons || null;
        insertData.full_description = summary.fullDescription || null;
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

      // Link project to client
      if (summary.category === 'project' && clientId) {
        await supabase
          .from('project_client_links')
          .insert({
            project_id: entryData.id,
            client_id: clientId,
          });
      }

      // Link offer to client
      if (summary.category === 'offer' && clientId) {
        await supabase
          .from('offer_client_links')
          .insert({
            offer_id: entryData.id,
            client_id: clientId,
          });
      }

      // Helper function to get or create a method
      const getOrCreateMethod = async (methodName: string): Promise<string> => {
        const { data: existingMethod } = await supabase
          .from('knowledge_entries')
          .select('id')
          .eq('category', 'method')
          .ilike('title', methodName)
          .maybeSingle();

        if (existingMethod) {
          return existingMethod.id;
        }

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
        return newMethod.id;
      };

      // Link methods to projects
      if (summary.category === 'project' && summary.methods.length > 0) {
        for (const methodName of summary.methods) {
          const methodId = await getOrCreateMethod(methodName);
          await supabase
            .from('project_method_links')
            .insert({
              project_id: entryData.id,
              method_id: methodId,
            });
        }
      }

      // Link methods to offers
      if (summary.category === 'offer' && summary.methods.length > 0) {
        for (const methodName of summary.methods) {
          const methodId = await getOrCreateMethod(methodName);
          await supabase
            .from('offer_method_links')
            .insert({
              offer_id: entryData.id,
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
                Processing...
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
            {step === 'processing' && (processingStatus || 'Processing your content...')}
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
              {/* Google Sign In Banner */}
              {!isGoogleConnected ? (
                <Alert className="border-primary/30 bg-primary/5">
                  <LogIn className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span className="text-sm">Sign in with Google to import from private Drive files</span>
                    <Button size="sm" variant="outline" onClick={signInWithGoogle} className="ml-2">
                      <LogIn className="w-3.5 h-3.5 mr-1.5" />
                      Connect Google
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500/30 bg-green-500/5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    Connected as {user?.email} - You can import from private Google Drive files
                  </AlertDescription>
                </Alert>
              )}

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
                          accept=".txt,.md,.csv,.json,.pdf,.docx,.pptx,.xlsx,.doc,.ppt,.xls"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX, TXT, MD, CSV, JSON</p>
                  </div>
                </div>
              </div>

              {/* Processing Status */}
              {processingStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {processingStatus}
                </div>
              )}

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uploadedFiles.map((file, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 py-1 text-xs">
                      <File className="w-3 h-3" />
                      {file.name}
                      {file.isParsed && <CheckCircle2 className="w-3 h-3 text-green-600" />}
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
                  Google Drive / Docs / Slides URL
                </Label>
                <Input
                  id="link-input"
                  placeholder={isGoogleConnected ? "https://docs.google.com/presentation/d/..." : "Sign in with Google first to use private links"}
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  className="h-8 text-sm"
                  disabled={!isGoogleConnected && linkInput.includes('google.com')}
                />
                {linkInput && isGoogleDriveUrl(linkInput) && !isGoogleConnected && (
                  <p className="text-xs text-amber-600">Sign in with Google above to access this file</p>
                )}
              </div>

              {/* Content Paste Area */}
              <div className="space-y-1">
                <Label htmlFor="pasted-content" className="text-xs">Paste Content (optional)</Label>
                <Textarea
                  id="pasted-content"
                  placeholder="Paste text from documents, emails, etc..."
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleProcess} disabled={processingStatus !== ''}>
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
            <p className="text-muted-foreground">{processingStatus || 'Analyzing content and extracting details...'}</p>
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
                <p className="text-xs text-muted-foreground">
                  AI suggested: {getCategoryLabel(summary.category)}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={summary.title}
                onChange={(e) => updateSummary('title', e.target.value)}
                placeholder="Entry title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={summary.description}
                onChange={(e) => updateSummary('description', e.target.value)}
                placeholder="Brief description"
                className="min-h-[80px]"
              />
            </div>

            {/* Client (for projects and offers) */}
            {(summary.category === 'project' || summary.category === 'offer') && (
              <div className="space-y-2">
                <Label>Client</Label>
                <EntityAutocomplete
                  category="client"
                  value={summary.client || ''}
                  onChange={(value) => updateSummary('client', value)}
                  placeholder="Search or create client..."
                />
                <p className="text-xs text-muted-foreground">
                  Type to search existing clients or create a new one
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {summary.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeFromArray('tags', index)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('tags', newTag, setNewTag))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addToArray('tags', newTag, setNewTag)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Category-specific fields would continue here... */}
            {/* For brevity, showing just the save buttons */}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Entry'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

import { useState, useEffect } from 'react';
import { PenTool, Sparkles, FileText, Check, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DraftsList } from '@/components/content-studio/DraftsList';
import { DraftDetailSheet } from '@/components/content-studio/DraftDetailSheet';
import { TenderUpload } from '@/components/content-studio/TenderUpload';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { KnowledgeEntry, KnowledgeCategory } from '@/types/knowledge';

type Step = 'upload' | 'strategy' | 'configure' | 'generate' | 'edit';

interface TenderAnalysis {
  summary: string;
  challenges: string[];
  deliverables: string[];
  requirements: string[];
  winning_strategy: string;
  referenced_offers: string[];
  referenced_methods: string[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
}

interface StyleGuide {
  id: string;
  name: string;
  description: string | null;
}

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

const ContentStudioPage = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'drafts'>('new');
  const [step, setStep] = useState<Step>('upload');
  const [tenderContent, setTenderContent] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<TenderAnalysis | null>(null);
  const [editedStrategy, setEditedStrategy] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [styleGuides, setStyleGuides] = useState<StyleGuide[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedStyleGuideId, setSelectedStyleGuideId] = useState<string>('');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Knowledge entry navigation
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [entrySheetOpen, setEntrySheetOpen] = useState(false);

  useEffect(() => {
    fetchTemplatesAndGuides();
    fetchDrafts();
  }, []);

  const fetchTemplatesAndGuides = async () => {
    const [templatesRes, guidesRes] = await Promise.all([
      supabase.from('offer_templates').select('id, name, description'),
      supabase.from('style_guides').select('id, name, description'),
    ]);
    if (templatesRes.data) setTemplates(templatesRes.data);
    if (guidesRes.data) setStyleGuides(guidesRes.data);
  };

  const fetchDrafts = async () => {
    const { data, error } = await supabase
      .from('content_drafts')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching drafts:', error);
    } else {
      setDrafts((data || []) as Draft[]);
    }
  };

  const handleAnalyzeTender = async (content?: string) => {
    const contentToAnalyze = content || tenderContent;
    if (!contentToAnalyze.trim()) {
      toast.error('Please add tender content first');
      return;
    }

    if (content) {
      setTenderContent(content);
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-tender', {
        body: { tenderContent: contentToAnalyze },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      setAnalysis(data.analysis);
      setEditedStrategy(data.analysis.winning_strategy || '');
      setStep('strategy');
      toast.success('Tender analyzed successfully');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze tender');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveStrategy = () => {
    if (!editedStrategy.trim()) {
      toast.error('Please provide a winning strategy');
      return;
    }
    setStep('configure');
  };

  const handleGenerateDraft = async () => {
    if (!draftTitle.trim()) {
      toast.error('Please provide a title for the draft');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-offer-draft', {
        body: {
          tenderSummary: analysis?.summary,
          challenges: analysis?.challenges,
          deliverables: analysis?.deliverables,
          requirements: analysis?.requirements,
          winningStrategy: editedStrategy,
          templateId: selectedTemplateId || null,
          styleGuideId: selectedStyleGuideId || null,
          referencedMethods: analysis?.referenced_methods,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Generation failed');

      setGeneratedDraft(data.draft);

      // Save draft to database
      const { data: savedDraft, error: saveError } = await supabase
        .from('content_drafts')
        .insert({
          title: draftTitle,
          tender_summary: analysis?.summary,
          challenges: analysis?.challenges,
          deliverables: analysis?.deliverables,
          requirements: analysis?.requirements,
          winning_strategy: editedStrategy,
          draft_content: data.draft,
          selected_template_id: selectedTemplateId || null,
          selected_style_guide_id: selectedStyleGuideId || null,
          referenced_offers: analysis?.referenced_offers,
          referenced_methods: analysis?.referenced_methods,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setCurrentDraftId(savedDraft.id);
      
      // Save initial version
      await supabase.from('content_draft_versions').insert({
        draft_id: savedDraft.id,
        version_number: 1,
        content: data.draft,
        change_summary: 'Initial AI-generated draft',
      });

      setStep('edit');
      fetchDrafts();
      toast.success('Draft generated and saved');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenDraft = (draft: Draft) => {
    setSelectedDraft(draft);
    setSheetOpen(true);
  };

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedDraft(null);
    }
  };

  const handleDraftUpdated = () => {
    fetchDrafts();
    // Refresh the selected draft data
    if (selectedDraft) {
      supabase
        .from('content_drafts')
        .select('*')
        .eq('id', selectedDraft.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedDraft(data as Draft);
          }
        });
    }
  };

  const handleNavigateToEntry = async (id: string, category: KnowledgeCategory) => {
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Map snake_case to camelCase for KnowledgeEntry
      const entry: KnowledgeEntry = {
        id: data.id,
        title: data.title,
        category: data.category,
        description: data.description || '',
        tags: data.tags || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        client: data.client || undefined,
        projectStatus: data.project_status || undefined,
        startDate: data.start_date ? new Date(data.start_date) : undefined,
        dateDelivered: data.date_delivered ? new Date(data.date_delivered) : undefined,
        learnings: data.learnings || undefined,
        learningsText: data.learnings_text || undefined,
        deliverables: data.deliverables || undefined,
        referencesLinks: data.references_links || undefined,
        offerStatus: data.offer_status || undefined,
        offerWorkStatus: data.offer_work_status || undefined,
        winningStrategy: data.winning_strategy || undefined,
        lossReasons: data.loss_reasons || undefined,
        winFactors: data.win_factors || undefined,
        lossFactors: data.loss_factors || undefined,
        sourceDriveLink: data.source_drive_link || undefined,
        sourceMiroLink: data.source_miro_link || undefined,
        field: data.field || undefined,
        domain: data.domain || undefined,
        fullDescription: data.full_description || undefined,
        useCases: data.use_cases || undefined,
        studio: data.studio || undefined,
        position: data.position || undefined,
        industry: data.industry || undefined,
      };
      
      setSelectedEntry(entry);
      setEntrySheetOpen(true);
    } catch (error) {
      console.error('Error fetching entry:', error);
      toast.error('Failed to load entry');
    }
  };

  const handleEntrySheetClose = (open: boolean) => {
    setEntrySheetOpen(open);
    if (!open) {
      setSelectedEntry(null);
    }
  };

  const resetWorkflow = () => {
    setStep('upload');
    setTenderContent('');
    setDraftTitle('');
    setAnalysis(null);
    setEditedStrategy('');
    setSelectedTemplateId('');
    setSelectedStyleGuideId('');
    setGeneratedDraft('');
    setCurrentDraftId(null);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 mb-6">
      {(['upload', 'strategy', 'configure', 'generate', 'edit'] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === s ? 'bg-primary text-primary-foreground' : 
            (['upload', 'strategy', 'configure', 'generate', 'edit'].indexOf(step) > i) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {i + 1}
          </div>
          {i < 4 && <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />}
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto fade-in">
        <PageHeader
          title="AI Content Studio"
          description="Create offer proposals with AI assistance"
          icon={<PenTool className="w-5 h-5 text-muted-foreground" />}
          showAddButton={false}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'drafts')} className="mt-6">
          <TabsList>
            <TabsTrigger value="new">New Offer</TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts
              {drafts.length > 0 && (
                <Badge variant="secondary" className="ml-2">{drafts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            {renderStepIndicator()}

            {/* Step 1: Upload Tender */}
            {step === 'upload' && (
              <TenderUpload
                onContentReady={(content) => handleAnalyzeTender(content)}
                isAnalyzing={isAnalyzing}
              />
            )}

            {/* Step 2: Review Strategy */}
            {step === 'strategy' && analysis && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tender Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{analysis.summary}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Challenges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {analysis.challenges.map((c, i) => (
                          <li key={i} className="text-muted-foreground">• {c}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Deliverables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {analysis.deliverables.map((d, i) => (
                          <li key={i} className="text-muted-foreground">• {d}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {analysis.requirements.map((r, i) => (
                          <li key={i} className="text-muted-foreground">• {r}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Suggested Winning Strategy
                    </CardTitle>
                    <CardDescription>
                      Review and edit the AI-suggested strategy based on similar won offers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={editedStrategy}
                      onChange={(e) => setEditedStrategy(e.target.value)}
                      rows={8}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
                      <Button onClick={handleApproveStrategy}>
                        <Check className="w-4 h-4 mr-2" />
                        Approve Strategy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Configure Template & Style */}
            {step === 'configure' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Configure Draft
                  </CardTitle>
                  <CardDescription>
                    Select a template and style guide for the offer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Draft Title</label>
                    <Input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="e.g., Proposal for Client X - Digital Transformation"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Template (optional)</label>
                    <Select 
                      value={selectedTemplateId || "none"} 
                      onValueChange={(val) => setSelectedTemplateId(val === "none" ? "" : val)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No template</SelectItem>
                        {templates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Style Guide (optional)</label>
                    <Select 
                      value={selectedStyleGuideId || "none"} 
                      onValueChange={(val) => setSelectedStyleGuideId(val === "none" ? "" : val)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a style guide..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No style guide</SelectItem>
                        {styleGuides.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {templates.length === 0 && styleGuides.length === 0 && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        No templates or style guides configured. You can add them in Settings.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setStep('strategy')}>Back</Button>
                    <Button onClick={handleGenerateDraft} disabled={isGenerating || !draftTitle.trim()}>
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Draft
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4/5: Edit Draft - Opens in detail sheet */}
            {step === 'edit' && currentDraftId && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Check className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
                  <h3 className="text-lg font-semibold mb-2">Draft Created Successfully</h3>
                  <p className="text-muted-foreground mb-4">
                    Your offer draft has been generated and saved.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={resetWorkflow}>
                      Create Another
                    </Button>
                    <Button onClick={() => {
                      setActiveTab('drafts');
                      resetWorkflow();
                    }}>
                      View All Drafts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-6">
            <DraftsList drafts={drafts} onOpenDraft={handleOpenDraft} onRefresh={fetchDrafts} />
          </TabsContent>
        </Tabs>

        <DraftDetailSheet
          draft={selectedDraft}
          open={sheetOpen}
          onOpenChange={handleSheetClose}
          onDraftUpdated={handleDraftUpdated}
          onNavigateToEntry={handleNavigateToEntry}
        />

        <EntryDetailSheet
          entry={selectedEntry}
          open={entrySheetOpen}
          onOpenChange={handleEntrySheetClose}
        />
      </div>
    </MainLayout>
  );
};

export default ContentStudioPage;

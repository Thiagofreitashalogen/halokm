import { useState, useEffect } from 'react';
import { PenTool, Upload, Sparkles, FileText, Check, ChevronRight, Loader2, AlertCircle, Clock, Users } from 'lucide-react';
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
import { DraftEditor } from '@/components/content-studio/DraftEditor';

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
  draft_content: string | null;
  currently_editing_by: string | null;
  currently_editing_since: string | null;
  created_at: string;
  updated_at: string;
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

  const handleAnalyzeTender = async () => {
    if (!tenderContent.trim()) {
      toast.error('Please paste tender content first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-tender', {
        body: { tenderContent },
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
    setActiveTab('drafts');
  };

  const handleCloseDraft = () => {
    setSelectedDraft(null);
    fetchDrafts();
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Tender Document
                  </CardTitle>
                  <CardDescription>
                    Paste the tender/RFP content for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={tenderContent}
                    onChange={(e) => setTenderContent(e.target.value)}
                    placeholder="Paste the tender/RFP content here..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleAnalyzeTender} disabled={isAnalyzing || !tenderContent.trim()}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze Tender
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
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

            {/* Step 4/5: Edit Draft */}
            {step === 'edit' && currentDraftId && (
              <DraftEditor
                draftId={currentDraftId}
                initialContent={generatedDraft}
                onClose={resetWorkflow}
                onPublish={() => {
                  fetchDrafts();
                  resetWorkflow();
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-6">
            {selectedDraft ? (
              <DraftEditor
                draftId={selectedDraft.id}
                initialContent={selectedDraft.draft_content || ''}
                onClose={handleCloseDraft}
                onPublish={() => {
                  fetchDrafts();
                  handleCloseDraft();
                }}
              />
            ) : (
              <DraftsList drafts={drafts} onOpenDraft={handleOpenDraft} onRefresh={fetchDrafts} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ContentStudioPage;

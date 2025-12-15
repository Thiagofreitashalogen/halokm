import { useState } from 'react';
import { Brain, Send, Loader2, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { fetchEntryById } from '@/hooks/useNavigateToEntry';
import { KnowledgeEntry } from '@/types/knowledge';

interface Citation {
  id: string;
  title: string;
  category: string;
}

interface SearchResult {
  answer: string;
  citations: Citation[];
  confidence: 'high' | 'medium' | 'low';
}

const exampleQuestions = [
  "What methods have we used for service design projects?",
  "Which offers did we win in the healthcare sector?",
  "What are common reasons we lose offers?",
  "Who has experience with workshop facilitation?",
  "What learnings do we have from completed projects?",
];

export default function SmartSearchPage() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const { toast } = useToast();

  // Entry detail sheet state
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSearch = async (searchQuestion?: string) => {
    const q = searchQuestion || question;
    if (!q.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('smart-search', {
        body: { question: q },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: 'Search failed',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setResult(data);
    } catch (err) {
      console.error('Smart search error:', err);
      toast({
        title: 'Search failed',
        description: 'Failed to search the knowledge base. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = async (citation: Citation) => {
    const entry = await fetchEntryById(citation.id);
    if (entry) {
      setSelectedEntry(entry);
      setSheetOpen(true);
    } else {
      toast({
        title: 'Entry not found',
        description: 'Could not load the referenced entry.',
        variant: 'destructive',
      });
    }
  };

  const handleExampleClick = (example: string) => {
    setQuestion(example);
    handleSearch(example);
  };

  // Format answer with clickable citations
  const formatAnswer = (answer: string, citations: Citation[]) => {
    const parts = answer.split(/(\[REF:[a-f0-9-]+\])/gi);
    
    return parts.map((part, index) => {
      const match = part.match(/\[REF:([a-f0-9-]+)\]/i);
      if (match) {
        const citationId = match[1];
        const citation = citations.find((c) => c.id === citationId);
        if (citation) {
          return (
            <button
              key={index}
              onClick={() => handleCitationClick(citation)}
              className="inline-flex items-center mx-0.5"
            >
              <Badge 
                variant="secondary" 
                className="cursor-pointer hover:bg-accent transition-colors text-xs"
              >
                {citation.title}
              </Badge>
            </button>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return 'bg-[hsl(var(--category-project))]';
      case 'offer': return 'bg-[hsl(var(--category-offer))]';
      case 'method': return 'bg-[hsl(var(--category-method))]';
      case 'client': return 'bg-primary';
      case 'person': return 'bg-[hsl(var(--category-person))]';
      default: return 'bg-muted';
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Smart Search</h1>
              <p className="text-sm text-muted-foreground">
                Ask questions about your knowledge base in natural language
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <Card className="p-4 mb-6">
          <div className="space-y-3">
            <Textarea
              placeholder="Ask a question about your projects, offers, methods, clients, or team..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={() => handleSearch()} 
                disabled={isLoading || !question.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Example Questions */}
        {!result && !isLoading && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="text-sm px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground">Searching the knowledge base...</p>
            </div>
          </Card>
        )}

        {/* Result */}
        {result && !isLoading && (
          <Card className="p-6">
            {/* Answer */}
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {formatAnswer(result.answer, result.citations)}
              </p>
            </div>

            {/* Citations */}
            {result.citations.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Sources referenced:</p>
                <div className="flex flex-wrap gap-2">
                  {result.citations.map((citation) => (
                    <button
                      key={citation.id}
                      onClick={() => handleCitationClick(citation)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary hover:bg-accent transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${getCategoryColor(citation.category)}`} />
                      <span className="text-sm">{citation.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        ({citation.category})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <Badge 
                  variant={result.confidence === 'high' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {result.confidence}
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Entry Detail Sheet */}
      <EntryDetailSheet
        entry={selectedEntry}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </MainLayout>
  );
}

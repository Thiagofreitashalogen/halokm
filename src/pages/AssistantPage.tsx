import { Sparkles, MessageSquare, Wand2, FileSearch } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AssistantPage = () => {
  const features = [
    {
      icon: FileSearch,
      title: 'Smart Search',
      description: 'Ask natural language questions to find relevant knowledge across all entries.',
    },
    {
      icon: Wand2,
      title: 'Auto-Organize',
      description: 'AI helps categorize, tag, and structure new knowledge entries.',
    },
    {
      icon: MessageSquare,
      title: 'Offer Drafting',
      description: 'Get AI assistance writing proposals using your templates and past wins.',
    },
  ];

  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto fade-in">
        <PageHeader
          title="AI Assistant"
          description="Intelligent help for managing knowledge and writing offers"
          icon={<Sparkles className="w-5 h-5 text-category-method" />}
          showAddButton={false}
        />

        <Card className="mb-6 border-dashed border-2 border-border/60 bg-muted/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We're building AI-powered features to help you manage knowledge and write better offers. 
              This will include RAG-based search, automated categorization, and offer drafting assistance.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Planned Features</h3>
          <div className="grid gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AssistantPage;

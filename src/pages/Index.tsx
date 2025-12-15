import { useState } from 'react';
import { Database, FolderOpen, FileText, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { FilterBar } from '@/components/knowledge/FilterBar';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { AddEntryDialog } from '@/components/knowledge/AddEntryDialog';
import { useKnowledge } from '@/hooks/useKnowledge';
import { KnowledgeEntry } from '@/types/knowledge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchEntryById } from '@/hooks/useNavigateToEntry';

const Index = () => {
  const { entries, filters, setFilters, stats, refetch } = useKnowledge();
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const statCards = [
    { label: 'Projects', value: stats.projects, icon: FolderOpen, color: 'text-category-project' },
    { label: 'Offers', value: stats.offers, icon: FileText, color: 'text-category-offer' },
    { label: 'Methods', value: stats.methods, icon: Lightbulb, color: 'text-category-method' },
    { label: 'Won', value: stats.wonOffers, icon: TrendingUp, color: 'text-status-won' },
    { label: 'Lost', value: stats.lostOffers, icon: TrendingDown, color: 'text-status-lost' },
  ];

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto fade-in">
        <PageHeader
          title="All Entries"
          description="Browse and search your organization's knowledge base"
          icon={<Database className="w-5 h-5 text-muted-foreground" />}
          count={entries.length}
          onAddClick={() => setShowAddDialog(true)}
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <FilterBar filters={filters} onFiltersChange={setFilters} />

        <div className="mt-6">
          <KnowledgeList entries={entries} onEntryClick={setSelectedEntry} onEntriesDeleted={refetch} />
        </div>

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onEntryUpdated={refetch}
          onNavigateToEntry={async (id) => {
            const entry = await fetchEntryById(id);
            if (entry) setSelectedEntry(entry);
          }}
        />

        <AddEntryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onEntryAdded={refetch}
        />
      </div>
    </MainLayout>
  );
};

export default Index;

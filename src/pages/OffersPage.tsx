import { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Clock } from 'lucide-react';
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

const OffersPage = () => {
  const { entries, allEntries, filters, setFilters, stats, refetch } = useKnowledge('offer');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const offerEntries = allEntries.filter(e => e.category === 'offer');
  const wonCount = offerEntries.filter(e => e.offerStatus === 'won').length;
  const lostCount = offerEntries.filter(e => e.offerStatus === 'lost').length;
  const pendingCount = offerEntries.filter(e => e.offerStatus === 'pending').length;
  const winRate = offerEntries.length > 0 
    ? Math.round((wonCount / (wonCount + lostCount)) * 100) 
    : 0;

  const offerStats = [
    { label: 'Won', value: wonCount, icon: TrendingUp, color: 'text-status-won' },
    { label: 'Lost', value: lostCount, icon: TrendingDown, color: 'text-status-lost' },
    { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-status-pending' },
    { label: 'Win Rate', value: `${winRate}%`, icon: FileText, color: 'text-foreground' },
  ];


  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto fade-in">
        <PageHeader
          title="Offers"
          description="Track proposals, tenders, and their outcomes"
          icon={<FileText className="w-5 h-5 text-category-offer" />}
          count={stats.total}
          onAddClick={() => setShowAddDialog(true)}
        />

        {/* Offer stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {offerStats.map((stat) => (
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

        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          showCategoryFilter={false}
        />


        <div className="mt-6">
          <KnowledgeList entries={entries} onEntryClick={setSelectedEntry} onEntriesDeleted={refetch} category="offer" />
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
          defaultCategory="offer"
        />
      </div>
    </MainLayout>
  );
};

export default OffersPage;

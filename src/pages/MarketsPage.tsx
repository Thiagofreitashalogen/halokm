import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { FilterBar } from '@/components/knowledge/FilterBar';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { AddEntryDialog } from '@/components/knowledge/AddEntryDialog';
import { KnowledgeEntry } from '@/types/knowledge';
import { useKnowledge } from '@/hooks/useKnowledge';
import { Globe } from 'lucide-react';

export default function MarketsPage() {
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { entries, filters, setFilters, isLoading, refetch } = useKnowledge('market');

  const handleAddClick = () => {
    setShowAddDialog(true);
  };

  const handleEntryAdded = () => {
    setShowAddDialog(false);
    refetch();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Markets"
          description="Market segments and industry verticals"
          icon={<Globe className="w-5 h-5 text-muted-foreground" />}
          count={entries.length}
          onAddClick={handleAddClick}
        />

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          showCategoryFilter={false}
        />

        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading markets...</div>
        ) : (
          <KnowledgeList
            entries={entries}
            onEntryClick={setSelectedEntry}
            onEntriesDeleted={() => {
              refetch();
              setRefreshKey(prev => prev + 1);
            }}
            refreshKey={refreshKey}
          />
        )}

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onEntryUpdated={() => {
            refetch();
            setRefreshKey(prev => prev + 1);
          }}
          onNavigateToEntry={(entryId) => {
            // Close current sheet, then fetch and display the new entry
            setSelectedEntry(null);
            // Fetch the entry by ID and display it
            import('@/integrations/supabase/client').then(({ supabase }) => {
              supabase
                .from('knowledge_entries')
                .select('*')
                .eq('id', entryId)
                .maybeSingle()
                .then(({ data }) => {
                  if (data) {
                    setSelectedEntry({
                      id: data.id,
                      title: data.title,
                      category: data.category as any,
                      description: data.description || '',
                      tags: data.tags || [],
                      createdAt: new Date(data.created_at),
                      updatedAt: new Date(data.updated_at),
                      client: data.client || undefined,
                      projectStatus: data.project_status || undefined,
                      offerStatus: data.offer_status || undefined,
                      offerWorkStatus: data.offer_work_status || undefined,
                      field: data.field || undefined,
                      domain: data.domain || undefined,
                      industry: data.industry || undefined,
                      studio: data.studio || undefined,
                      position: data.position || undefined,
                    });
                  }
                });
            });
          }}
        />

        <AddEntryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onEntryAdded={handleEntryAdded}
          defaultCategory="market"
        />
      </div>
    </MainLayout>
  );
}

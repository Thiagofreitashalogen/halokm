import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { FilterBar } from '@/components/knowledge/FilterBar';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { AddEntryDialog } from '@/components/knowledge/AddEntryDialog';
import { useKnowledge } from '@/hooks/useKnowledge';
import { KnowledgeEntry } from '@/types/knowledge';

const MethodsPage = () => {
  const { entries, filters, setFilters, stats, refetch } = useKnowledge('method');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto fade-in">
        <PageHeader
          title="Methods & Tools"
          description="Reusable frameworks, processes, and design methodologies"
          icon={<Lightbulb className="w-5 h-5 text-category-method" />}
          count={stats.total}
          onAddClick={() => setShowAddDialog(true)}
        />

        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          showCategoryFilter={false}
        />

        <div className="mt-6">
          <KnowledgeList entries={entries} onEntryClick={setSelectedEntry} onEntriesDeleted={refetch} />
        </div>

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onEntryUpdated={refetch}
        />

        <AddEntryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onEntryAdded={refetch}
          defaultCategory="method"
        />
      </div>
    </MainLayout>
  );
};

export default MethodsPage;

import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { FilterBar } from '@/components/knowledge/FilterBar';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { useKnowledge } from '@/hooks/useKnowledge';
import { KnowledgeEntry } from '@/types/knowledge';

const ProjectsPage = () => {
  const { entries, filters, setFilters, stats } = useKnowledge('project');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto fade-in">
        <PageHeader
          title="Projects"
          description="Case studies and learnings from completed projects"
          icon={<FolderOpen className="w-5 h-5 text-category-project" />}
          count={stats.total}
        />

        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          showCategoryFilter={false}
        />

        <div className="mt-6">
          <KnowledgeList entries={entries} onEntryClick={setSelectedEntry} />
        </div>

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
        />
      </div>
    </MainLayout>
  );
};

export default ProjectsPage;

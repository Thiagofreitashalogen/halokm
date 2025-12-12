import { useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { FilterBar } from '@/components/knowledge/FilterBar';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { AddEntryDialog } from '@/components/knowledge/AddEntryDialog';
import { useKnowledge } from '@/hooks/useKnowledge';
import { KnowledgeEntry } from '@/types/knowledge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProjectsPage = () => {
  const { filters, setFilters } = useKnowledge('project');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('knowledge_entries')
        .select('*')
        .eq('category', 'project')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map database entries to KnowledgeEntry type
      const mappedEntries: KnowledgeEntry[] = (data || []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description || '',
        category: entry.category as 'project',
        projectStatus: entry.project_status as 'active' | 'completed' | 'archived' | undefined,
        client: entry.client || undefined,
        tags: entry.tags || [],
        learnings: entry.learnings || [],
        deliverables: entry.deliverables || [],
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));

      setEntries(mappedEntries);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filters.search]);

  const handleAddClick = () => {
    setShowAddDialog(true);
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto fade-in">
        <PageHeader
          title="Projects"
          description="Case studies and learnings from completed projects"
          icon={<FolderOpen className="w-5 h-5 text-category-project" />}
          count={entries.length}
          onAddClick={handleAddClick}
        />

        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          showCategoryFilter={false}
        />

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : (
            <KnowledgeList entries={entries} onEntryClick={setSelectedEntry} />
          )}
        </div>

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onEntryUpdated={fetchProjects}
        />

        <AddEntryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onEntryAdded={fetchProjects}
          defaultCategory="project"
        />
      </div>
    </MainLayout>
  );
};

export default ProjectsPage;

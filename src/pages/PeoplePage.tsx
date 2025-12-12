import { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
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

const PeoplePage = () => {
  const { filters, setFilters } = useKnowledge('person');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPeople = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('knowledge_entries')
        .select('*')
        .eq('category', 'person')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedEntries: KnowledgeEntry[] = (data || []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description || '',
        category: 'person' as const,
        studio: entry.studio || undefined,
        position: entry.position || undefined,
        tags: entry.tags || [],
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));

      setEntries(mappedEntries);
    } catch (error) {
      console.error('Error fetching people:', error);
      toast({
        title: 'Error',
        description: 'Failed to load people',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [filters.search]);

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto fade-in">
        <PageHeader
          title="People"
          description="Team members and their expertise"
          icon={<UserCircle className="w-5 h-5 text-primary" />}
          count={entries.length}
          onAddClick={() => setShowAddDialog(true)}
        />

        <FilterBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          showCategoryFilter={false}
        />

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading people...</div>
          ) : (
            <KnowledgeList entries={entries} onEntryClick={setSelectedEntry} onEntriesDeleted={fetchPeople} />
          )}
        </div>

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onEntryUpdated={fetchPeople}
        />

        <AddEntryDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onEntryAdded={fetchPeople}
          defaultCategory="person"
        />
      </div>
    </MainLayout>
  );
};

export default PeoplePage;

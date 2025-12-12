import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { FilterBar } from '@/components/knowledge/FilterBar';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { AddEntryDialog } from '@/components/knowledge/AddEntryDialog';
import { KnowledgeEntry, FilterState } from '@/types/knowledge';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';

const ClientsPage = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    tags: [],
  });

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('category', 'client')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return;
    }

    const mapped: KnowledgeEntry[] = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category as KnowledgeEntry['category'],
      description: row.description || '',
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      industry: row.industry || undefined,
    }));

    setEntries(mapped);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredEntries = entries.filter((entry) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        entry.title.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        (entry.industry && entry.industry.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some((tag) => entry.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    return true;
  });

  const handleEntryAdded = () => {
    fetchEntries();
    setIsAddDialogOpen(false);
  };

  const handleEntryClick = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
  };

  return (
    <MainLayout>
      <div className="flex-1 p-6">
        <PageHeader
          title="Clients"
          description="Manage your client relationships and history"
          icon={<Building2 className="w-5 h-5" />}
          onAddClick={() => setIsAddDialogOpen(true)}
        />

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          showCategoryFilter={false}
        />

        <div className="mt-6">
          <KnowledgeList
            entries={filteredEntries}
            onEntryClick={handleEntryClick}
            onEntriesDeleted={fetchEntries}
            category="client"
          />
        </div>

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onEntryUpdated={fetchEntries}
        />

        <AddEntryDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onEntryAdded={handleEntryAdded}
          defaultCategory="client"
        />
      </div>
    </MainLayout>
  );
};

export default ClientsPage;

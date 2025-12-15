import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { EntryDetailSheet } from '@/components/knowledge/EntryDetailSheet';
import { useKnowledge } from '@/hooks/useKnowledge';
import { KnowledgeEntry } from '@/types/knowledge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { allTags } from '@/data/sampleData';
import { fetchEntryById } from '@/hooks/useNavigateToEntry';

const SearchPage = () => {
  const { entries, filters, setFilters } = useKnowledge();
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    setFilters({ ...filters, tags: selectedTags });
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto fade-in">
        <PageHeader
          title="Search"
          description="Find entries across your knowledge base"
          icon={<Search className="w-5 h-5 text-muted-foreground" />}
          showAddButton={false}
        />

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, client, or tag..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-11 h-12 text-base bg-background border-border"
            />
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Popular tags</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.slice(0, 12).map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {(filters.search || selectedTags.length > 0) && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {entries.length} result{entries.length !== 1 ? 's' : ''} found
            </p>
            <KnowledgeList entries={entries} onEntryClick={setSelectedEntry} />
          </div>
        )}

        {!filters.search && selectedTags.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Start searching</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Type in the search box or select tags to find relevant knowledge entries
            </p>
          </div>
        )}

        <EntryDetailSheet
          entry={selectedEntry}
          open={!!selectedEntry}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          onNavigateToEntry={async (id) => {
            const entry = await fetchEntryById(id);
            if (entry) setSelectedEntry(entry);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default SearchPage;

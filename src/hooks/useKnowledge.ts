import { useState, useMemo } from 'react';
import { KnowledgeEntry, FilterState, KnowledgeCategory } from '@/types/knowledge';
import { sampleEntries } from '@/data/sampleData';

export function useKnowledge(categoryFilter?: KnowledgeCategory) {
  const [entries] = useState<KnowledgeEntry[]>(sampleEntries);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: categoryFilter ? [categoryFilter] : [],
    tags: [],
  });

  const filteredEntries = useMemo(() => {
    let result = entries;

    // Filter by category (from prop or filters)
    if (categoryFilter) {
      result = result.filter((entry) => entry.category === categoryFilter);
    } else if (filters.categories.length > 0) {
      result = result.filter((entry) => filters.categories.includes(entry.category));
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          entry.client?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      result = result.filter((entry) =>
        filters.tags.some((tag) => entry.tags.includes(tag))
      );
    }

    // Sort by updated date
    result = [...result].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    return result;
  }, [entries, filters, categoryFilter]);

  const stats = useMemo(() => {
    const all = categoryFilter 
      ? entries.filter(e => e.category === categoryFilter)
      : entries;
    
    return {
      total: all.length,
      projects: entries.filter((e) => e.category === 'project').length,
      offers: entries.filter((e) => e.category === 'offer').length,
      methods: entries.filter((e) => e.category === 'method').length,
      wonOffers: entries.filter((e) => e.offerStatus === 'won').length,
      lostOffers: entries.filter((e) => e.offerStatus === 'lost').length,
    };
  }, [entries, categoryFilter]);

  return {
    entries: filteredEntries,
    allEntries: entries,
    filters,
    setFilters,
    stats,
  };
}

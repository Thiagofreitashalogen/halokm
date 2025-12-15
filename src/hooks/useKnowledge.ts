import { useState, useMemo, useEffect } from 'react';
import { KnowledgeEntry, FilterState, KnowledgeCategory } from '@/types/knowledge';
import { supabase } from '@/integrations/supabase/client';

export function useKnowledge(categoryFilter?: KnowledgeCategory) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: categoryFilter ? [categoryFilter] : [],
    tags: [],
  });

  // Fetch entries from Supabase
  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('knowledge_entries')
          .select('*')
          .order('created_at', { ascending: false });

        if (categoryFilter) {
          query = query.eq('category', categoryFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        const mapped: KnowledgeEntry[] = (data || []).map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category as KnowledgeCategory,
          description: row.description || '',
          tags: row.tags || [],
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          client: row.client || undefined,
          projectStatus: row.project_status || undefined,
          offerStatus: row.offer_status || undefined,
          offerWorkStatus: row.offer_work_status || undefined,
          startDate: row.start_date ? new Date(row.start_date) : undefined,
          dateDelivered: row.date_delivered ? new Date(row.date_delivered) : undefined,
          deliverables: row.deliverables || undefined,
          learnings: row.learnings || undefined,
          learningsText: row.learnings_text || undefined,
          referencesLinks: row.references_links || undefined,
          sourceDriveLink: row.source_drive_link || undefined,
          sourceMiroLink: row.source_miro_link || undefined,
          winFactors: row.win_factors || undefined,
          lossFactors: row.loss_factors || undefined,
          winningStrategy: row.winning_strategy || undefined,
          lossReasons: row.loss_reasons || undefined,
          useCases: row.use_cases || undefined,
          fullDescription: row.full_description || undefined,
          field: row.field || undefined,
          domain: row.domain || undefined,
          industry: row.industry || undefined,
          studio: row.studio || undefined,
          position: row.position || undefined,
        }));

        setEntries(mapped);
      } catch (error) {
        console.error('Error fetching entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [categoryFilter, refreshTrigger]);

  const filteredEntries = useMemo(() => {
    let result = entries;

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
  }, [entries, filters]);

  const stats = useMemo(() => {
    return {
      total: entries.length,
      projects: entries.filter((e) => e.category === 'project').length,
      offers: entries.filter((e) => e.category === 'offer').length,
      methods: entries.filter((e) => e.category === 'method').length,
      wonOffers: entries.filter((e) => e.offerStatus === 'won').length,
      lostOffers: entries.filter((e) => e.offerStatus === 'lost').length,
    };
  }, [entries]);

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    entries: filteredEntries,
    allEntries: entries,
    filters,
    setFilters,
    stats,
    isLoading,
    refetch,
  };
}

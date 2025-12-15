import { supabase } from '@/integrations/supabase/client';
import { KnowledgeEntry } from '@/types/knowledge';

export async function fetchEntryById(entryId: string): Promise<KnowledgeEntry | null> {
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (error || !data) {
    console.error('Error fetching entry:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    category: data.category,
    projectStatus: data.project_status || undefined,
    offerStatus: data.offer_status || undefined,
    offerWorkStatus: data.offer_work_status || undefined,
    client: data.client || undefined,
    tags: data.tags || [],
    learnings: data.learnings || [],
    deliverables: data.deliverables || [],
    startDate: data.start_date ? new Date(data.start_date) : undefined,
    dateDelivered: data.date_delivered ? new Date(data.date_delivered) : undefined,
    referencesLinks: data.references_links || [],
    winFactors: data.win_factors || [],
    lossFactors: data.loss_factors || [],
    winningStrategy: data.winning_strategy || undefined,
    lossReasons: data.loss_reasons || undefined,
    field: data.field || undefined,
    domain: data.domain || undefined,
    useCases: data.use_cases || [],
    fullDescription: data.full_description || undefined,
    studio: data.studio || undefined,
    position: data.position || undefined,
    industry: data.industry || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

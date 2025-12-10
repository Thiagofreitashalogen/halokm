export type KnowledgeCategory = 'project' | 'offer' | 'method';

export type OfferStatus = 'won' | 'lost' | 'pending' | 'draft';
export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Project specific
  client?: string;
  projectStatus?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  learnings?: string[];
  deliverables?: string[];
  
  // Offer specific
  offerStatus?: OfferStatus;
  proposalValue?: number;
  winFactors?: string[];
  lossReasons?: string[];
  
  // Method/Tool specific
  useCase?: string;
  useCases?: string[];
  steps?: string[];
  
  // Common
  relatedEntries?: string[];
  attachments?: string[];
  source?: string;
}

export interface FilterState {
  search: string;
  categories: KnowledgeCategory[];
  tags: string[];
  status?: string;
}

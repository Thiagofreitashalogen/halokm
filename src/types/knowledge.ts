export type KnowledgeCategory = 'project' | 'offer' | 'method';

export type OfferOutcome = 'won' | 'lost' | 'pending';
export type OfferWorkStatus = 'under_development' | 'delivered';
export type ProjectStatus = 'under_development' | 'delivered';

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
  dateDelivered?: Date;
  learnings?: string[];
  deliverables?: string[];
  referencesLinks?: string[];
  peopleInvolved?: string[]; // IDs of people entries
  methodsUsed?: string[]; // IDs of method entries
  
  // Offer specific
  offerOutcome?: OfferOutcome;
  offerWorkStatus?: OfferWorkStatus;
  winningStrategy?: string;
  lossReasons?: string;
  
  // Method/Tool specific
  field?: string;
  domain?: string;
  fullDescription?: string;
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

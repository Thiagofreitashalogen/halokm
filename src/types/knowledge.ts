export type KnowledgeCategory = 'project' | 'offer' | 'method';

export type OfferOutcome = 'won' | 'lost' | 'pending';
export type OfferWorkStatus = 'under_development' | 'delivered';
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
  offerOutcome?: OfferOutcome;
  offerWorkStatus?: OfferWorkStatus;
  dateDelivered?: Date;
  winningStrategy?: string;
  lossReasons?: string;
  peopleInvolved?: string[]; // IDs of people entries
  methodsUsed?: string[]; // IDs of method entries
  
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

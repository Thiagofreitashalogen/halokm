export type KnowledgeCategory = 'project' | 'offer' | 'method' | 'client' | 'person';

export type OfferStatus = 'draft' | 'pending' | 'won' | 'lost';
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
  dateDelivered?: Date;
  learnings?: string[]; // Legacy array field
  learningsText?: string; // New text field for learnings
  deliverables?: string[];
  referencesLinks?: string[];
  peopleInvolved?: string[]; // IDs of people entries
  methodsUsed?: string[]; // IDs of method entries
  
  // Offer specific
  offerStatus?: OfferStatus;
  offerWorkStatus?: OfferWorkStatus;
  winningStrategy?: string;
  lossReasons?: string;
  winFactors?: string[];
  lossFactors?: string[];
  sourceDriveLink?: string;
  sourceMiroLink?: string;
  
  // Method/Tool specific
  field?: string;
  domain?: string;
  fullDescription?: string;
  useCase?: string;
  useCases?: string[];
  
  // People specific
  studio?: string;
  position?: string;
  clientIds?: string[]; // IDs of client entries
  expertiseMethodIds?: string[]; // IDs of method entries
  
  // Client specific
  industry?: string;
  projectIds?: string[]; // IDs of project entries
  
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

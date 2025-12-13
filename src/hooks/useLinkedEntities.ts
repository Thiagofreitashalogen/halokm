import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';

interface LinkedEntity {
  id: string;
  title: string;
}

interface LinkedEntitiesResult {
  linkedClient: LinkedEntity | null;
  linkedMethods: LinkedEntity[];
  linkedPeople: LinkedEntity[];
  linkedProjects: LinkedEntity[];
  linkedOffers: LinkedEntity[];
  linkedClients: LinkedEntity[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}

// Fetch linked clients for multiple entries at once (for table view)
export async function fetchLinkedClientsForEntries(
  entryIds: string[], 
  categories: Record<string, KnowledgeCategory>
): Promise<Record<string, LinkedEntity | null>> {
  if (entryIds.length === 0) return {};
  
  const result: Record<string, LinkedEntity | null> = {};
  
  // Separate project and offer IDs
  const projectIds = entryIds.filter(id => categories[id] === 'project');
  const offerIds = entryIds.filter(id => categories[id] === 'offer');
  
  // Fetch project_client_links
  if (projectIds.length > 0) {
    const { data: projectLinks } = await supabase
      .from('project_client_links')
      .select('project_id, client_id')
      .in('project_id', projectIds);
    
    if (projectLinks && projectLinks.length > 0) {
      const clientIds = [...new Set(projectLinks.map(l => l.client_id))];
      const { data: clients } = await supabase
        .from('knowledge_entries')
        .select('id, title')
        .in('id', clientIds);
      
      const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
      projectLinks.forEach(link => {
        result[link.project_id] = clientMap.get(link.client_id) || null;
      });
    }
  }
  
  // Fetch offer_client_links
  if (offerIds.length > 0) {
    const { data: offerLinks } = await supabase
      .from('offer_client_links')
      .select('offer_id, client_id')
      .in('offer_id', offerIds);
    
    if (offerLinks && offerLinks.length > 0) {
      const clientIds = [...new Set(offerLinks.map(l => l.client_id))];
      const { data: clients } = await supabase
        .from('knowledge_entries')
        .select('id, title')
        .in('id', clientIds);
      
      const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
      offerLinks.forEach(link => {
        result[link.offer_id] = clientMap.get(link.client_id) || null;
      });
    }
  }
  
  // Fill in nulls for entries without links
  entryIds.forEach(id => {
    if (!(id in result)) result[id] = null;
  });
  
  return result;
}

// Hook for fetching linked entities for table display
export function useLinkedClientsForTable(entries: { id: string; category: KnowledgeCategory }[]) {
  const [linkedClients, setLinkedClients] = useState<Record<string, LinkedEntity | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchClients = async () => {
      // Filter for projects and offers
      const relevantEntries = entries.filter(e => e.category === 'project' || e.category === 'offer');
      
      if (relevantEntries.length === 0) {
        setLinkedClients({});
        return;
      }
      
      // Build category map
      const categoryMap: Record<string, KnowledgeCategory> = {};
      relevantEntries.forEach(e => {
        categoryMap[e.id] = e.category;
      });
      
      setIsLoading(true);
      try {
        const clients = await fetchLinkedClientsForEntries(
          relevantEntries.map(e => e.id),
          categoryMap
        );
        setLinkedClients(clients);
      } catch (error) {
        console.error('Error fetching linked clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClients();
  }, [entries.map(e => e.id).join(',')]);
  
  return { linkedClients, isLoading };
}

// Hook for fetching all linked entities for a single entry (for detail sheet)
export function useLinkedEntitiesForEntry(entryId: string | null, category: KnowledgeCategory | null) {
  const [linkedClient, setLinkedClient] = useState<LinkedEntity | null>(null);
  const [linkedMethods, setLinkedMethods] = useState<LinkedEntity[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<LinkedEntity[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<LinkedEntity[]>([]);
  const [linkedOffers, setLinkedOffers] = useState<LinkedEntity[]>([]);
  const [linkedClients, setLinkedClients] = useState<LinkedEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const refetch = useCallback(async () => {
    if (!entryId || !category) {
      setLinkedClient(null);
      setLinkedMethods([]);
      setLinkedPeople([]);
      setLinkedProjects([]);
      setLinkedOffers([]);
      setLinkedClients([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Fetch linked client for projects
      if (category === 'project') {
        const { data: clientLinks } = await supabase
          .from('project_client_links')
          .select('client_id')
          .eq('project_id', entryId);
        
        if (clientLinks && clientLinks.length > 0) {
          const { data: client } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .eq('id', clientLinks[0].client_id)
            .maybeSingle();
          
          setLinkedClient(client);
        } else {
          setLinkedClient(null);
        }
        
        // Fetch linked methods
        const { data: methodLinks } = await supabase
          .from('project_method_links')
          .select('method_id')
          .eq('project_id', entryId);
        
        if (methodLinks && methodLinks.length > 0) {
          const { data: methods } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', methodLinks.map(l => l.method_id));
          
          setLinkedMethods(methods || []);
        } else {
          setLinkedMethods([]);
        }
        
        // Fetch linked people
        const { data: peopleLinks } = await supabase
          .from('project_people_links')
          .select('person_id')
          .eq('project_id', entryId);
        
        if (peopleLinks && peopleLinks.length > 0) {
          const { data: people } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', peopleLinks.map(l => l.person_id));
          
          setLinkedPeople(people || []);
        } else {
          setLinkedPeople([]);
        }
      }
      
      // Fetch linked entities for offers
      if (category === 'offer') {
        // Fetch linked client from offer_client_links
        const { data: clientLinks } = await supabase
          .from('offer_client_links')
          .select('client_id')
          .eq('offer_id', entryId);
        
        if (clientLinks && clientLinks.length > 0) {
          const { data: client } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .eq('id', clientLinks[0].client_id)
            .maybeSingle();
          
          setLinkedClient(client);
        } else {
          setLinkedClient(null);
        }
        
        // Fetch linked methods
        const { data: methodLinks } = await supabase
          .from('offer_method_links')
          .select('method_id')
          .eq('offer_id', entryId);
        
        if (methodLinks && methodLinks.length > 0) {
          const { data: methods } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', methodLinks.map(l => l.method_id));
          
          setLinkedMethods(methods || []);
        } else {
          setLinkedMethods([]);
        }
        
        // Fetch linked people
        const { data: peopleLinks } = await supabase
          .from('offer_people_links')
          .select('person_id')
          .eq('offer_id', entryId);
        
        if (peopleLinks && peopleLinks.length > 0) {
          const { data: people } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', peopleLinks.map(l => l.person_id));
          
          setLinkedPeople(people || []);
        } else {
          setLinkedPeople([]);
        }
      }
      
      // Fetch linked entities for clients
      if (category === 'client') {
        setLinkedClient(null);
        
        // Fetch linked projects
        const { data: projectLinks } = await supabase
          .from('project_client_links')
          .select('project_id')
          .eq('client_id', entryId);
        
        if (projectLinks && projectLinks.length > 0) {
          const { data: projects } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', projectLinks.map(l => l.project_id));
          
          setLinkedProjects(projects || []);
        } else {
          setLinkedProjects([]);
        }
        
        // Fetch linked offers
        const { data: offerLinks } = await supabase
          .from('offer_client_links')
          .select('offer_id')
          .eq('client_id', entryId);
        
        if (offerLinks && offerLinks.length > 0) {
          const { data: offers } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', offerLinks.map(l => l.offer_id));
          
          setLinkedOffers(offers || []);
        } else {
          setLinkedOffers([]);
        }
        
        // Fetch linked people
        const { data: peopleLinks } = await supabase
          .from('people_client_links')
          .select('person_id')
          .eq('client_id', entryId);
        
        if (peopleLinks && peopleLinks.length > 0) {
          const { data: people } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', peopleLinks.map(l => l.person_id));
          
          setLinkedPeople(people || []);
        } else {
          setLinkedPeople([]);
        }
        
        // Reset methods for client
        setLinkedMethods([]);
      }
      
      // Fetch linked entities for people (reverse relationships)
      if (category === 'person') {
        setLinkedClient(null);
        
        // Fetch linked projects via project_people_links
        const { data: projectLinks } = await supabase
          .from('project_people_links')
          .select('project_id')
          .eq('person_id', entryId);
        
        if (projectLinks && projectLinks.length > 0) {
          const { data: projects } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', projectLinks.map(l => l.project_id));
          
          setLinkedProjects(projects || []);
        } else {
          setLinkedProjects([]);
        }
        
        // Fetch linked offers via offer_people_links
        const { data: offerLinks } = await supabase
          .from('offer_people_links')
          .select('offer_id')
          .eq('person_id', entryId);
        
        if (offerLinks && offerLinks.length > 0) {
          const { data: offers } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', offerLinks.map(l => l.offer_id));
          
          setLinkedOffers(offers || []);
        } else {
          setLinkedOffers([]);
        }
        
        // Fetch linked clients via people_client_links
        const { data: clientLinks } = await supabase
          .from('people_client_links')
          .select('client_id')
          .eq('person_id', entryId);
        
        if (clientLinks && clientLinks.length > 0) {
          const { data: clients } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', clientLinks.map(l => l.client_id));
          
          setLinkedClients(clients || []);
        } else {
          setLinkedClients([]);
        }
        
        // Fetch method expertise via people_method_expertise
        const { data: methodLinks } = await supabase
          .from('people_method_expertise')
          .select('method_id')
          .eq('person_id', entryId);
        
        if (methodLinks && methodLinks.length > 0) {
          const { data: methods } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', methodLinks.map(l => l.method_id));
          
          setLinkedMethods(methods || []);
        } else {
          setLinkedMethods([]);
        }
        
        // Reset people for person
        setLinkedPeople([]);
      }
      
      // Fetch linked entities for methods (reverse relationships)
      if (category === 'method') {
        setLinkedClient(null);
        
        // Fetch linked projects via project_method_links
        const { data: projectLinks } = await supabase
          .from('project_method_links')
          .select('project_id')
          .eq('method_id', entryId);
        
        if (projectLinks && projectLinks.length > 0) {
          const { data: projects } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', projectLinks.map(l => l.project_id));
          
          setLinkedProjects(projects || []);
        } else {
          setLinkedProjects([]);
        }
        
        // Fetch linked offers via offer_method_links
        const { data: offerLinks } = await supabase
          .from('offer_method_links')
          .select('offer_id')
          .eq('method_id', entryId);
        
        if (offerLinks && offerLinks.length > 0) {
          const { data: offers } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', offerLinks.map(l => l.offer_id));
          
          setLinkedOffers(offers || []);
        } else {
          setLinkedOffers([]);
        }
        
        // Fetch people with this method expertise via people_method_expertise
        const { data: peopleLinks } = await supabase
          .from('people_method_expertise')
          .select('person_id')
          .eq('method_id', entryId);
        
        if (peopleLinks && peopleLinks.length > 0) {
          const { data: people } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', peopleLinks.map(l => l.person_id));
          
          setLinkedPeople(people || []);
        } else {
          setLinkedPeople([]);
        }
        
        // Reset methods and clients for method
        setLinkedMethods([]);
        setLinkedClients([]);
      }
    } catch (error) {
      console.error('Error fetching linked entities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entryId, category]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { linkedClient, linkedMethods, linkedPeople, linkedProjects, linkedOffers, linkedClients, isLoading, refetch };
}

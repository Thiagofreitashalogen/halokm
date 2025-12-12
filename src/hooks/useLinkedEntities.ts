import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';

interface LinkedEntity {
  id: string;
  title: string;
}

interface LinkedEntitiesMap {
  [entryId: string]: {
    clients?: LinkedEntity[];
    methods?: LinkedEntity[];
    people?: LinkedEntity[];
  };
}

// Fetch linked clients for a single entry (project or offer)
export async function fetchLinkedClient(entryId: string, category: KnowledgeCategory): Promise<LinkedEntity | null> {
  if (category !== 'project' && category !== 'offer') return null;
  
  const linkTable = category === 'project' ? 'project_client_links' : 'project_client_links';
  const linkColumn = category === 'project' ? 'project_id' : 'project_id';
  
  // For projects, use project_client_links
  if (category === 'project') {
    const { data: links } = await supabase
      .from('project_client_links')
      .select('client_id')
      .eq('project_id', entryId);
    
    if (links && links.length > 0) {
      const { data: client } = await supabase
        .from('knowledge_entries')
        .select('id, title')
        .eq('id', links[0].client_id)
        .maybeSingle();
      
      return client;
    }
  }
  
  // For offers, we need to check if there's a client link table for offers
  // Looking at the schema, offers don't have a direct client link table
  // They store client as text. Let's check for offer_client_links or use project_client_links pattern
  // Based on schema, there's no offer_client_links, so we need to add one or use the text field
  // For now, let's return null for offers and we can add the table later
  
  return null;
}

// Fetch linked clients for multiple entries at once (for table view)
export async function fetchLinkedClientsForEntries(entryIds: string[]): Promise<Record<string, LinkedEntity | null>> {
  if (entryIds.length === 0) return {};
  
  const result: Record<string, LinkedEntity | null> = {};
  
  // Fetch all project_client_links for these entries
  const { data: projectLinks } = await supabase
    .from('project_client_links')
    .select('project_id, client_id')
    .in('project_id', entryIds);
  
  if (!projectLinks || projectLinks.length === 0) {
    entryIds.forEach(id => result[id] = null);
    return result;
  }
  
  // Get unique client IDs
  const clientIds = [...new Set(projectLinks.map(l => l.client_id))];
  
  // Fetch all clients
  const { data: clients } = await supabase
    .from('knowledge_entries')
    .select('id, title')
    .in('id', clientIds);
  
  const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
  
  // Map project IDs to their clients
  projectLinks.forEach(link => {
    result[link.project_id] = clientMap.get(link.client_id) || null;
  });
  
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
      // Only fetch for projects (offers don't have client junction table yet)
      const projectIds = entries
        .filter(e => e.category === 'project')
        .map(e => e.id);
      
      if (projectIds.length === 0) {
        setLinkedClients({});
        return;
      }
      
      setIsLoading(true);
      try {
        const clients = await fetchLinkedClientsForEntries(projectIds);
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
  const [isLoading, setIsLoading] = useState(false);
  
  const refetch = useCallback(async () => {
    if (!entryId || !category) {
      setLinkedClient(null);
      setLinkedMethods([]);
      setLinkedPeople([]);
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
        // Offers don't have client junction table - we'll add one
        setLinkedClient(null);
        
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
          
          // Store projects in methods for now (we can refactor later)
          setLinkedMethods(projects || []);
        } else {
          setLinkedMethods([]);
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
  
  return { linkedClient, linkedMethods, linkedPeople, isLoading, refetch };
}

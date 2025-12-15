import { useState, useEffect, useRef } from 'react';
import { KnowledgeEntry, KnowledgeCategory } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { EntityAutocomplete } from './EntityAutocomplete';
import { LinkedEntityBadge } from './LinkedEntityBadge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Building2, Calendar, CheckCircle, XCircle, Lightbulb, Pencil, X, Save, Loader2, Plus, Link2, ExternalLink, FolderKanban, Users, Wrench, FileText, Tag, Briefcase, MapPin, Factory, BookOpen, Target, Upload, Sparkles, File } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EntryDetailSheetProps {
  entry: KnowledgeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryUpdated?: () => void;
  onNavigateToEntry?: (entryId: string) => void;
}

export function EntryDetailSheet({ entry, open, onOpenChange, onEntryUpdated, onNavigateToEntry }: EntryDetailSheetProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<KnowledgeEntry>>({});
  const [newTag, setNewTag] = useState('');
  const [newLearning, setNewLearning] = useState('');
  const [newUseCase, setNewUseCase] = useState('');
  const [newReference, setNewReference] = useState('');
  
  // Document upload states
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const lossReasonsFileInputRef = useRef<HTMLInputElement>(null);
  
  // Uploaded documents for offers
  const [uploadedDocuments, setUploadedDocuments] = useState<{name: string; url: string}[]>([]);
  
  // Linked client for project/offer view
  const [linkedClient, setLinkedClient] = useState<{id: string; title: string} | null>(null);
  
  // Linked entities for client view
  const [linkedProjects, setLinkedProjects] = useState<{id: string; title: string}[]>([]);
  const [linkedPeople, setLinkedPeople] = useState<{id: string; title: string}[]>([]);
  
  // Linked entities for project view
  const [linkedMethods, setLinkedMethods] = useState<{id: string; title: string}[]>([]);
  const [linkedProjectPeople, setLinkedProjectPeople] = useState<{id: string; title: string}[]>([]);
  
  // Linked entities for offer view
  const [linkedOfferMethods, setLinkedOfferMethods] = useState<{id: string; title: string}[]>([]);
  const [linkedOfferPeople, setLinkedOfferPeople] = useState<{id: string; title: string}[]>([]);
  const [linkedOfferClient, setLinkedOfferClient] = useState<{id: string; title: string} | null>(null);
  
  // Linked entities for person view (reverse relationships)
  const [linkedPersonProjects, setLinkedPersonProjects] = useState<{id: string; title: string}[]>([]);
  const [linkedPersonOffers, setLinkedPersonOffers] = useState<{id: string; title: string}[]>([]);
  const [linkedPersonClients, setLinkedPersonClients] = useState<{id: string; title: string}[]>([]);
  const [linkedPersonMethods, setLinkedPersonMethods] = useState<{id: string; title: string}[]>([]);
  
  // Edit state for client linked entities
  const [editLinkedProjectIds, setEditLinkedProjectIds] = useState<string[]>([]);
  const [editLinkedPeopleIds, setEditLinkedPeopleIds] = useState<string[]>([]);
  
  // Edit state for project linked entities
  const [editLinkedMethodIds, setEditLinkedMethodIds] = useState<string[]>([]);
  const [editLinkedProjectPeopleIds, setEditLinkedProjectPeopleIds] = useState<string[]>([]);
  
  // Edit state for offer linked entities
  const [editLinkedOfferMethodIds, setEditLinkedOfferMethodIds] = useState<string[]>([]);
  const [editLinkedOfferPeopleIds, setEditLinkedOfferPeopleIds] = useState<string[]>([]);
  const [editLinkedOfferClientId, setEditLinkedOfferClientId] = useState<string | null>(null);

  // Fetch linked entities when viewing a client or project
  useEffect(() => {
    const fetchLinkedEntities = async () => {
      if (!entry || !open) return;
      
      // Client: fetch linked projects and people
      if (entry.category === 'client') {
        // Fetch linked projects
        const { data: projectLinks } = await supabase
          .from('project_client_links')
          .select('project_id')
          .eq('client_id', entry.id);
        
        if (projectLinks && projectLinks.length > 0) {
          const projectIds = projectLinks.map(l => l.project_id);
          const { data: projects } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', projectIds);
          setLinkedProjects(projects || []);
        } else {
          setLinkedProjects([]);
        }
        
        // Fetch linked people
        const { data: peopleLinks } = await supabase
          .from('people_client_links')
          .select('person_id')
          .eq('client_id', entry.id);
        
        if (peopleLinks && peopleLinks.length > 0) {
          const peopleIds = peopleLinks.map(l => l.person_id);
          const { data: people } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', peopleIds);
          setLinkedPeople(people || []);
        } else {
          setLinkedPeople([]);
        }
      }
      
      // Project: fetch linked client, methods and people
      if (entry.category === 'project') {
        // Fetch linked client
        const { data: clientLinks } = await supabase
          .from('project_client_links')
          .select('client_id')
          .eq('project_id', entry.id);
        
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
          .eq('project_id', entry.id);
        
        const methodIds = methodLinks?.map(l => l.method_id) || [];
        if (methodIds.length > 0) {
          const { data: methods } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', methodIds);
          setLinkedMethods(methods || []);
        } else {
          setLinkedMethods([]);
        }
        
        // Fetch linked people
        const { data: peopleLinks } = await supabase
          .from('project_people_links')
          .select('person_id')
          .eq('project_id', entry.id);
        
        const peopleIds = peopleLinks?.map(l => l.person_id) || [];
        if (peopleIds.length > 0) {
          const { data: people } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', peopleIds);
          setLinkedProjectPeople(people || []);
        } else {
          setLinkedProjectPeople([]);
        }
      }
      
      // Offer: fetch linked client, methods and people
      if (entry.category === 'offer') {
        // Fetch linked client
        const { data: clientLinks } = await supabase
          .from('offer_client_links')
          .select('client_id')
          .eq('offer_id', entry.id);
        
        if (clientLinks && clientLinks.length > 0) {
          const { data: client } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .eq('id', clientLinks[0].client_id)
            .maybeSingle();
          setLinkedOfferClient(client);
        } else {
          setLinkedOfferClient(null);
        }
        
        // Fetch linked methods
        const { data: methodLinks } = await supabase
          .from('offer_method_links')
          .select('method_id')
          .eq('offer_id', entry.id);
        
        const methodIds = methodLinks?.map(l => l.method_id) || [];
        if (methodIds.length > 0) {
          const { data: methods } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', methodIds);
          setLinkedOfferMethods(methods || []);
        } else {
          setLinkedOfferMethods([]);
        }
        
        // Fetch linked people
        const { data: peopleLinks } = await supabase
          .from('offer_people_links')
          .select('person_id')
          .eq('offer_id', entry.id);
        
        const peopleIds = peopleLinks?.map(l => l.person_id) || [];
        if (peopleIds.length > 0) {
          const { data: people } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', peopleIds);
          setLinkedOfferPeople(people || []);
        } else {
          setLinkedOfferPeople([]);
        }
      }
      
      // Person: fetch linked projects, offers, clients, and methods (reverse relationships)
      if (entry.category === 'person') {
        // Fetch linked projects via project_people_links
        const { data: projectLinks } = await supabase
          .from('project_people_links')
          .select('project_id')
          .eq('person_id', entry.id);
        
        if (projectLinks && projectLinks.length > 0) {
          const projectIds = projectLinks.map(l => l.project_id);
          const { data: projects } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', projectIds);
          setLinkedPersonProjects(projects || []);
        } else {
          setLinkedPersonProjects([]);
        }
        
        // Fetch linked offers via offer_people_links
        const { data: offerLinks } = await supabase
          .from('offer_people_links')
          .select('offer_id')
          .eq('person_id', entry.id);
        
        if (offerLinks && offerLinks.length > 0) {
          const offerIds = offerLinks.map(l => l.offer_id);
          const { data: offers } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', offerIds);
          setLinkedPersonOffers(offers || []);
        } else {
          setLinkedPersonOffers([]);
        }
        
        // Fetch linked clients via people_client_links
        const { data: clientLinks } = await supabase
          .from('people_client_links')
          .select('client_id')
          .eq('person_id', entry.id);
        
        if (clientLinks && clientLinks.length > 0) {
          const clientIds = clientLinks.map(l => l.client_id);
          const { data: clients } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', clientIds);
          setLinkedPersonClients(clients || []);
        } else {
          setLinkedPersonClients([]);
        }
        
        // Fetch method expertise via people_method_expertise
        const { data: methodLinks } = await supabase
          .from('people_method_expertise')
          .select('method_id')
          .eq('person_id', entry.id);
        
        if (methodLinks && methodLinks.length > 0) {
          const methodIds = methodLinks.map(l => l.method_id);
          const { data: methods } = await supabase
            .from('knowledge_entries')
            .select('id, title')
            .in('id', methodIds);
          setLinkedPersonMethods(methods || []);
        } else {
          setLinkedPersonMethods([]);
        }
      }
    };
    
    // Reset edit state when entry changes
    setEditLinkedMethodIds([]);
    setEditLinkedProjectPeopleIds([]);
    setEditLinkedProjectIds([]);
    setEditLinkedPeopleIds([]);
    setEditLinkedOfferMethodIds([]);
    setEditLinkedOfferPeopleIds([]);
    setLinkedClient(null);
    setLinkedOfferClient(null);
    setLinkedPersonProjects([]);
    setLinkedPersonOffers([]);
    setLinkedPersonClients([]);
    setLinkedPersonMethods([]);
    
    fetchLinkedEntities();
  }, [entry?.id, open]);

  // Sync edit state when linked entities are loaded while already editing
  useEffect(() => {
    if (isEditing && entry?.category === 'project') {
      if (linkedMethods.length > 0 && editLinkedMethodIds.length === 0) {
        setEditLinkedMethodIds(linkedMethods.map(m => m.id));
      }
      if (linkedProjectPeople.length > 0 && editLinkedProjectPeopleIds.length === 0) {
        setEditLinkedProjectPeopleIds(linkedProjectPeople.map(p => p.id));
      }
    }
    if (isEditing && entry?.category === 'client') {
      if (linkedProjects.length > 0 && editLinkedProjectIds.length === 0) {
        setEditLinkedProjectIds(linkedProjects.map(p => p.id));
      }
      if (linkedPeople.length > 0 && editLinkedPeopleIds.length === 0) {
        setEditLinkedPeopleIds(linkedPeople.map(p => p.id));
      }
    }
    if (isEditing && entry?.category === 'offer') {
      if (linkedOfferMethods.length > 0 && editLinkedOfferMethodIds.length === 0) {
        setEditLinkedOfferMethodIds(linkedOfferMethods.map(m => m.id));
      }
      if (linkedOfferPeople.length > 0 && editLinkedOfferPeopleIds.length === 0) {
        setEditLinkedOfferPeopleIds(linkedOfferPeople.map(p => p.id));
      }
    }
  }, [isEditing, linkedMethods, linkedProjectPeople, linkedProjects, linkedPeople, linkedOfferMethods, linkedOfferPeople, entry?.category]);

  // Fetch uploaded documents for offers
  useEffect(() => {
    const fetchUploadedDocuments = async () => {
      if (!entry || entry.category !== 'offer') {
        setUploadedDocuments([]);
        return;
      }
      
      try {
        const { data: files, error } = await supabase.storage
          .from('knowledge')
          .list(`offers/${entry.id}/documents`);
        
        if (error) {
          console.error('Error fetching documents:', error);
          return;
        }
        
        if (files && files.length > 0) {
          const docs = await Promise.all(
            files.map(async (file) => {
              const { data } = supabase.storage
                .from('knowledge')
                .getPublicUrl(`offers/${entry.id}/documents/${file.name}`);
              return { name: file.name, url: data.publicUrl };
            })
          );
          setUploadedDocuments(docs);
        } else {
          setUploadedDocuments([]);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    };
    
    fetchUploadedDocuments();
  }, [entry?.id, entry?.category]);

  // Handle document upload for loss reasons analysis
  const handleLossReasonsDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !entry) return;
    
    setIsUploadingDoc(true);
    
    try {
      // 1. Upload file to storage
      const filePath = `offers/${entry.id}/documents/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Add to uploaded documents list
      const { data: urlData } = supabase.storage
        .from('knowledge')
        .getPublicUrl(filePath);
      
      setUploadedDocuments(prev => [...prev, { name: file.name, url: urlData.publicUrl }]);
      
      toast({
        title: 'Document uploaded',
        description: 'Analyzing document content...',
      });
      
      // 2. Parse the document
      setIsAnalyzingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const parseResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );
      
      if (!parseResponse.ok) {
        throw new Error('Failed to parse document');
      }
      
      const parseResult = await parseResponse.json();
      let documentContent = parseResult.text || parseResult.content || '';
      
      // Handle async parsing
      if (parseResult.jobId) {
        // Poll for completion
        let attempts = 0;
        while (attempts < 30) {
          await new Promise(r => setTimeout(r, 2000));
          const statusResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document?jobId=${parseResult.jobId}`,
            {
              headers: {
                'Authorization': `Bearer ${sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
            }
          );
          const statusResult = await statusResponse.json();
          if (statusResult.status === 'completed') {
            documentContent = statusResult.content || '';
            break;
          } else if (statusResult.status === 'failed') {
            throw new Error(statusResult.error || 'Document parsing failed');
          }
          attempts++;
        }
      }
      
      if (!documentContent) {
        throw new Error('No content extracted from document');
      }
      
      // 3. Analyze with AI
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke('analyze-loss-reasons', {
        body: { documentContent, entryTitle: entry.title }
      });
      
      if (analyzeError) throw analyzeError;
      
      if (analyzeData?.summary) {
        // Update the loss reasons field
        const existingReasons = editData.lossReasons || entry.lossReasons || '';
        const newReasons = existingReasons 
          ? `${existingReasons}\n\n--- AI Analysis from ${file.name} ---\n${analyzeData.summary}`
          : analyzeData.summary;
        
        setEditData(prev => ({ ...prev, lossReasons: newReasons }));
        
        toast({
          title: 'Analysis complete',
          description: 'Loss reasons have been updated with AI insights.',
        });
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDoc(false);
      setIsAnalyzingDoc(false);
      if (lossReasonsFileInputRef.current) {
        lossReasonsFileInputRef.current.value = '';
      }
    }
  };

  if (!entry) return null;

  const status = entry.offerStatus || entry.projectStatus;

  const startEditing = () => {
    setEditData({
      title: entry.title,
      description: entry.description,
      client: entry.client,
      tags: [...(entry.tags || [])],
      learnings: [...(entry.learnings || [])],
      deliverables: [...(entry.deliverables || [])],
      referencesLinks: [...(entry.referencesLinks || [])],
      winningStrategy: entry.winningStrategy || '',
      lossReasons: entry.lossReasons || '',
      useCases: [...(entry.useCases || [])],
      projectStatus: entry.projectStatus,
      offerStatus: entry.offerStatus,
      offerWorkStatus: entry.offerWorkStatus,
      field: entry.field || '',
      domain: entry.domain || '',
      fullDescription: entry.fullDescription || '',
      studio: entry.studio || '',
      position: entry.position || '',
      industry: entry.industry || '',
    });
    // Initialize linked entity IDs for clients
    if (entry.category === 'client') {
      setEditLinkedProjectIds(linkedProjects.map(p => p.id));
      setEditLinkedPeopleIds(linkedPeople.map(p => p.id));
    }
    // Initialize linked entity IDs for projects
    if (entry.category === 'project') {
      setEditLinkedMethodIds(linkedMethods.map(m => m.id));
      setEditLinkedProjectPeopleIds(linkedProjectPeople.map(p => p.id));
    }
    // Initialize linked entity IDs for offers
    if (entry.category === 'offer') {
      setEditLinkedOfferMethodIds(linkedOfferMethods.map(m => m.id));
      setEditLinkedOfferPeopleIds(linkedOfferPeople.map(p => p.id));
      setEditLinkedOfferClientId(linkedOfferClient?.id || null);
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
    setNewTag('');
    setNewLearning('');
    setNewUseCase('');
    setNewReference('');
    setEditLinkedProjectIds([]);
    setEditLinkedPeopleIds([]);
    setEditLinkedMethodIds([]);
    setEditLinkedProjectPeopleIds([]);
    setEditLinkedOfferMethodIds([]);
    setEditLinkedOfferPeopleIds([]);
    setEditLinkedOfferClientId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: Record<string, any> = {
        title: editData.title,
        description: editData.description,
        client: editData.client || null,
        tags: editData.tags || [],
        learnings: editData.learnings || [],
        deliverables: editData.deliverables || [],
      };

      if (entry.category === 'project') {
        updateData.project_status = editData.projectStatus;
        updateData.references_links = editData.referencesLinks || [];
      } else if (entry.category === 'offer') {
        updateData.offer_status = editData.offerStatus;
        updateData.offer_work_status = editData.offerWorkStatus;
        updateData.winning_strategy = editData.winningStrategy || null;
        updateData.loss_reasons = editData.lossReasons || null;
        updateData.full_description = editData.fullDescription || null;
      } else if (entry.category === 'method') {
        updateData.use_cases = editData.useCases || [];
        updateData.field = editData.field || null;
        updateData.domain = editData.domain || null;
        updateData.full_description = editData.fullDescription || null;
        updateData.references_links = editData.referencesLinks || [];
      } else if (entry.category === 'person') {
        updateData.studio = editData.studio || null;
        updateData.position = editData.position || null;
      } else if (entry.category === 'client') {
        updateData.industry = editData.industry || null;
      }

      const { error } = await supabase
        .from('knowledge_entries')
        .update(updateData)
        .eq('id', entry.id);

      if (error) throw error;

      // Handle project-client linking
      if (entry.category === 'project' && editData.clientIds && editData.clientIds.length > 0) {
        // Remove existing links
        await supabase
          .from('project_client_links')
          .delete()
          .eq('project_id', entry.id);

        // Add new links
        for (const clientId of editData.clientIds) {
          await supabase
            .from('project_client_links')
            .insert({
              project_id: entry.id,
              client_id: clientId,
            });
        }
      }

      // Handle client-project linking
      if (entry.category === 'client') {
        // Remove existing project links
        await supabase
          .from('project_client_links')
          .delete()
          .eq('client_id', entry.id);

        // Add new project links
        for (const projectId of editLinkedProjectIds) {
          await supabase
            .from('project_client_links')
            .insert({
              project_id: projectId,
              client_id: entry.id,
            });
        }

        // Remove existing people links
        await supabase
          .from('people_client_links')
          .delete()
          .eq('client_id', entry.id);

        // Add new people links
        for (const personId of editLinkedPeopleIds) {
          await supabase
            .from('people_client_links')
            .insert({
              person_id: personId,
              client_id: entry.id,
            });
        }
      }

      // Handle project-method and project-people linking
      if (entry.category === 'project') {
        // Remove existing method links
        await supabase
          .from('project_method_links')
          .delete()
          .eq('project_id', entry.id);

        // Add new method links
        for (const methodId of editLinkedMethodIds) {
          await supabase
            .from('project_method_links')
            .insert({
              project_id: entry.id,
              method_id: methodId,
            });
        }

        // Remove existing people links
        await supabase
          .from('project_people_links')
          .delete()
          .eq('project_id', entry.id);

        // Add new people links
        for (const personId of editLinkedProjectPeopleIds) {
          await supabase
            .from('project_people_links')
            .insert({
              project_id: entry.id,
              person_id: personId,
            });
        }
      }

      // Handle offer-method, offer-people, and offer-client linking
      if (entry.category === 'offer') {
        // Remove existing client links
        await supabase
          .from('offer_client_links')
          .delete()
          .eq('offer_id', entry.id);

        // Add new client link if set
        if (editLinkedOfferClientId) {
          await supabase
            .from('offer_client_links')
            .insert({
              offer_id: entry.id,
              client_id: editLinkedOfferClientId,
            });
        }

        // Remove existing method links
        await supabase
          .from('offer_method_links')
          .delete()
          .eq('offer_id', entry.id);

        // Add new method links
        for (const methodId of editLinkedOfferMethodIds) {
          await supabase
            .from('offer_method_links')
            .insert({
              offer_id: entry.id,
              method_id: methodId,
            });
        }

        // Remove existing people links
        await supabase
          .from('offer_people_links')
          .delete()
          .eq('offer_id', entry.id);

        // Add new people links
        for (const personId of editLinkedOfferPeopleIds) {
          await supabase
            .from('offer_people_links')
            .insert({
              offer_id: entry.id,
              person_id: personId,
            });
        }
      }

      toast({
        title: 'Entry updated',
        description: 'Changes saved successfully.',
      });

      setIsEditing(false);
      
      // Refetch the entry to update the view with saved data
      const { data: updatedEntry } = await supabase
        .from('knowledge_entries')
        .select('*')
        .eq('id', entry.id)
        .single();
      
      if (updatedEntry && onNavigateToEntry) {
        // Navigate to the updated entry to refresh the view
        onNavigateToEntry(entry.id);
      }
      
      onEntryUpdated?.();
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof KnowledgeEntry, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: keyof KnowledgeEntry, value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      const currentArray = (editData[field] as string[]) || [];
      updateField(field, [...currentArray, value.trim()]);
      setValue('');
    }
  };

  const removeFromArray = (field: keyof KnowledgeEntry, index: number) => {
    const currentArray = (editData[field] as string[]) || [];
    updateField(field, currentArray.filter((_, i) => i !== index));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      cancelEditing();
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={entry.category} />
              {!isEditing && entry.offerWorkStatus && (
                <StatusBadge status={entry.offerWorkStatus} />
              )}
              {!isEditing && status && <StatusBadge status={status} />}
              {isEditing && entry.category === 'project' && (
                <Select
                  value={editData.projectStatus || 'active'}
                  onValueChange={(value) => updateField('projectStatus', value)}
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {isEditing && entry.category === 'offer' && (
                <>
                  <Select
                    value={editData.offerWorkStatus || 'under_development'}
                    onValueChange={(value) => updateField('offerWorkStatus', value)}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_development">Under Development</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={editData.offerStatus || 'pending'}
                    onValueChange={(value) => updateField('offerStatus', value)}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save
                </Button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <Input
              value={editData.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              className="text-xl font-semibold"
            />
          ) : (
            <SheetTitle className="text-xl font-semibold text-left">
              {entry.title}
            </SheetTitle>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {isEditing && entry.category === 'project' ? (
              <div className="w-full space-y-2">
                <Label className="text-xs">Client</Label>
                <EntityAutocomplete
                  category="client"
                  value={editData.client || ''}
                  onChange={(value, entityId) => {
                    updateField('client', value);
                    // Store the client ID for linking
                    if (entityId) {
                      updateField('clientIds', [entityId]);
                    }
                  }}
                  placeholder="Search or create client..."
                />
              </div>
            ) : isEditing && entry.category === 'offer' ? (
              <div className="w-full space-y-2">
                <Label className="text-xs">Client</Label>
                <EntityAutocomplete
                  category="client"
                  value={linkedOfferClient?.title || editData.client || ''}
                  onChange={(value, entityId) => {
                    updateField('client', value);
                    // Store the client ID for offer linking
                    if (entityId) {
                      setEditLinkedOfferClientId(entityId);
                      // Update display
                      supabase
                        .from('knowledge_entries')
                        .select('id, title')
                        .eq('id', entityId)
                        .single()
                        .then(({ data }) => {
                          if (data) {
                            setLinkedOfferClient(data);
                          }
                        });
                    }
                  }}
                  placeholder="Search or create client..."
                />
              </div>
            ) : (
              <>
                {entry.category === 'project' && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {linkedClient?.title || entry.client || <span className="italic text-muted-foreground/70">No client</span>}
                  </span>
                )}
                {entry.category === 'offer' && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {linkedOfferClient?.title || entry.client || <span className="italic text-muted-foreground/70">No client</span>}
                  </span>
                )}
                {entry.startDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Started {format(entry.startDate, 'MMM d, yyyy')}
                  </span>
                )}
                {entry.dateDelivered && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Delivered {format(entry.dateDelivered, 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Updated {format(entry.updatedAt, 'MMM d, yyyy')}
                </span>
              </>
            )}
          </div>

          <Separator />

          {/* Description - hide for clients */}
          {entry.category !== 'client' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Description
              </h4>
              {isEditing ? (
                <Textarea
                  value={editData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.description}
                </p>
              )}
            </div>
          )}

          {/* People specific: Studio & Position */}
          {entry.category === 'person' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Studio
                </h4>
                {isEditing ? (
                  <Input
                    value={editData.studio || ''}
                    onChange={(e) => updateField('studio', e.target.value)}
                    placeholder="e.g., Design Studio A"
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {entry.studio || 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  Position
                </h4>
                {isEditing ? (
                  <Input
                    value={editData.position || ''}
                    onChange={(e) => updateField('position', e.target.value)}
                    placeholder="e.g., Senior Designer"
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {entry.position || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Person specific: Linked Projects */}
          {entry.category === 'person' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-primary" />
                Projects Involved
              </h4>
              {linkedPersonProjects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedPersonProjects.map((project) => (
                    <LinkedEntityBadge 
                      key={project.id} 
                      id={project.id} 
                      title={project.title} 
                      category="project"
                      onClick={() => onNavigateToEntry?.(project.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No projects linked</p>
              )}
            </div>
          )}

          {/* Person specific: Linked Offers */}
          {entry.category === 'person' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Offers Involved
              </h4>
              {linkedPersonOffers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedPersonOffers.map((offer) => (
                    <LinkedEntityBadge 
                      key={offer.id} 
                      id={offer.id} 
                      title={offer.title} 
                      category="offer"
                      onClick={() => onNavigateToEntry?.(offer.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No offers linked</p>
              )}
            </div>
          )}

          {/* Person specific: Linked Clients */}
          {entry.category === 'person' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                Clients Worked With
              </h4>
              {linkedPersonClients.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedPersonClients.map((client) => (
                    <LinkedEntityBadge 
                      key={client.id} 
                      id={client.id} 
                      title={client.title} 
                      category="client"
                      onClick={() => onNavigateToEntry?.(client.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No clients linked</p>
              )}
            </div>
          )}

          {/* Person specific: Method Expertise */}
          {entry.category === 'person' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-primary" />
                Method Expertise
              </h4>
              {linkedPersonMethods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedPersonMethods.map((method) => (
                    <LinkedEntityBadge 
                      key={method.id} 
                      id={method.id} 
                      title={method.title} 
                      category="method"
                      onClick={() => onNavigateToEntry?.(method.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No methods linked</p>
              )}
            </div>
          )}


          {entry.category === 'project' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-primary" />
                Methods & Tools
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {editLinkedMethodIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editLinkedMethodIds.map((methodId) => {
                        const method = linkedMethods.find(m => m.id === methodId);
                        return (
                          <Badge key={methodId} variant="secondary" className="font-normal flex items-center gap-1">
                            {method?.title || 'Loading...'}
                            <button
                              type="button"
                              onClick={() => setEditLinkedMethodIds(ids => ids.filter(id => id !== methodId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <EntityAutocomplete
                    category="method"
                    value=""
                    onChange={(_, entityId) => {
                      if (entityId && !editLinkedMethodIds.includes(entityId)) {
                        setEditLinkedMethodIds(ids => [...ids, entityId]);
                        supabase
                          .from('knowledge_entries')
                          .select('id, title')
                          .eq('id', entityId)
                          .single()
                          .then(({ data }) => {
                            if (data) {
                              setLinkedMethods(prev => [...prev, data]);
                            }
                          });
                      }
                    }}
                    placeholder="Search methods to link..."
                  />
                </div>
              ) : linkedMethods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedMethods.map((method) => (
                    <LinkedEntityBadge 
                      key={method.id} 
                      id={method.id} 
                      title={method.title} 
                      category="method"
                      onClick={() => onNavigateToEntry?.(method.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No methods linked</p>
              )}
            </div>
          )}

          {/* Project specific: Linked People */}
          {entry.category === 'project' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                People Involved
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {editLinkedProjectPeopleIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editLinkedProjectPeopleIds.map((personId) => {
                        const person = linkedProjectPeople.find(p => p.id === personId);
                        return (
                          <Badge key={personId} variant="secondary" className="font-normal flex items-center gap-1">
                            {person?.title || 'Loading...'}
                            <button
                              type="button"
                              onClick={() => setEditLinkedProjectPeopleIds(ids => ids.filter(id => id !== personId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <EntityAutocomplete
                    category="person"
                    value=""
                    onChange={(_, entityId) => {
                      if (entityId && !editLinkedProjectPeopleIds.includes(entityId)) {
                        setEditLinkedProjectPeopleIds(ids => [...ids, entityId]);
                        supabase
                          .from('knowledge_entries')
                          .select('id, title')
                          .eq('id', entityId)
                          .single()
                          .then(({ data }) => {
                            if (data) {
                              setLinkedProjectPeople(prev => [...prev, data]);
                            }
                          });
                      }
                    }}
                    placeholder="Search people to link..."
                  />
                </div>
              ) : linkedProjectPeople.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedProjectPeople.map((person) => (
                    <LinkedEntityBadge 
                      key={person.id} 
                      id={person.id} 
                      title={person.title} 
                      category="person"
                      onClick={() => onNavigateToEntry?.(person.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No people linked</p>
              )}
            </div>
          )}

          {entry.category === 'client' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-muted-foreground" />
                Industry
              </h4>
              {isEditing ? (
                <Input
                  value={editData.industry || ''}
                  onChange={(e) => updateField('industry', e.target.value)}
                  placeholder="e.g., Healthcare, Finance, Technology"
                  className="h-8"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {entry.industry || 'Not specified'}
                </p>
              )}
            </div>
          )}

          {/* Client specific: Linked Projects */}
          {entry.category === 'client' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-primary" />
                Projects
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {editLinkedProjectIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editLinkedProjectIds.map((projectId) => {
                        const project = linkedProjects.find(p => p.id === projectId);
                        return (
                          <Badge key={projectId} variant="secondary" className="font-normal flex items-center gap-1">
                            {project?.title || 'Loading...'}
                            <button
                              type="button"
                              onClick={() => setEditLinkedProjectIds(ids => ids.filter(id => id !== projectId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <EntityAutocomplete
                    category="project"
                    value=""
                    onChange={(_, entityId) => {
                      if (entityId && !editLinkedProjectIds.includes(entityId)) {
                        setEditLinkedProjectIds(ids => [...ids, entityId]);
                        // Also update linkedProjects for display
                        supabase
                          .from('knowledge_entries')
                          .select('id, title')
                          .eq('id', entityId)
                          .single()
                          .then(({ data }) => {
                            if (data) {
                              setLinkedProjects(prev => [...prev, data]);
                            }
                          });
                      }
                    }}
                    placeholder="Search projects to link..."
                  />
                </div>
              ) : linkedProjects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedProjects.map((project) => (
                    <LinkedEntityBadge 
                      key={project.id} 
                      id={project.id} 
                      title={project.title} 
                      category="project"
                      onClick={() => onNavigateToEntry?.(project.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No projects linked</p>
              )}
            </div>
          )}

          {/* Client specific: Linked People */}
          {entry.category === 'client' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                People Involved
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {editLinkedPeopleIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editLinkedPeopleIds.map((personId) => {
                        const person = linkedPeople.find(p => p.id === personId);
                        return (
                          <Badge key={personId} variant="secondary" className="font-normal flex items-center gap-1">
                            {person?.title || 'Loading...'}
                            <button
                              type="button"
                              onClick={() => setEditLinkedPeopleIds(ids => ids.filter(id => id !== personId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <EntityAutocomplete
                    category="person"
                    value=""
                    onChange={(_, entityId) => {
                      if (entityId && !editLinkedPeopleIds.includes(entityId)) {
                        setEditLinkedPeopleIds(ids => [...ids, entityId]);
                        // Also update linkedPeople for display
                        supabase
                          .from('knowledge_entries')
                          .select('id, title')
                          .eq('id', entityId)
                          .single()
                          .then(({ data }) => {
                            if (data) {
                              setLinkedPeople(prev => [...prev, data]);
                            }
                          });
                      }
                    }}
                    placeholder="Search people to link..."
                  />
                </div>
              ) : linkedPeople.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedPeople.map((person) => (
                    <LinkedEntityBadge 
                      key={person.id} 
                      id={person.id} 
                      title={person.title} 
                      category="person"
                      onClick={() => onNavigateToEntry?.(person.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No people linked</p>
              )}
            </div>
          )}

          {/* Tags - hide for clients */}
          {entry.category !== 'client' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-muted-foreground" />
                Tags
              </h4>
              {isEditing ? (
                <EditableArrayField
                  items={editData.tags || []}
                  onAdd={(value) => addToArray('tags', value, setNewTag)}
                  onRemove={(index) => removeFromArray('tags', index)}
                  inputValue={newTag}
                  setInputValue={setNewTag}
                  placeholder="Add tag..."
                />
              ) : entry.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags</p>
              )}
            </div>
          )}

          {/* Project specific: Detailed Summary */}
          {entry.category === 'project' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-category-project" />
                Detailed Summary
              </h4>
              {isEditing ? (
                <Textarea
                  value={editData.fullDescription || ''}
                  onChange={(e) => updateField('fullDescription', e.target.value)}
                  className="min-h-[300px] resize-y"
                  placeholder="Enter a detailed summary of the project (max 2000 words). Include: goals and objectives, methods and tools used, process and activities, deliverables, and outcomes..."
                />
              ) : entry.fullDescription ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.fullDescription}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No detailed summary recorded</p>
              )}
            </div>
          )}

          {/* Project specific: Learnings (manual text field) */}
          {entry.category === 'project' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-status-pending" />
                Learnings
              </h4>
              {isEditing ? (
                <Textarea
                  value={editData.learningsText || ''}
                  onChange={(e) => updateField('learningsText', e.target.value)}
                  className="min-h-[150px] resize-y"
                  placeholder="Capture key learnings, insights, and reflections from this project..."
                />
              ) : entry.learningsText ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.learningsText}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No learnings recorded</p>
              )}
            </div>
          )}

          {/* Offer specific: Detailed Summary */}
          {entry.category === 'offer' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-category-offer" />
                Detailed Summary
              </h4>
              {isEditing ? (
                <Textarea
                  value={editData.fullDescription || ''}
                  onChange={(e) => updateField('fullDescription', e.target.value)}
                  className="min-h-[300px] resize-y"
                  placeholder="Enter a detailed summary of the offer content (max 2000 words)..."
                />
              ) : entry.fullDescription ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.fullDescription}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No detailed summary recorded</p>
              )}
            </div>
          )}

          {/* Project specific: References */}
          {entry.category === 'project' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-primary" />
                References
              </h4>
              {isEditing ? (
                <EditableArrayField
                  items={editData.referencesLinks || []}
                  onAdd={(value) => addToArray('referencesLinks', value, setNewReference)}
                  onRemove={(index) => removeFromArray('referencesLinks', index)}
                  inputValue={newReference}
                  setInputValue={setNewReference}
                  placeholder="Add link (e.g., https://drive.google.com/...)"
                />
              ) : entry.referencesLinks && entry.referencesLinks.length > 0 ? (
                <ul className="space-y-2">
                  {entry.referencesLinks.map((link, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No references added</p>
              )}
            </div>
          )}

          {/* Offer specific: Winning Strategy */}
          {entry.category === 'offer' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-status-won" />
                Winning Strategy
              </h4>
              {isEditing ? (
                <Textarea
                  value={editData.winningStrategy || ''}
                  onChange={(e) => updateField('winningStrategy', e.target.value)}
                  className="min-h-[80px] resize-none"
                  placeholder="Describe the winning strategy..."
                />
              ) : entry.winningStrategy ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.winningStrategy}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No winning strategy recorded</p>
              )}
            </div>
          )}

          {/* Offer specific: Loss Reasons */}
          {entry.category === 'offer' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-status-lost" />
                Loss Reasons
              </h4>
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={editData.lossReasons || ''}
                    onChange={(e) => updateField('lossReasons', e.target.value)}
                    className="min-h-[200px] resize-y"
                    placeholder="Describe the reasons for losing..."
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={lossReasonsFileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.pptx,.txt,.md"
                      onChange={handleLossReasonsDocUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => lossReasonsFileInputRef.current?.click()}
                      disabled={isUploadingDoc || isAnalyzingDoc}
                      className="gap-1.5"
                    >
                      {isUploadingDoc || isAnalyzingDoc ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isAnalyzingDoc ? 'Analyzing...' : 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Upload & Analyze Document
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      AI will summarize loss reasons from the document
                    </span>
                  </div>
                </div>
              ) : entry.lossReasons ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.lossReasons}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No loss reasons recorded</p>
              )}
            </div>
          )}

          {/* Offer specific: Linked Methods */}
          {entry.category === 'offer' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-category-method" />
                Methods Used
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {editLinkedOfferMethodIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editLinkedOfferMethodIds.map((methodId) => {
                        const method = linkedOfferMethods.find(m => m.id === methodId);
                        return (
                          <Badge key={methodId} variant="secondary" className="font-normal flex items-center gap-1">
                            {method?.title || 'Loading...'}
                            <button
                              type="button"
                              onClick={() => setEditLinkedOfferMethodIds(ids => ids.filter(id => id !== methodId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <EntityAutocomplete
                    category="method"
                    value=""
                    onChange={(_, entityId) => {
                      if (entityId && !editLinkedOfferMethodIds.includes(entityId)) {
                        setEditLinkedOfferMethodIds(ids => [...ids, entityId]);
                        supabase
                          .from('knowledge_entries')
                          .select('id, title')
                          .eq('id', entityId)
                          .single()
                          .then(({ data }) => {
                            if (data) {
                              setLinkedOfferMethods(prev => [...prev, data]);
                            }
                          });
                      }
                    }}
                    placeholder="Search methods to link..."
                  />
                </div>
              ) : linkedOfferMethods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedOfferMethods.map((method) => (
                    <LinkedEntityBadge 
                      key={method.id} 
                      id={method.id} 
                      title={method.title} 
                      category="method"
                      onClick={() => onNavigateToEntry?.(method.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No methods linked</p>
              )}
            </div>
          )}

          {/* Offer specific: Linked People */}
          {entry.category === 'offer' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                People Involved
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {editLinkedOfferPeopleIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editLinkedOfferPeopleIds.map((personId) => {
                        const person = linkedOfferPeople.find(p => p.id === personId);
                        return (
                          <Badge key={personId} variant="secondary" className="font-normal flex items-center gap-1">
                            {person?.title || 'Loading...'}
                            <button
                              type="button"
                              onClick={() => setEditLinkedOfferPeopleIds(ids => ids.filter(id => id !== personId))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <EntityAutocomplete
                    category="person"
                    value=""
                    onChange={(_, entityId) => {
                      if (entityId && !editLinkedOfferPeopleIds.includes(entityId)) {
                        setEditLinkedOfferPeopleIds(ids => [...ids, entityId]);
                        supabase
                          .from('knowledge_entries')
                          .select('id, title')
                          .eq('id', entityId)
                          .single()
                          .then(({ data }) => {
                            if (data) {
                              setLinkedOfferPeople(prev => [...prev, data]);
                            }
                          });
                      }
                    }}
                    placeholder="Search people to link..."
                  />
                </div>
              ) : linkedOfferPeople.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {linkedOfferPeople.map((person) => (
                    <LinkedEntityBadge 
                      key={person.id} 
                      id={person.id} 
                      title={person.title} 
                      category="person"
                      onClick={() => onNavigateToEntry?.(person.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No people linked</p>
              )}
            </div>
          )}

          {/* Offer specific: References/Documents */}
          {entry.category === 'offer' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <File className="w-4 h-4 text-primary" />
                References & Documents
              </h4>
              {uploadedDocuments.length > 0 ? (
                <ul className="space-y-2">
                  {uploadedDocuments.map((doc, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
            </div>
          )}

          {entry.category === 'method' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Field
                </h4>
                {isEditing ? (
                  <Input
                    value={editData.field || ''}
                    onChange={(e) => updateField('field', e.target.value)}
                    placeholder="e.g., UX Design, Strategy"
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {entry.field || 'Not specified'}
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Domain
                </h4>
                {isEditing ? (
                  <Input
                    value={editData.domain || ''}
                    onChange={(e) => updateField('domain', e.target.value)}
                    placeholder="e.g., Healthcare, Fintech"
                    className="h-8"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {entry.domain || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Method specific: Full Description */}
          {entry.category === 'method' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                Full Description
              </h4>
              {isEditing ? (
                <Textarea
                  value={editData.fullDescription || ''}
                  onChange={(e) => updateField('fullDescription', e.target.value)}
                  className="min-h-[120px] resize-none"
                  placeholder="Detailed description of the method..."
                />
              ) : entry.fullDescription ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.fullDescription}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No full description provided</p>
              )}
            </div>
          )}

          {/* Method specific: Use cases */}
          {(entry.category === 'method' || (entry.useCases && entry.useCases.length > 0)) && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-muted-foreground" />
                When to Use
              </h4>
              {isEditing ? (
                <EditableArrayField
                  items={editData.useCases || []}
                  onAdd={(value) => addToArray('useCases', value, setNewUseCase)}
                  onRemove={(index) => removeFromArray('useCases', index)}
                  inputValue={newUseCase}
                  setInputValue={setNewUseCase}
                  placeholder="Add use case..."
                />
              ) : entry.useCases && entry.useCases.length > 0 ? (
                <ul className="space-y-2">
                  {entry.useCases.map((useCase, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground/50 mt-1">•</span>
                      {useCase}
                    </li>
                  ))}
                </ul>
              ) : entry.useCase ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.useCase}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No use cases defined</p>
              )}
            </div>
          )}


          {/* Method specific: References */}
          {entry.category === 'method' && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-primary" />
                References
              </h4>
              {isEditing ? (
                <EditableArrayField
                  items={editData.referencesLinks || []}
                  onAdd={(value) => addToArray('referencesLinks', value, setNewReference)}
                  onRemove={(index) => removeFromArray('referencesLinks', index)}
                  inputValue={newReference}
                  setInputValue={setNewReference}
                  placeholder="Add link (e.g., https://...)"
                />
              ) : entry.referencesLinks && entry.referencesLinks.length > 0 ? (
                <ul className="space-y-2">
                  {entry.referencesLinks.map((link, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No references added</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for editable array fields
interface EditableArrayFieldProps {
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  placeholder: string;
  numbered?: boolean;
}

function EditableArrayField({ 
  items, 
  onAdd, 
  onRemove, 
  inputValue, 
  setInputValue, 
  placeholder,
  numbered = false
}: EditableArrayFieldProps) {
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2 group">
              {numbered && (
                <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
              )}
              <span className="text-sm text-muted-foreground flex-1">{item}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd(inputValue))}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => onAdd(inputValue)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

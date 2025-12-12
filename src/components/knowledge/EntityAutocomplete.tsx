import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { cn } from '@/lib/utils';

interface EntityOption {
  id: string;
  title: string;
}

interface EntityAutocompleteProps {
  category: KnowledgeCategory;
  value: string;
  onChange: (value: string, entityId?: string) => void;
  onEntityCreated?: (id: string, title: string) => void;
  placeholder?: string;
  className?: string;
}

export function EntityAutocomplete({
  category,
  value,
  onChange,
  onEntityCreated,
  placeholder = 'Type to search...',
  className,
}: EntityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<EntityOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('knowledge_entries')
          .select('id, title')
          .eq('category', category)
          .ilike('title', `%${inputValue}%`)
          .limit(10);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [inputValue, category]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: EntityOption) => {
    setInputValue(option.title);
    onChange(option.title, option.id);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleCreateNew = async () => {
    if (!inputValue.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .insert({
          category: category,
          title: inputValue.trim(),
          description: `Created from entry linking`,
        } as any)
        .select()
        .single();

      if (error) throw error;

      onChange(data.title, data.id);
      onEntityCreated?.(data.id, data.title);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating entity:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const totalOptions = suggestions.length + (showCreateOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (highlightedIndex === suggestions.length && showCreateOption) {
          handleCreateNew();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const exactMatch = suggestions.some(
    (s) => s.title.toLowerCase() === inputValue.trim().toLowerCase()
  );
  const showCreateOption = inputValue.trim() && !exactMatch && !isLoading;

  const getCategoryLabel = () => {
    switch (category) {
      case 'client': return 'client';
      case 'person': return 'person';
      case 'method': return 'method';
      case 'project': return 'project';
      case 'offer': return 'offer';
      default: return 'entry';
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-8"
      />

      {isOpen && (inputValue.trim() || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Searching...
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                Existing {getCategoryLabel()}s
              </div>
              {suggestions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                    highlightedIndex === index && 'bg-accent'
                  )}
                >
                  <Check
                    className={cn(
                      'w-3 h-3 flex-shrink-0',
                      inputValue === option.title ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{option.title}</span>
                </button>
              ))}
            </div>
          )}

          {!isLoading && suggestions.length === 0 && inputValue.trim() && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matching {getCategoryLabel()}s found
            </div>
          )}

          {showCreateOption && (
            <div className="border-t border-border py-1">
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors text-primary',
                  highlightedIndex === suggestions.length && 'bg-accent'
                )}
              >
                {isCreating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Create "{inputValue.trim()}" as new {getCategoryLabel()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Multi-select version for arrays of entities
interface MultiEntityAutocompleteProps {
  category: KnowledgeCategory;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiEntityAutocomplete({
  category,
  selectedIds,
  onSelectionChange,
  placeholder = 'Type to search...',
  className,
}: MultiEntityAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<EntityOption[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<EntityOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch selected entities' details
  useEffect(() => {
    const fetchSelected = async () => {
      if (selectedIds.length === 0) {
        setSelectedEntities([]);
        return;
      }

      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('id, title')
        .in('id', selectedIds);

      if (!error && data) {
        setSelectedEntities(data);
      }
    };

    fetchSelected();
  }, [selectedIds]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('knowledge_entries')
          .select('id, title')
          .eq('category', category)
          .ilike('title', `%${inputValue}%`)
          .limit(10);

        if (error) throw error;
        // Filter out already selected
        const filtered = (data || []).filter((d) => !selectedIds.includes(d.id));
        setSuggestions(filtered);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [inputValue, category, selectedIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: EntityOption) => {
    onSelectionChange([...selectedIds, option.id]);
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemove = (id: string) => {
    onSelectionChange(selectedIds.filter((sid) => sid !== id));
  };

  const handleCreateNew = async () => {
    if (!inputValue.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_entries')
        .insert({
          category: category,
          title: inputValue.trim(),
          description: `Created from entry linking`,
        } as any)
        .select()
        .single();

      if (error) throw error;

      onSelectionChange([...selectedIds, data.id]);
      setInputValue('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating entity:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const exactMatch = suggestions.some(
    (s) => s.title.toLowerCase() === inputValue.trim().toLowerCase()
  );
  const showCreateOption = inputValue.trim() && !exactMatch && !isLoading;

  const getCategoryLabel = () => {
    switch (category) {
      case 'client': return 'client';
      case 'person': return 'person';
      case 'method': return 'method';
      case 'project': return 'project';
      case 'offer': return 'offer';
      default: return 'entry';
    }
  };

  return (
    <div ref={containerRef} className={cn('space-y-2', className)}>
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedEntities.map((entity) => (
            <Badge key={entity.id} variant="secondary" className="gap-1">
              {entity.title}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemove(entity.id)}
              />
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="h-8"
        />

        {isOpen && (inputValue.trim() || isLoading) && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Searching...
              </div>
            )}

            {!isLoading && suggestions.length > 0 && (
              <div className="py-1">
                {suggestions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                  >
                    <Plus className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{option.title}</span>
                  </button>
                ))}
              </div>
            )}

            {!isLoading && suggestions.length === 0 && inputValue.trim() && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matching {getCategoryLabel()}s found
              </div>
            )}

            {showCreateOption && (
              <div className="border-t border-border py-1">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors text-primary"
                >
                  {isCreating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Create "{inputValue.trim()}" as new {getCategoryLabel()}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

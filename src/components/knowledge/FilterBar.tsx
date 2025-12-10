import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterState, KnowledgeCategory } from '@/types/knowledge';

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showCategoryFilter?: boolean;
}

const categories: { value: KnowledgeCategory; label: string }[] = [
  { value: 'project', label: 'Projects' },
  { value: 'offer', label: 'Offers' },
  { value: 'method', label: 'Methods' },
];

export function FilterBar({ filters, onFiltersChange, showCategoryFilter = true }: FilterBarProps) {
  const toggleCategory = (category: KnowledgeCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const clearFilters = () => {
    onFiltersChange({ search: '', categories: [], tags: [] });
  };

  const hasActiveFilters = filters.search || filters.categories.length > 0 || filters.tags.length > 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search entries..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9 bg-background border-border"
        />
      </div>

      {showCategoryFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filter:</span>
          {categories.map((cat) => (
            <Badge
              key={cat.value}
              variant={filters.categories.includes(cat.value) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => toggleCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

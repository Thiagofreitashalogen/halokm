import { useState } from 'react';
import { KnowledgeEntry, KnowledgeCategory } from '@/types/knowledge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
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
import { Building2, Calendar, CheckCircle, XCircle, Lightbulb, Pencil, X, Save, Loader2, Plus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EntryDetailSheetProps {
  entry: KnowledgeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryUpdated?: () => void;
}

export function EntryDetailSheet({ entry, open, onOpenChange, onEntryUpdated }: EntryDetailSheetProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<KnowledgeEntry>>({});
  const [newTag, setNewTag] = useState('');
  const [newLearning, setNewLearning] = useState('');
  const [newStep, setNewStep] = useState('');
  const [newUseCase, setNewUseCase] = useState('');

  if (!entry) return null;

  const status = entry.offerOutcome || entry.projectStatus;

  const startEditing = () => {
    setEditData({
      title: entry.title,
      description: entry.description,
      client: entry.client,
      tags: [...(entry.tags || [])],
      learnings: [...(entry.learnings || [])],
      deliverables: [...(entry.deliverables || [])],
      winningStrategy: entry.winningStrategy || '',
      lossReasons: entry.lossReasons || '',
      steps: [...(entry.steps || [])],
      useCases: [...(entry.useCases || [])],
      projectStatus: entry.projectStatus,
      offerOutcome: entry.offerOutcome,
      offerWorkStatus: entry.offerWorkStatus,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
    setNewTag('');
    setNewLearning('');
    setNewStep('');
    setNewUseCase('');
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
      } else if (entry.category === 'offer') {
        updateData.offer_status = editData.offerOutcome;
        updateData.offer_work_status = editData.offerWorkStatus;
        updateData.winning_strategy = editData.winningStrategy || null;
        updateData.loss_reasons = editData.lossReasons || null;
      } else if (entry.category === 'method') {
        updateData.steps = editData.steps || [];
        updateData.use_cases = editData.useCases || [];
      }

      const { error } = await supabase
        .from('knowledge_entries')
        .update(updateData)
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: 'Entry updated',
        description: 'Changes saved successfully.',
      });

      setIsEditing(false);
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
              {!isEditing && status && <StatusBadge status={status} />}
              {!isEditing && entry.offerWorkStatus && (
                <StatusBadge status={entry.offerWorkStatus} />
              )}
              {isEditing && entry.category === 'project' && (
                <Select
                  value={editData.projectStatus || 'under_development'}
                  onValueChange={(value) => updateField('projectStatus', value)}
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_development">Under Development</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
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
                    value={editData.offerOutcome || 'pending'}
                    onValueChange={(value) => updateField('offerOutcome', value)}
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
            {isEditing ? (
              <div className="w-full space-y-2">
                <Label className="text-xs">Client</Label>
                <Input
                  value={editData.client || ''}
                  onChange={(e) => updateField('client', e.target.value)}
                  placeholder="Client name"
                  className="h-8"
                />
              </div>
            ) : (
              <>
                {entry.client && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {entry.client}
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

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
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

          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium mb-2">Tags</h4>
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

          {/* Project specific: Learnings */}
          {(entry.category === 'project' || (entry.learnings && entry.learnings.length > 0)) && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-status-pending" />
                Key Learnings
              </h4>
              {isEditing ? (
                <EditableArrayField
                  items={editData.learnings || []}
                  onAdd={(value) => addToArray('learnings', value, setNewLearning)}
                  onRemove={(index) => removeFromArray('learnings', index)}
                  inputValue={newLearning}
                  setInputValue={setNewLearning}
                  placeholder="Add learning..."
                />
              ) : entry.learnings && entry.learnings.length > 0 ? (
                <ul className="space-y-2">
                  {entry.learnings.map((learning, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-muted-foreground/50 mt-1">•</span>
                      {learning}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No learnings recorded</p>
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
                <Textarea
                  value={editData.lossReasons || ''}
                  onChange={(e) => updateField('lossReasons', e.target.value)}
                  className="min-h-[80px] resize-none"
                  placeholder="Describe the reasons for losing..."
                />
              ) : entry.lossReasons ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.lossReasons}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No loss reasons recorded</p>
              )}
            </div>
          )}

          {/* Method specific: Use cases */}
          {(entry.category === 'method' || (entry.useCases && entry.useCases.length > 0)) && (
            <div>
              <h4 className="text-sm font-medium mb-2">When to Use</h4>
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

          {/* Method specific: Steps */}
          {(entry.category === 'method' || (entry.steps && entry.steps.length > 0)) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Steps</h4>
              {isEditing ? (
                <EditableArrayField
                  items={editData.steps || []}
                  onAdd={(value) => addToArray('steps', value, setNewStep)}
                  onRemove={(index) => removeFromArray('steps', index)}
                  inputValue={newStep}
                  setInputValue={setNewStep}
                  placeholder="Add step..."
                  numbered
                />
              ) : entry.steps && entry.steps.length > 0 ? (
                <ol className="space-y-2">
                  {entry.steps.map((step, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-3">
                      <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No steps defined</p>
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

import { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Edit, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StyleGuide {
  id: string;
  name: string;
  description: string | null;
  tone_of_voice: string | null;
  writing_guidelines: string | null;
  created_at: string;
}

const emptyGuide = {
  name: '',
  description: '',
  tone_of_voice: '',
  writing_guidelines: '',
};

export const StyleGuideManager = () => {
  const [guides, setGuides] = useState<StyleGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState<StyleGuide | null>(null);
  const [editingGuide, setEditingGuide] = useState<StyleGuide | null>(null);
  const [formData, setFormData] = useState(emptyGuide);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const { data, error } = await supabase
        .from('style_guides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuides((data || []) as StyleGuide[]);
    } catch (error) {
      console.error('Error fetching style guides:', error);
      toast.error('Failed to load style guides');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingGuide(null);
    setFormData(emptyGuide);
    setShowDialog(true);
  };

  const openEditDialog = (guide: StyleGuide) => {
    setEditingGuide(guide);
    setFormData({
      name: guide.name,
      description: guide.description || '',
      tone_of_voice: guide.tone_of_voice || '',
      writing_guidelines: guide.writing_guidelines || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please provide a name');
      return;
    }

    setSaving(true);
    try {
      if (editingGuide) {
        const { error } = await supabase
          .from('style_guides')
          .update({
            name: formData.name,
            description: formData.description || null,
            tone_of_voice: formData.tone_of_voice || null,
            writing_guidelines: formData.writing_guidelines || null,
          })
          .eq('id', editingGuide.id);

        if (error) throw error;
        toast.success('Style guide updated');
      } else {
        const { error } = await supabase
          .from('style_guides')
          .insert({
            name: formData.name,
            description: formData.description || null,
            tone_of_voice: formData.tone_of_voice || null,
            writing_guidelines: formData.writing_guidelines || null,
          });

        if (error) throw error;
        toast.success('Style guide created');
      }

      setShowDialog(false);
      setFormData(emptyGuide);
      setEditingGuide(null);
      fetchGuides();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save style guide');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!guideToDelete) return;

    try {
      const { error } = await supabase
        .from('style_guides')
        .delete()
        .eq('id', guideToDelete.id);

      if (error) throw error;

      toast.success('Style guide deleted');
      setShowDeleteDialog(false);
      setGuideToDelete(null);
      fetchGuides();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete style guide');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define tone of voice and writing guidelines for offer generation.
        </p>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Style Guide
        </Button>
      </div>

      {guides.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No style guides defined yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {guides.map(guide => (
            <Card key={guide.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium">{guide.name}</h4>
                    </div>
                    {guide.description && (
                      <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                    )}
                    {guide.tone_of_voice && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        <span className="font-medium">Tone:</span> {guide.tone_of_voice}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(guide)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setGuideToDelete(guide);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGuide ? 'Edit Style Guide' : 'Create Style Guide'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Professional Tone"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="When to use this style guide..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tone of Voice</label>
              <Textarea
                value={formData.tone_of_voice}
                onChange={e => setFormData(prev => ({ ...prev, tone_of_voice: e.target.value }))}
                placeholder="Describe the desired tone: professional, friendly, technical, etc."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Writing Guidelines</label>
              <Textarea
                value={formData.writing_guidelines}
                onChange={e => setFormData(prev => ({ ...prev, writing_guidelines: e.target.value }))}
                placeholder="Specific rules: avoid jargon, use active voice, keep sentences short..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingGuide ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Style Guide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{guideToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

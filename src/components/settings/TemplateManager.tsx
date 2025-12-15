import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

interface Template {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  file_name: string;
  placeholders: string[] | null;
  extracted_structure: {
    headings?: string[];
    sectionCount?: number;
  } | null;
  created_at: string;
}

export const TemplateManager = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        toast.error('Only DOCX files are supported');
        return;
      }
      setNewTemplate(prev => ({ ...prev, file, name: prev.name || file.name.replace('.docx', '') }));
    }
  };

  const handleUpload = async () => {
    if (!newTemplate.file || !newTemplate.name) {
      toast.error('Please provide a name and file');
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileName = `templates/${Date.now()}_${newTemplate.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('knowledge')
        .upload(fileName, newTemplate.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('knowledge')
        .getPublicUrl(fileName);

      // Parse template to extract structure and placeholders
      const formData = new FormData();
      formData.append('file', newTemplate.file);

      const parseResponse = await supabase.functions.invoke('parse-template', {
        body: formData,
      });

      const parseResult = parseResponse.data;
      
      // Save to database
      const { error: dbError } = await supabase
        .from('offer_templates')
        .insert({
          name: newTemplate.name,
          description: newTemplate.description || null,
          file_url: urlData.publicUrl,
          file_name: newTemplate.file.name,
          placeholders: parseResult?.placeholders || [],
          extracted_structure: parseResult?.structure || null,
        });

      if (dbError) throw dbError;

      toast.success('Template uploaded successfully');
      setShowUploadDialog(false);
      setNewTemplate({ name: '', description: '', file: null });
      fetchTemplates();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload template');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('offer_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      toast.success('Template deleted');
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
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
          Upload DOCX templates for offer writing. Placeholders are auto-detected.
        </p>
        <Button size="sm" onClick={() => setShowUploadDialog(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No templates uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(template => (
            <Card key={template.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-medium">{template.name}</h4>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.placeholders?.slice(0, 5).map(p => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {(template.placeholders?.length || 0) > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{(template.placeholders?.length || 0) - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setTemplateToDelete(template);
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

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={newTemplate.name}
                onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Proposal Template"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={newTemplate.description}
                onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe when to use this template..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">DOCX File</label>
              <Input
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="mt-1"
              />
              {newTemplate.file && (
                <p className="text-xs text-muted-foreground mt-1">{newTemplate.file.name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              {selectedTemplate.description && (
                <p className="text-muted-foreground">{selectedTemplate.description}</p>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">Detected Placeholders</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.placeholders?.length ? (
                    selectedTemplate.placeholders.map(p => (
                      <Badge key={p} variant="secondary">{p}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No placeholders detected</p>
                  )}
                </div>
              </div>
              {selectedTemplate.extracted_structure?.headings?.length ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">Document Structure</h4>
                  <ul className="text-sm space-y-1">
                    {selectedTemplate.extracted_structure.headings.map((h, i) => (
                      <li key={i} className="text-muted-foreground">• {h}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="pt-2">
                <a
                  href={selectedTemplate.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Download original file
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
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

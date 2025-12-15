import { useState, useRef } from 'react';
import { Upload, FileText, Link as LinkIcon, X, Loader2, File, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content?: string;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  error?: string;
}

interface LinkItem {
  id: string;
  url: string;
  content?: string;
  status: 'fetching' | 'ready' | 'error';
  error?: string;
}

interface TenderUploadProps {
  onContentReady: (content: string, files?: UploadedFile[]) => void;
  isAnalyzing: boolean;
}

export const TenderUpload = ({ onContentReady, isAnalyzing }: TenderUploadProps) => {
  const [pastedContent, setPastedContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const fileId = crypto.randomUUID();
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        status: 'uploading',
      };

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        // Upload to storage
        const filePath = `tender-uploads/${fileId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('imports')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Update status to parsing
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, status: 'parsing' as const } : f)
        );

        // Parse document
        const { data: urlData } = supabase.storage.from('imports').getPublicUrl(filePath);
        
        const { data, error } = await supabase.functions.invoke('parse-document', {
          body: { 
            fileUrl: urlData.publicUrl,
            fileName: file.name,
          },
        });

        if (error) throw error;

        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'ready' as const,
            content: data.content || data.text || ''
          } : f)
        );

        toast.success(`${file.name} processed successfully`);
      } catch (error) {
        console.error('File processing error:', error);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'error' as const,
            error: 'Failed to process file'
          } : f)
        );
        toast.error(`Failed to process ${file.name}`);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const fetchLinkContent = async (linkItem: LinkItem) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-url-content', {
        body: { url: linkItem.url },
      });

      if (error) throw error;
      
      // Handle blocked websites gracefully
      if (data.blocked) {
        setLinks(prev => 
          prev.map(l => l.id === linkItem.id ? { 
            ...l, 
            status: 'error' as const,
            error: 'Website blocks automated access'
          } : l)
        );
        toast.error('This website blocks automated access. Please paste the content manually.');
        return;
      }
      
      if (data.error) throw new Error(data.error);

      setLinks(prev => 
        prev.map(l => l.id === linkItem.id ? { 
          ...l, 
          status: 'ready' as const,
          content: data.content
        } : l)
      );

      toast.success(`Fetched content from link`);
    } catch (error) {
      console.error('Link fetch error:', error);
      setLinks(prev => 
        prev.map(l => l.id === linkItem.id ? { 
          ...l, 
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Failed to fetch'
        } : l)
      );
      toast.error(`Failed to fetch link content`);
    }
  };

  const addLink = async () => {
    const url = newLink.trim();
    if (!url) return;
    
    // Validate URL format
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Check for duplicates
    if (links.some(l => l.url === normalizedUrl)) {
      toast.error('This link has already been added');
      return;
    }

    const linkItem: LinkItem = {
      id: crypto.randomUUID(),
      url: normalizedUrl,
      status: 'fetching',
    };

    setLinks(prev => [...prev, linkItem]);
    setNewLink('');

    // Fetch content immediately
    fetchLinkContent(linkItem);
  };

  const removeLink = (linkId: string) => {
    setLinks(prev => prev.filter(l => l.id !== linkId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLink();
    }
  };

  const handleAnalyze = () => {
    // Combine all content sources
    const fileContents = uploadedFiles
      .filter(f => f.status === 'ready' && f.content)
      .map(f => `--- ${f.name} ---\n${f.content}`)
      .join('\n\n');

    const linkContents = links
      .filter(l => l.status === 'ready' && l.content)
      .map(l => `--- ${l.url} ---\n${l.content}`)
      .join('\n\n');

    const combinedContent = [pastedContent, fileContents, linkContents]
      .filter(Boolean)
      .join('\n\n');

    if (!combinedContent.trim()) {
      toast.error('Please add content via paste, file upload, or links');
      return;
    }

    onContentReady(combinedContent, uploadedFiles);
  };

  const hasContent = pastedContent.trim() || 
    uploadedFiles.some(f => f.status === 'ready') || 
    links.some(l => l.status === 'ready');

  const isProcessing = uploadedFiles.some(f => f.status === 'uploading' || f.status === 'parsing') ||
    links.some(l => l.status === 'fetching');

  const getStatusIcon = (status: 'fetching' | 'ready' | 'error') => {
    switch (status) {
      case 'fetching':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'ready':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: 'fetching' | 'ready' | 'error') => {
    switch (status) {
      case 'fetching':
        return 'bg-muted text-muted-foreground';
      case 'ready':
        return 'bg-emerald-600 text-white';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Tender Document
        </CardTitle>
        <CardDescription>
          Upload files, paste content, or add links to tender documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Zone */}
        <div>
          <label className="text-sm font-medium mb-2 block">Upload Documents</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, DOCX, DOC, TXT, MD
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Uploaded Files</label>
            <div className="space-y-2">
              {uploadedFiles.map(file => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{file.name}</span>
                    {file.status === 'uploading' && (
                      <Badge variant="secondary" className="text-xs">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Uploading
                      </Badge>
                    )}
                    {file.status === 'parsing' && (
                      <Badge variant="secondary" className="text-xs">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    {file.status === 'ready' && (
                      <Badge variant="default" className="text-xs bg-emerald-600">
                        Ready
                      </Badge>
                    )}
                    {file.status === 'error' && (
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Add Links (optional)</label>
          <div className="flex gap-2">
            <Input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://..."
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={addLink}
              disabled={!newLink.trim()}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          {links.length > 0 && (
            <div className="space-y-2 mt-2">
              {links.map(link => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{link.url}</span>
                    <Badge className={`text-xs shrink-0 ${getStatusColor(link.status)}`}>
                      {getStatusIcon(link.status)}
                      <span className="ml-1">
                        {link.status === 'fetching' ? 'Fetching' : link.status === 'ready' ? 'Ready' : 'Error'}
                      </span>
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(link.id)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paste Content Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Or Paste Content</label>
          <Textarea
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            placeholder="Paste tender/RFP content here..."
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Analyze Button */}
        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || isProcessing || !hasContent}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Analyze Tender
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

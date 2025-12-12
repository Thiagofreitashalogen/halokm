import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from DOCX (which is a ZIP file with XML content)
async function parseDocx(file: Blob): Promise<string> {
  console.log('Parsing DOCX file locally...');
  
  const zipReader = new ZipReader(new BlobReader(file));
  const entries = await zipReader.getEntries();
  
  // Find the main document content
  const documentEntry = entries.find(e => e.filename === 'word/document.xml');
  if (!documentEntry) {
    await zipReader.close();
    throw new Error('Invalid DOCX: document.xml not found');
  }
  
  const textWriter = new TextWriter();
  const xmlContent = await documentEntry.getData!(textWriter);
  await zipReader.close();
  
  // Extract text from XML, handling paragraphs and formatting
  const textContent = extractTextFromDocxXml(xmlContent);
  
  return textContent;
}

function extractTextFromDocxXml(xml: string): string {
  const lines: string[] = [];
  
  // Match paragraph elements
  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let paragraphMatch;
  
  while ((paragraphMatch = paragraphRegex.exec(xml)) !== null) {
    const paragraphContent = paragraphMatch[1];
    
    // Check if it's a heading
    const isHeading = /<w:pStyle[^>]*w:val="Heading/.test(paragraphContent);
    
    // Extract all text runs within the paragraph
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textMatch;
    const textParts: string[] = [];
    
    while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
      textParts.push(textMatch[1]);
    }
    
    const paragraphText = textParts.join('').trim();
    
    if (paragraphText) {
      if (isHeading) {
        lines.push(`# ${paragraphText}`);
      } else {
        lines.push(paragraphText);
      }
    }
  }
  
  return lines.join('\n\n');
}

// Parse plain text files
async function parseTextFile(file: Blob): Promise<string> {
  console.log('Parsing text file...');
  return await file.text();
}

// Parse complex documents using Unstructured.io API
async function parseWithUnstructured(file: Blob, fileName: string): Promise<string> {
  const apiKey = Deno.env.get('UNSTRUCTURED_API_KEY');
  
  if (!apiKey) {
    throw new Error('UNSTRUCTURED_API_KEY is not configured. Please add it in settings.');
  }

  // Check file size - Unstructured has limits and edge functions have timeouts
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit for reliable processing
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum supported size is 10MB. Please use a smaller file or compress the document.`);
  }

  console.log('Parsing with Unstructured.io API...', { fileSize: file.size, fileName });
  
  const formData = new FormData();
  formData.append('files', new File([file], fileName));
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout (edge function limit is 60s)
  
  try {
    const response = await fetch('https://api.unstructuredapp.io/general/v0/general', {
      method: 'POST',
      headers: {
        'unstructured-api-key': apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unstructured API error:', { status: response.status, error: errorText });
      throw new Error(`Unstructured API error: ${response.status} - ${errorText}`);
    }

    const elements = await response.json();
    console.log(`Unstructured returned ${elements.length} elements`);
    
    // Convert elements to readable text
    const textParts: string[] = [];
    
    for (const element of elements) {
      if (element.type === 'Title') {
        textParts.push(`# ${element.text}`);
      } else if (element.type === 'Header') {
        textParts.push(`## ${element.text}`);
      } else if (element.type === 'ListItem') {
        textParts.push(`• ${element.text}`);
      } else if (element.text) {
        textParts.push(element.text);
      }
    }
    
    return textParts.join('\n\n');
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Document processing timed out. The file may be too complex or large. Try a smaller file.');
    }
    
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileUrl = formData.get('fileUrl') as string;
    const fileName = formData.get('fileName') as string;

    if (!file && !fileUrl) {
      throw new Error('Either file or fileUrl is required');
    }

    let fileBlob: Blob;
    let actualFileName: string;
    let mimeType: string;

    if (file) {
      fileBlob = file;
      actualFileName = fileName || file.name;
      mimeType = file.type;
    } else if (fileUrl) {
      console.log('Fetching file from URL...');
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from URL: ${fileResponse.status}`);
      }
      fileBlob = await fileResponse.blob();
      actualFileName = fileName || 'document';
      mimeType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    } else {
      throw new Error('No file provided');
    }

    console.log('Parsing document:', { 
      fileName: actualFileName, 
      mimeType,
      size: fileBlob.size 
    });

    let textContent: string;
    const extension = actualFileName.toLowerCase().split('.').pop();

    // Route to appropriate parser based on file type
    if (extension === 'txt' || extension === 'md' || mimeType.startsWith('text/')) {
      // Simple text files - parse locally
      textContent = await parseTextFile(fileBlob);
    } else if (extension === 'docx' || mimeType.includes('openxmlformats-officedocument.wordprocessingml')) {
      // DOCX files - try local parsing first, fall back to Unstructured
      try {
        textContent = await parseDocx(fileBlob);
      } catch (docxError) {
        console.log('Local DOCX parsing failed, trying Unstructured:', docxError);
        textContent = await parseWithUnstructured(fileBlob, actualFileName);
      }
    } else if (
      extension === 'pdf' || 
      extension === 'pptx' || 
      extension === 'ppt' ||
      extension === 'xlsx' || 
      extension === 'xls' ||
      extension === 'doc' ||
      mimeType.includes('pdf') ||
      mimeType.includes('presentation') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('msword')
    ) {
      // Complex documents - use Unstructured API
      textContent = await parseWithUnstructured(fileBlob, actualFileName);
    } else {
      // Try Unstructured for unknown formats
      console.log('Unknown format, attempting Unstructured API...');
      textContent = await parseWithUnstructured(fileBlob, actualFileName);
    }
    
    console.log('Extraction complete:', { 
      textLength: textContent.length,
      fileName: actualFileName
    });

    const metadata = {
      filename: actualFileName,
      filetype: mimeType,
      page_count: 1,
      element_count: textContent.split('\n\n').filter((p: string) => p.trim()).length,
    };

    return new Response(JSON.stringify({ 
      content: textContent,
      metadata,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error parsing document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ZipReader, BlobReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from DOCX (which is a ZIP file with XML content)
async function parseDocx(file: Blob): Promise<string> {
  console.log('Parsing DOCX file...');
  
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
    if (extension === 'docx' || mimeType.includes('openxmlformats-officedocument.wordprocessingml')) {
      textContent = await parseDocx(fileBlob);
    } else if (extension === 'txt' || extension === 'md' || mimeType.startsWith('text/')) {
      textContent = await parseTextFile(fileBlob);
    } else {
      // For unsupported formats, return a helpful message
      throw new Error(`Unsupported file format: ${extension || mimeType}. Supported formats: DOCX, TXT, MD`);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common placeholder patterns to auto-detect
const PLACEHOLDER_PATTERNS = [
  /\{\{([^}]+)\}\}/g,           // {{placeholder}}
  /\[\[([^\]]+)\]\]/g,          // [[placeholder]]
  /\$\{([^}]+)\}/g,             // ${placeholder}
  /<([A-Z_]+)>/g,               // <PLACEHOLDER>
  /\[([A-Z_][A-Z0-9_]*)\]/g,    // [PLACEHOLDER_NAME]
  /__([A-Z_]+)__/g,             // __PLACEHOLDER__
];

// Extract text content from DOCX XML
function extractTextFromDocxXml(xml: string): string {
  // Remove XML tags but preserve paragraph breaks
  let text = xml.replace(/<w:p[^>]*>/g, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&apos;/g, "'");
  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');
  return text.trim();
}

// Parse DOCX file locally
async function parseDocx(file: Blob): Promise<string> {
  const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) {
    throw new Error("Could not find document.xml in DOCX file");
  }
  
  return extractTextFromDocxXml(documentXml);
}

// Detect placeholders in text
function detectPlaceholders(text: string): string[] {
  const placeholders = new Set<string>();
  
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      // Add the full match and the captured group
      placeholders.add(match[0]);
      if (match[1]) {
        placeholders.add(match[1]);
      }
    }
  }
  
  return Array.from(placeholders);
}

// Extract document structure (sections, headings)
function extractStructure(text: string): { sections: string[], headings: string[] } {
  const lines = text.split('\n').filter(line => line.trim());
  const headings: string[] = [];
  const sections: string[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect headings (all caps, numbered sections, or short lines followed by content)
    const isHeading = 
      (trimmed.length < 100 && trimmed === trimmed.toUpperCase() && trimmed.length > 3) ||
      /^\d+\.?\s+[A-Z]/.test(trimmed) ||
      /^(Section|Chapter|Part)\s+\d+/i.test(trimmed) ||
      /^#+\s+/.test(trimmed);
    
    if (isHeading) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      headings.push(trimmed);
      currentSection = trimmed + '\n';
    } else {
      currentSection += trimmed + '\n';
    }
  }
  
  if (currentSection) {
    sections.push(currentSection.trim());
  }
  
  return { sections, headings };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    let fileBlob: Blob;
    let fileName: string;

    if (file) {
      fileBlob = file;
      fileName = file.name;
    } else if (url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: ${response.status}`);
      }
      fileBlob = await response.blob();
      fileName = url.split('/').pop() || 'document.docx';
    } else {
      return new Response(
        JSON.stringify({ error: 'No file or URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext !== 'docx' && ext !== 'doc') {
      return new Response(
        JSON.stringify({ error: 'Only DOCX files are supported for template parsing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing template: ${fileName}`);

    // Parse the DOCX file
    const text = await parseDocx(fileBlob);
    console.log(`Extracted ${text.length} characters from template`);

    // Detect placeholders
    const placeholders = detectPlaceholders(text);
    console.log(`Found ${placeholders.length} placeholders:`, placeholders);

    // Extract structure
    const structure = extractStructure(text);
    console.log(`Found ${structure.headings.length} headings`);

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        content: text,
        placeholders,
        structure: {
          headings: structure.headings,
          sectionCount: structure.sections.length,
          sections: structure.sections.slice(0, 10), // Limit to first 10 sections
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Template parsing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to parse template' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

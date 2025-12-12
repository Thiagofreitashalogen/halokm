import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNSTRUCTURED_API_KEY = Deno.env.get('UNSTRUCTURED_API_KEY');
    if (!UNSTRUCTURED_API_KEY) {
      throw new Error('UNSTRUCTURED_API_KEY is not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileUrl = formData.get('fileUrl') as string;
    const fileName = formData.get('fileName') as string;

    if (!file && !fileUrl) {
      throw new Error('Either file or fileUrl is required');
    }

    console.log('Parsing document:', { 
      hasFile: !!file, 
      fileUrl: fileUrl?.substring(0, 50),
      fileName 
    });

    // Prepare form data for Unstructured API
    const unstructuredFormData = new FormData();
    
    if (file) {
      unstructuredFormData.append('files', file, fileName || file.name);
    } else if (fileUrl) {
      // Fetch the file from URL first
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from URL: ${fileResponse.status}`);
      }
      const fileBlob = await fileResponse.blob();
      unstructuredFormData.append('files', fileBlob, fileName || 'document');
    }

    // Set parsing strategy for better extraction
    unstructuredFormData.append('strategy', 'auto');
    unstructuredFormData.append('hi_res_model_name', 'yolox');

    console.log('Calling Unstructured API...');

    const response = await fetch('https://api.unstructured.io/general/v0/general', {
      method: 'POST',
      headers: {
        'unstructured-api-key': UNSTRUCTURED_API_KEY,
      },
      body: unstructuredFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unstructured API error:', response.status, errorText);
      throw new Error(`Unstructured API error: ${response.status} - ${errorText}`);
    }

    const elements = await response.json();
    
    console.log('Parsed elements count:', elements.length);

    // Extract text content from elements
    const textContent = elements
      .map((element: any) => {
        if (element.type === 'Title') {
          return `# ${element.text}`;
        } else if (element.type === 'NarrativeText' || element.type === 'UncategorizedText') {
          return element.text;
        } else if (element.type === 'ListItem') {
          return `• ${element.text}`;
        } else if (element.type === 'Table') {
          return element.text || element.metadata?.text_as_html || '';
        } else {
          return element.text || '';
        }
      })
      .filter((text: string) => text.trim())
      .join('\n\n');

    // Extract metadata
    const metadata = {
      filename: elements[0]?.metadata?.filename || fileName,
      filetype: elements[0]?.metadata?.filetype,
      page_count: new Set(elements.map((e: any) => e.metadata?.page_number).filter(Boolean)).size,
      element_count: elements.length,
    };

    console.log('Extraction complete:', { 
      textLength: textContent.length, 
      ...metadata 
    });

    return new Response(JSON.stringify({ 
      content: textContent,
      metadata,
      elements: elements.slice(0, 50) // Return first 50 elements for debugging
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

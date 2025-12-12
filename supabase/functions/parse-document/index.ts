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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    // Get file content as base64
    let fileBase64: string;
    let mimeType: string;
    let actualFileName: string;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      fileBase64 = btoa(String.fromCharCode(...uint8Array));
      mimeType = file.type || 'application/octet-stream';
      actualFileName = fileName || file.name;
    } else if (fileUrl) {
      console.log('Fetching file from URL...');
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file from URL: ${fileResponse.status}`);
      }
      const arrayBuffer = await fileResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      fileBase64 = btoa(String.fromCharCode(...uint8Array));
      mimeType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      actualFileName = fileName || 'document';
    } else {
      throw new Error('No file provided');
    }

    console.log('Calling Lovable AI for document analysis...', { 
      fileName: actualFileName, 
      mimeType,
      base64Length: fileBase64.length 
    });

    // Use Lovable AI to extract document content
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract and structure the complete text content from this document. Format the output as follows:
                
1. Use "# " for main titles/headings
2. Use "## " for sub-headings  
3. Use "• " for bullet points
4. Preserve paragraph structure with blank lines between sections
5. Extract any tables in a readable format

Provide ONLY the extracted text content, no commentary or explanation. Be thorough and include all text from the document.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${fileBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const textContent = result.choices?.[0]?.message?.content || '';
    
    console.log('Extraction complete:', { 
      textLength: textContent.length,
      fileName: actualFileName
    });

    // Extract metadata
    const metadata = {
      filename: actualFileName,
      filetype: mimeType,
      page_count: 1, // Lovable AI processes as single content
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

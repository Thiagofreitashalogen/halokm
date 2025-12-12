import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract file ID from various Google Drive/Docs/Slides URL formats
function extractGoogleFileId(url: string): { fileId: string | null; fileType: string } {
  const patterns = [
    // Google Drive file
    { regex: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/, type: 'drive' },
    // Google Docs
    { regex: /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/, type: 'document' },
    // Google Slides
    { regex: /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/, type: 'presentation' },
    // Google Sheets
    { regex: /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, type: 'spreadsheet' },
    // Google Drive open URL
    { regex: /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/, type: 'drive' },
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return { fileId: match[1], fileType: pattern.type };
    }
  }

  return { fileId: null, fileType: 'unknown' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, accessToken } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    if (!accessToken) {
      throw new Error('Google access token is required. Please sign in with Google first.');
    }

    console.log('Fetching Google Drive file:', { url: url.substring(0, 50) });

    const { fileId, fileType } = extractGoogleFileId(url);
    
    if (!fileId) {
      throw new Error('Could not extract file ID from the provided URL. Please ensure it is a valid Google Drive, Docs, Slides, or Sheets URL.');
    }

    console.log('Extracted file info:', { fileId, fileType });

    // Get file metadata first
    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,size`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!metadataResponse.ok) {
      const error = await metadataResponse.text();
      console.error('Metadata fetch error:', metadataResponse.status, error);
      
      if (metadataResponse.status === 401) {
        throw new Error('Access token expired. Please sign in with Google again.');
      }
      if (metadataResponse.status === 404) {
        throw new Error('File not found. Please check if you have access to this file.');
      }
      if (metadataResponse.status === 403) {
        throw new Error('Access denied. Please ensure you have permission to view this file.');
      }
      
      throw new Error(`Failed to fetch file metadata: ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json();
    console.log('File metadata:', metadata);

    // Determine export format based on file type
    let exportMimeType = 'text/plain';
    let downloadUrl = '';

    const mimeType = metadata.mimeType;
    
    if (mimeType === 'application/vnd.google-apps.document') {
      // Google Docs - export as plain text or PDF for better parsing
      exportMimeType = 'application/pdf';
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
    } else if (mimeType === 'application/vnd.google-apps.presentation') {
      // Google Slides - export as PDF
      exportMimeType = 'application/pdf';
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      // Google Sheets - export as CSV
      exportMimeType = 'text/csv';
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
    } else {
      // Regular file - download directly
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    }

    console.log('Downloading file:', { downloadUrl: downloadUrl.substring(0, 80), exportMimeType });

    const contentResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!contentResponse.ok) {
      const error = await contentResponse.text();
      console.error('Content fetch error:', contentResponse.status, error);
      throw new Error(`Failed to download file: ${contentResponse.status}`);
    }

    // Get the content as base64 for binary files or text for text files
    const contentType = contentResponse.headers.get('content-type') || exportMimeType;
    let content: string;
    let isBase64 = false;

    if (contentType.includes('text') || contentType.includes('csv') || contentType.includes('json')) {
      content = await contentResponse.text();
    } else {
      // For binary files (PDF, etc.), return as base64
      const buffer = await contentResponse.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      content = btoa(binary);
      isBase64 = true;
    }

    console.log('File downloaded successfully:', { 
      contentLength: content.length,
      contentType,
      isBase64
    });

    return new Response(JSON.stringify({
      success: true,
      fileName: metadata.name,
      mimeType: contentType,
      content,
      isBase64,
      originalMimeType: metadata.mimeType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Google Drive file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

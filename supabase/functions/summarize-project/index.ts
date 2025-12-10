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
    const { driveContent, miroContent } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const combinedContent = `
Google Drive Content:
${driveContent || 'No content provided'}

Miro Board Content:
${miroContent || 'No content provided'}
    `.trim();

    console.log('Summarizing project content...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing design consultancy project documentation and extracting structured summaries.

Your task is to analyze the provided content and extract:
1. A clear project description (2-3 sentences summarizing what the project was about)
2. A list of deliverables (tangible outputs produced)
3. Methods and tools used (design methods, frameworks, tools, techniques)

Respond ONLY with a valid JSON object in this exact format:
{
  "title": "Project title inferred from content",
  "description": "A concise 2-3 sentence description of the project",
  "client": "Client name if mentioned, or null",
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "methods": ["Method 1", "Tool 2", "Framework 3"],
  "tags": ["relevant", "tags", "for", "categorization"],
  "learnings": ["Key learning 1", "Key learning 2"]
}

If you cannot extract certain information, use empty arrays or null. Always return valid JSON.`
          },
          {
            role: 'user',
            content: `Please analyze this project documentation and extract the structured summary:\n\n${combinedContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse the JSON response
    let summary;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a default structure if parsing fails
      summary = {
        title: 'Untitled Project',
        description: 'Could not extract description from the provided content.',
        client: null,
        deliverables: [],
        methods: [],
        tags: [],
        learnings: []
      };
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

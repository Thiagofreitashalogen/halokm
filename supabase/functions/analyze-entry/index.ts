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
    const { fileContents, pastedContent, links, suggestedCategory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const combinedContent = `
${fileContents ? `File Contents:\n${fileContents}` : ''}

${pastedContent ? `Pasted Content:\n${pastedContent}` : ''}

${links ? `Links provided:\n${links}` : ''}
    `.trim();

    if (!combinedContent || combinedContent.length < 10) {
      throw new Error('Insufficient content to analyze');
    }

    console.log('Analyzing entry content...', { 
      contentLength: combinedContent.length,
      suggestedCategory 
    });

    const systemPrompt = `You are an expert at analyzing design consultancy documentation and extracting structured information for a knowledge management system.

Your task is to:
1. DETERMINE the correct category for this entry:
   - "project": A completed or ongoing project with deliverables, client work, case studies
   - "offer": A proposal, tender response, bid, or quote (won, lost, or pending)
   - "method": A design method, tool, framework, process, or technique

2. EXTRACT all relevant information based on the category

Respond ONLY with a valid JSON object in this exact format:
{
  "category": "project" | "offer" | "method",
  "title": "Clear, concise title",
  "description": "A comprehensive 2-4 sentence description",
  "client": "Client name if mentioned, or null",
  "tags": ["relevant", "tags", "for", "search"],
  "learnings": ["Key insight 1", "Key insight 2"],
  
  // For projects:
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "methods": ["Method 1", "Tool 2"],
  "projectStatus": "active" | "completed" | "archived",
  
  // For offers:
  "offerStatus": "draft" | "pending" | "won" | "lost",
  "winFactors": ["Factor that helped win"],
  "lossFactors": ["Reason for losing"],
  
  // For methods:
  "useCases": ["When to use this", "Another use case"],
  "steps": ["Step 1", "Step 2"]
}

${suggestedCategory ? `The user indicated this might be a "${suggestedCategory}", but override if the content clearly indicates otherwise.` : ''}

Important:
- Be thorough in extracting information
- Use empty arrays [] for fields with no data
- Always return valid JSON
- Infer the most likely category from the content
- Extract as many relevant tags as possible for searchability`;

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please analyze this content and extract a structured summary:\n\n${combinedContent}`
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
    
    console.log('AI response received:', content?.substring(0, 200));

    // Parse the JSON response
    let summary;
    try {
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
        category: suggestedCategory || 'project',
        title: 'Untitled Entry',
        description: 'Could not extract description from the provided content.',
        client: null,
        tags: [],
        learnings: [],
        deliverables: [],
        methods: [],
        projectStatus: 'completed',
        offerStatus: 'draft',
        winFactors: [],
        lossFactors: [],
        useCases: [],
        steps: []
      };
    }

    // Ensure all expected fields exist
    const normalizedSummary = {
      category: summary.category || suggestedCategory || 'project',
      title: summary.title || 'Untitled Entry',
      description: summary.description || '',
      client: summary.client || null,
      tags: Array.isArray(summary.tags) ? summary.tags : [],
      learnings: Array.isArray(summary.learnings) ? summary.learnings : [],
      deliverables: Array.isArray(summary.deliverables) ? summary.deliverables : [],
      methods: Array.isArray(summary.methods) ? summary.methods : [],
      projectStatus: summary.projectStatus || 'completed',
      offerStatus: summary.offerStatus || 'draft',
      winFactors: Array.isArray(summary.winFactors) ? summary.winFactors : [],
      lossFactors: Array.isArray(summary.lossFactors) ? summary.lossFactors : [],
      useCases: Array.isArray(summary.useCases) ? summary.useCases : [],
      steps: Array.isArray(summary.steps) ? summary.steps : [],
    };

    console.log('Returning normalized summary:', normalizedSummary.category, normalizedSummary.title);

    return new Response(JSON.stringify({ summary: normalizedSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

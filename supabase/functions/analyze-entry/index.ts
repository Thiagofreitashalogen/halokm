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
  
  // For projects (do NOT extract methods - users will add these manually):
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "projectStatus": "active" | "completed" | "archived",
  "fullDescription": "<HTML formatted detailed summary>",
  
  // For offers:
  "offerStatus": "draft" | "pending" | "won" | "lost",
  "winFactors": ["Factor that helped win"],
  "lossFactors": ["Reason for losing"],
  "fullDescription": "<HTML formatted detailed summary>",
  
  // For methods:
  "useCases": ["When to use this", "Another use case"],
  "steps": ["Step 1", "Step 2"],
  "fullDescription": "<HTML formatted detailed summary>"
}

IMPORTANT - HTML FORMATTING FOR fullDescription:
The fullDescription field MUST be formatted as HTML with proper structure. Use these tags:
- <h2>Section Title</h2> for main sections
- <h3>Subsection</h3> for subsections
- <p>Paragraph text</p> for paragraphs
- <strong>bold text</strong> for emphasis
- <em>italic text</em> for emphasis
- <ul><li>item</li></ul> for bullet lists

Example structure for a PROJECT fullDescription:
<h2>Project Overview</h2>
<p>Brief introduction to the project goals and context.</p>

<h2>Objectives</h2>
<p>What the project aimed to achieve...</p>

<h2>Process & Methodology</h2>
<p>Description of the approach taken...</p>

<h2>Deliverables & Outcomes</h2>
<p>What was produced and the results achieved...</p>

Example structure for an OFFER fullDescription:
<h2>Opportunity Overview</h2>
<p>Context about the tender/proposal...</p>

<h2>Proposed Approach</h2>
<p>The methodology and strategy proposed...</p>

<h2>Key Differentiators</h2>
<p>What made this offer stand out...</p>

Example structure for a METHOD fullDescription:
<h2>Overview</h2>
<p>What this method/tool is about...</p>

<h2>How It Works</h2>
<p>Detailed explanation of the process...</p>

<h2>Benefits</h2>
<p>Why and when to use this method...</p>

${suggestedCategory ? `The user indicated this might be a "${suggestedCategory}", but override if the content clearly indicates otherwise.` : ''}

Important:
- Be thorough in extracting information
- Use empty arrays [] for fields with no data
- Always return valid JSON
- Infer the most likely category from the content
- Extract as many relevant tags as possible for searchability
- The fullDescription MUST be HTML formatted with proper semantic structure`;

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
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\s*/g, '');
      }
      
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
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
      deliverables: Array.isArray(summary.deliverables) ? summary.deliverables : [],
      methods: Array.isArray(summary.methods) ? summary.methods : [],
      projectStatus: summary.projectStatus || 'completed',
      offerStatus: summary.offerStatus || 'draft',
      winFactors: Array.isArray(summary.winFactors) ? summary.winFactors : [],
      lossFactors: Array.isArray(summary.lossFactors) ? summary.lossFactors : [],
      useCases: Array.isArray(summary.useCases) ? summary.useCases : [],
      steps: Array.isArray(summary.steps) ? summary.steps : [],
      fullDescription: summary.fullDescription || '',
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

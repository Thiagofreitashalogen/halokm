import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenderContent } = await req.json();

    if (!tenderContent) {
      return new Response(
        JSON.stringify({ error: 'Tender content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch relevant knowledge
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch won offers for strategy reference
    const { data: wonOffers } = await supabase
      .from('knowledge_entries')
      .select('id, title, description, winning_strategy, deliverables, tags')
      .eq('category', 'offer')
      .eq('offer_status', 'won')
      .limit(20);

    // Fetch methods for reference
    const { data: methods } = await supabase
      .from('knowledge_entries')
      .select('id, title, description, field, domain')
      .eq('category', 'method')
      .limit(30);

    const wonOffersContext = wonOffers?.map(o => 
      `[ID: ${o.id}] ${o.title}: ${o.description || ''} | Winning strategy: ${o.winning_strategy || 'N/A'} | Deliverables: ${o.deliverables?.join(', ') || 'N/A'}`
    ).join('\n') || 'No won offers available';

    const methodsContext = methods?.map(m =>
      `[ID: ${m.id}] ${m.title}: ${m.description || ''} | Field: ${m.field || 'N/A'} | Domain: ${m.domain || 'N/A'}`
    ).join('\n') || 'No methods available';

    const systemPrompt = `You are a senior design consultant and business developer helping to analyze tender documents and suggest winning strategies.

You have access to the organization's knowledge base:

## WON OFFERS (for strategy inspiration):
${wonOffersContext}

## METHODS & TOOLS (capabilities to leverage):
${methodsContext}

Your task is to:
1. Analyze the tender/RFP content provided
2. Extract key challenges, deliverables, and requirements
3. Suggest a winning strategy based on similar won offers
4. Recommend relevant methods from the knowledge base

Return your analysis as a JSON object with this structure:
{
  "summary": "Brief summary of the tender (2-3 sentences)",
  "challenges": ["Challenge 1", "Challenge 2", ...],
  "deliverables": ["Deliverable 1", "Deliverable 2", ...],
  "requirements": ["Requirement 1", "Requirement 2", ...],
  "winning_strategy": "Detailed winning strategy recommendation (2-3 paragraphs)",
  "referenced_offers": ["uuid1", "uuid2"] // IDs of similar won offers that informed the strategy,
  "referenced_methods": ["uuid1", "uuid2"] // IDs of recommended methods to use
}

Only include offer and method IDs that actually exist in the provided context.`;

    console.log('Analyzing tender document...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nPlease analyze this tender/RFP document:\n\n${tenderContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.[0]?.text || '';

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        summary: content.slice(0, 500),
        challenges: [],
        deliverables: [],
        requirements: [],
        winning_strategy: content,
        referenced_offers: [],
        referenced_methods: [],
      };
    }

    console.log('Tender analysis complete');

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing tender:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to analyze tender' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

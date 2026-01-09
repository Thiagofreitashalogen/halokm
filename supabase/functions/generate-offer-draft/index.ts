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
    const { 
      tenderSummary,
      challenges,
      deliverables,
      requirements,
      winningStrategy,
      templateId,
      styleGuideId,
      referencedMethods
    } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch template if provided
    let templateContext = '';
    if (templateId) {
      const { data: template } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (template) {
        templateContext = `
## TEMPLATE STRUCTURE TO FOLLOW:
Name: ${template.name}
${template.extracted_structure?.headings ? `Sections: ${template.extracted_structure.headings.join(', ')}` : ''}
${template.placeholders?.length ? `Placeholders to fill: ${template.placeholders.join(', ')}` : ''}
`;
      }
    }

    // Fetch style guide if provided
    let styleContext = '';
    if (styleGuideId) {
      const { data: styleGuide } = await supabase
        .from('style_guides')
        .select('*')
        .eq('id', styleGuideId)
        .single();
      
      if (styleGuide) {
        styleContext = `
## WRITING STYLE GUIDELINES:
Name: ${styleGuide.name}
Tone of Voice: ${styleGuide.tone_of_voice || 'Professional and engaging'}
Writing Guidelines: ${styleGuide.writing_guidelines || 'Clear, concise, and compelling'}
`;
      }
    }

    // Fetch referenced methods for context
    let methodsContext = '';
    if (referencedMethods?.length) {
      const { data: methods } = await supabase
        .from('knowledge_entries')
        .select('title, description, field, domain, use_cases')
        .in('id', referencedMethods);
      
      if (methods?.length) {
        methodsContext = `
## METHODS TO INCORPORATE:
${methods.map(m => `- ${m.title}: ${m.description || ''}`).join('\n')}
`;
      }
    }

    const systemPrompt = `You are an expert proposal writer for a design consultancy. Your task is to write a compelling offer/proposal based on the provided context.

${templateContext}
${styleContext}
${methodsContext}

Write a professional, persuasive proposal that:
1. Addresses all client challenges and requirements
2. Clearly outlines the proposed deliverables
3. Incorporates the winning strategy
4. References relevant methods and capabilities
5. Follows the template structure if provided
6. Matches the tone of voice from the style guide

Format the output in Markdown with clear sections and headers.`;

    const userPrompt = `Please write an offer proposal based on this context:

## TENDER SUMMARY:
${tenderSummary || 'No summary provided'}

## CLIENT CHALLENGES:
${challenges?.join('\n- ') || 'No challenges specified'}

## REQUIRED DELIVERABLES:
${deliverables?.join('\n- ') || 'No deliverables specified'}

## REQUIREMENTS:
${requirements?.join('\n- ') || 'No requirements specified'}

## WINNING STRATEGY:
${winningStrategy || 'No strategy provided'}

Generate a complete, professional offer proposal.`;

    console.log('Generating offer draft...');

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
            content: `${systemPrompt}\n\n${userPrompt}`
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
    const draftContent = aiResponse.content?.[0]?.text || '';

    console.log('Offer draft generated successfully');

    return new Response(
      JSON.stringify({ success: true, draft: draftContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating offer draft:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  description: string | null;
  client: string | null;
  field: string | null;
  domain: string | null;
  project_status: string | null;
  offer_status: string | null;
  position: string | null;
  studio: string | null;
  industry: string | null;
  deliverables: string[] | null;
  learnings: string[] | null;
  win_factors: string[] | null;
  loss_factors: string[] | null;
  winning_strategy: string | null;
  loss_reasons: string | null;
  full_description: string | null;
}

function formatEntryForContext(entry: KnowledgeEntry): string {
  const parts = [`[ID:${entry.id}] ${entry.title} (${entry.category})`];
  
  if (entry.description) parts.push(`Description: ${entry.description}`);
  if (entry.full_description) parts.push(`Details: ${entry.full_description.slice(0, 500)}...`);
  if (entry.client) parts.push(`Client: ${entry.client}`);
  if (entry.field) parts.push(`Field: ${entry.field}`);
  if (entry.domain) parts.push(`Domain: ${entry.domain}`);
  if (entry.project_status) parts.push(`Project Status: ${entry.project_status}`);
  if (entry.offer_status) parts.push(`Offer Status: ${entry.offer_status}`);
  if (entry.position) parts.push(`Position: ${entry.position}`);
  if (entry.studio) parts.push(`Studio: ${entry.studio}`);
  if (entry.industry) parts.push(`Industry: ${entry.industry}`);
  if (entry.deliverables?.length) parts.push(`Deliverables: ${entry.deliverables.join(", ")}`);
  if (entry.learnings?.length) parts.push(`Learnings: ${entry.learnings.join("; ")}`);
  if (entry.win_factors?.length) parts.push(`Win Factors: ${entry.win_factors.join(", ")}`);
  if (entry.loss_factors?.length) parts.push(`Loss Factors: ${entry.loss_factors.join(", ")}`);
  if (entry.winning_strategy) parts.push(`Winning Strategy: ${entry.winning_strategy}`);
  if (entry.loss_reasons) parts.push(`Loss Reasons: ${entry.loss_reasons}`);
  
  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Smart Search query:", question);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all knowledge entries
    const { data: entries, error: dbError } = await supabase
      .from("knowledge_entries")
      .select("*");

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch knowledge base" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ 
          answer: "The knowledge base is currently empty. Please add some entries first.",
          citations: [],
          confidence: "low"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format entries for context
    const context = entries.map(formatEntryForContext).join("\n\n---\n\n");
    
    console.log(`Loaded ${entries.length} entries for context`);

    // Build the RAG prompt
    const systemPrompt = `You are a senior design consultant and business developer with deep expertise in design consultancy work. You have access to a knowledge base containing projects, offers (won and lost), methods/tools, clients, and team members.

Your role is to answer questions by drawing insights from this knowledge base. When you reference information from the knowledge base, you MUST cite the source using this exact format: [REF:entry_id]

Guidelines:
- Be concise but thorough
- Always cite specific entries when making claims
- If you're unsure or the information isn't in the knowledge base, say so
- Draw connections between related entries when relevant
- Provide actionable insights when possible
- Think like a senior consultant helping a colleague

IMPORTANT: Your citations must use the exact ID from the knowledge base entries. Format: [REF:uuid-here]`;

    const userPrompt = `KNOWLEDGE BASE:
${context}

---

USER QUESTION: ${question}

Please answer the question based on the knowledge base above. Remember to cite sources using [REF:entry_id] format.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || "No response generated";

    console.log("AI response received");

    // Extract citations from the answer
    const citationRegex = /\[REF:([a-f0-9-]+)\]/gi;
    const citationMatches = [...answer.matchAll(citationRegex)];
    const citedIds = [...new Set(citationMatches.map((m) => m[1]))];

    // Get citation metadata
    const citations = citedIds
      .map((id) => {
        const entry = entries.find((e) => e.id === id);
        if (!entry) return null;
        return {
          id: entry.id,
          title: entry.title,
          category: entry.category,
        };
      })
      .filter(Boolean);

    console.log(`Found ${citations.length} citations`);

    return new Response(
      JSON.stringify({
        answer,
        citations,
        confidence: citations.length > 0 ? "high" : "medium",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Smart search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

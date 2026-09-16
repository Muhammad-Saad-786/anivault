// supabase/functions/ai-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENROUTER_KEY = Deno.env.get('OPENROUTER_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { messages, stream = false, model } = await req.json();

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://anivault.app',
      'X-Title': 'AniVault',
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.3-70b-instruct',
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  return new Response(res.body, {
    status: res.status,
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
  });
});
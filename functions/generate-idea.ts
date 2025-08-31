// supabase/functions/generate-idea/index.ts
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.34.0';
// Define the CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // --- Environment Variable Setup ---
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  // Optional system prompt from environment
  const SYSTEM_PROMPT_ENV = Deno.env.get('SYSTEM_PROMPT');
    // --- Environment Variable Validation ---
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Missing required environment variables'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // NOTE: Supabase client is initialized but not used in this function.
    // You would use it here if you wanted to save the result to your database.
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    // --- Validate the request is from an authenticated user ---
    // Expect an Authorization: Bearer <access_token> header from the client.
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing Authorization header' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Verify token by calling Supabase's auth endpoint which returns the user
    const userResp = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        // include the service role key as apikey so the request is scoped to the project
        'apikey': SERVICE_ROLE_KEY
      }
    }).catch((e) => {
      console.error('Error contacting auth endpoint', e && e.message ? e.message : e);
      return null;
    });

    if (!userResp || !userResp.ok) {
      const txt = userResp ? await userResp.text().catch(()=>'') : '';
      console.error('Auth validation failed', userResp ? userResp.status : 'no-response', txt);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const userJson = await userResp.json().catch(()=>null);
    // The /auth/v1/user endpoint may return the user object directly or a wrapper
    const user = userJson && (userJson.user || userJson) ? (userJson.user || userJson) : null;
    if (!user || !user.id) {
      console.error('Invalid user payload from auth endpoint', userJson);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // --- Request Body Parsing ---
    const body = await req.json().catch(()=>({}));
    // Expect client to pass { promptText: string, systemPrompt?: string }
    const userPromptText = (body.promptText || '').toString().trim();
    // Allow client to override system prompt; otherwise try env var then default
  const clientSystemPrompt = (body.systemPrompt && body.systemPrompt.toString().trim()) || SYSTEM_PROMPT_ENV || 'You are an expert product strategist and copywriter. Respond concisely and in a structured format using the following sections: Title:, Summary:, Details:, Tags:. Keep tags to a short comma-separated list.';
    if (!userPromptText) {
      return new Response(JSON.stringify({ error: 'Bad Request: missing promptText in request body' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // --- Call Google Gemini API (Corrected) ---
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    // Send both system and user prompts so the model receives instruction + user description.
    const payload = {
      contents: [
        {
          parts: [
            { text: clientSystemPrompt },
            { text: userPromptText }
          ]
        }
      ]
    };
    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!geminiResp.ok) {
      const errorBody = await geminiResp.text();
      console.error('Gemini API error response:', errorBody);
      return new Response(JSON.stringify({
        error: `AI provider error: ${geminiResp.statusText}`
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const geminiJson = await geminiResp.json();
    const idea = transformGeminiResponseToIdea(geminiJson);
    // --- Return Successful Response ---
    return new Response(JSON.stringify({
      idea
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('Unhandled error in handler:', err.message);
    return new Response(JSON.stringify({
      error: 'Internal Server Error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
/**
 * Transforms the nested response from the Google Gemini API into a flat object.
 * @param {any} res - The JSON response from the Gemini API.
 * @returns {{title: string, summary: string, details: string, tags: string[], icon: string}}
 */ function transformGeminiResponseToIdea(res) {
  // Safely access the generated text from the API response
  const text = res?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const lines = text.split('\n').filter((line)=>line.trim() !== '');
  // Extract tags if they are in the format "Tags: tag1, tag2"
  let tags = [];
  const tagsLine = lines.find((line)=>line.toLowerCase().startsWith('tags:'));
  if (tagsLine) {
    tags = tagsLine.substring(5).split(',').map((tag)=>tag.trim()).slice(0, 6);
  }
  return {
    title: lines[0]?.replace('Title:', '').trim() || 'AI Idea',
    summary: lines[1]?.replace('Summary:', '').trim() || '',
    details: lines.slice(2).join('\n').replace('Details:', '').trim() || '',
    tags: tags,
    icon: '💡'
  };
}

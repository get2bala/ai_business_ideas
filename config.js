// config.js
// Store sensitive credentials here. Do NOT commit this file to public repositories.

var SUPABASE_URL = 'https://gdpjavidjguhxzaaqldi.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkcGphdmlkamd1aHh6YWFxbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mjc1MzAsImV4cCI6MjA3MjEwMzUzMH0.V1ZQOguQkni0OfA-2hkGclAWQl9wPkEBvcdG65nwYWk';

// Public function URL for the Generate Idea Edge Function (replace with your deployed URL)
var GENERATE_FN_URL = 'https://gdpjavidjguhxzaaqldi.supabase.co/functions/v1/generate-idea';

// System prompt to guide the AI's response format and tone.
// This will be sent from the client together with the user's text entry to the edge function.
var SYSTEM_PROMPT = 'You are an expert product strategist and copywriter. Respond concisely and in a structured format using the following sections: Title:, Summary:, Details:, Tags:. Keep tags to a short comma-separated list.';

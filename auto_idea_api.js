// auto_idea_api.js
// API wrapper for automatic idea generation
import { generateIdea } from './auto_idea_generator.js';

// `config.js` is loaded as a plain script in index.html and exposes
// GENERATE_FN_URL as a global variable. Read it from window if present.
const FN_URL = (typeof window !== 'undefined' && window.GENERATE_FN_URL) ? window.GENERATE_FN_URL : (typeof GENERATE_FN_URL !== 'undefined' ? GENERATE_FN_URL : '<YOUR_FUNCTION_URL_HERE>');

export async function fetchAutoIdea(prompt) {
    // If function URL not configured, fallback to local generator for tests/dev
    if (!FN_URL || FN_URL.includes('<YOUR_FUNCTION_URL_HERE')) {
        return await generateIdea(prompt);
    }

    try {
        // Get access token from db.js directly
        let token = null;
        try {
            const { db } = await import('./db.js');
            const { data: { session }, error } = await db.auth.getSession();
            if (error) {
                console.error('Error getting auth session:', error);
            } else {
                token = session?.access_token;
            }
        } catch (e) {
            console.error('Error accessing auth:', e);
            // We'll still try to call the function, it will return 401 if auth is required
        }

        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (!token) {
            // No logged-in user detected — prompt the user to sign in before calling an auth-protected function
            console.warn('No auth token found. Prompting user to sign in before calling generate function.');
            const loginModal = typeof document !== 'undefined' ? document.getElementById('login-modal') : null;
            if (loginModal) loginModal.classList.add('active');
            throw new Error('Authentication required');
        }
        if (token) headers['Authorization'] = `Bearer ${token}`;
        // Use CORS mode explicitly so preflight behaviour is clear in browsers.
        // Note: sending an Authorization header will trigger a preflight OPTIONS request.
        // Send both the user's text entry (promptText) and the system prompt (if available on window)
        const res = await fetch(FN_URL, {
            method: 'POST',
            mode: 'cors',
            headers,
            body: JSON.stringify({ promptText: prompt, systemPrompt: (typeof window !== 'undefined' && window.SYSTEM_PROMPT) ? window.SYSTEM_PROMPT : undefined })
        });

        if (!res.ok) {
            const errorText = await res.text().catch(() => 'no body');
            if (res.status === 401) {
                console.warn('Authentication required. Please log in to generate ideas.');
                const loginModal = document.getElementById('login-modal');
                if (loginModal) loginModal.classList.add('active');
                throw new Error('Authentication required');
            } else {
                console.warn(`Auto idea function returned ${res.status}:`, errorText);
                return await generateIdea(prompt);
            }
        }
        const json = await res.json();
        if (json && json.idea) {
            // tag source for debugging
            json.idea.__source = 'edge';
            console.log('fetchAutoIdea: received idea from edge function', json.idea);
            return json.idea;
        }
        const local = await generateIdea(prompt);
        local.__source = 'local';
        console.log('fetchAutoIdea: falling back to local generator', local);
        return local;
    } catch (err) {
        // Common browser symptom when preflight fails is a generic TypeError: "Load failed"
        // Surface a helpful diagnostic to the console so you can update your Edge Function to
        // properly respond to OPTIONS (CORS preflight) requests and allow the Authorization header.
        console.error('fetchAutoIdea error', err);
        if (err && typeof err.message === 'string' && err.message.includes('Load failed')) {
            console.error('Likely CORS preflight failure (OPTIONS) or server rejected the preflight.\n' +
                'Ensure your Edge Function responds to OPTIONS with appropriate Access-Control-Allow-* headers.\n' +
                'Example headers to allow requests that include the Authorization header:\n' +
                "Access-Control-Allow-Origin: *\nAccess-Control-Allow-Methods: POST, OPTIONS\nAccess-Control-Allow-Headers: Authorization, Content-Type\nAccess-Control-Max-Age: 3600\n\n" +
                'If your front-end includes credentials, use a specific origin and set Access-Control-Allow-Credentials: true instead of *.');
        }

        const localErr = await generateIdea(prompt);
        localErr.__source = 'local';
        return localErr;
    }
}

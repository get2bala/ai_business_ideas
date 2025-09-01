// db.js
// Be defensive when referencing a global `supabase` helper. In some test or runtime
// environments `supabase` may not be a raw identifier, so avoid destructuring from
// an undefined value which would throw at module import time.

let createClientFn;
if (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function') {
    createClientFn = supabase.createClient;
} else if (typeof globalThis !== 'undefined' && globalThis.supabase && typeof globalThis.supabase.createClient === 'function') {
    createClientFn = globalThis.supabase.createClient;
} else {
    createClientFn = undefined;
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are defined in config.js');
}

// Create a safe `db` export. If we can't find a real createClient function, export
// a lightweight stub so other modules don't throw when importing `db`.
let _db;
if (!createClientFn) {
    console.error('Supabase client not found. Falling back to a stub database client.');
    _db = {
        from: () => ({
            select: async () => ({ data: [], error: null }),
            insert: () => ({ select: async () => ({ data: [], error: null }) }),
            delete: () => ({ eq: async () => ({ error: null }) })
        }),
        auth: {
            onAuthStateChange: () => {},
            signInWithPassword: async () => ({ error: null }),
            signUp: async () => ({ error: null }),
            signOut: async () => ({ error: null })
        }
    };
} else {
    _db = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Test the connection and log a friendly count. Use select('*') and print the
    // array length when available so logs are meaningful in both tests and runtime.
    _db.from('ideas').select('*')
        .then(({ data, error }) => {
            if (error) {
                console.error('Database connection error:', error);
            } else {
                const count = Array.isArray(data) ? data.length : (data && data.count) || 0;
                console.log('Database connected successfully. Ideas count:', count);
            }
        })
        .catch(err => {
            console.error('Failed to connect to database:', err);
        });
}

export const db = _db;

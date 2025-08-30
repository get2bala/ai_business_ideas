// Runs before modules are loaded. Provide globals and DOM elements needed at import time.

// Ensure SUPABASE config globals exist for modules that read them at import
global.SUPABASE_URL = global.SUPABASE_URL || 'https://test.supabase.co';
global.SUPABASE_ANON_KEY = global.SUPABASE_ANON_KEY || 'anon-key';

// Provide a minimal markdownit stub used by ui.js
if (!global.window) global.window = global;
if (!window.markdownit) {
  window.markdownit = () => ({ render: (s) => s });
}

// Create minimal DOM elements that modules read at import time
const ids = [
  'add-idea-form','add-idea-btn','add-idea-modal','add-idea-modal-close','loading-indicator',
  'auth-section','ideas-grid','filter-container','idea-modal','modal-body',
  'login-modal-close','login-form','login-email','login-password'
];
ids.forEach(id => {
  if (!document.getElementById(id)) {
    let el;
    if (id === 'add-idea-form' || id === 'login-form') el = document.createElement('form');
    else el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
});

// Mock a simple supabase-like client used by the app
global.supabase = {
  createClient: (url, key) => {
    const auth = {
      _user: null,
      onAuthStateChange: (cb) => {
        global.__triggerAuth = (user) => {
          auth._user = user;
          cb(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
        };
      },
      signInWithPassword: async ({ email }) => ({ error: null }),
      signUp: async ({ email }) => ({ error: null }),
      signOut: async () => ({ error: null })
    };

    const _tableData = { ideas: [] };

    const from = (table) => ({
      select: (cols) => ({
        order: async (col, opts) => {
          if (global.__forceDbError) return { data: null, error: { message: 'forced' } };
          return { data: _tableData[table] || [], error: null };
        },
        then: async (resolve) => {
          if (global.__forceDbError) return resolve({ data: null, error: { message: 'forced' } });
          return resolve({ data: _tableData[table] || [], error: null });
        }
      }),
      insert: (rows) => ({
        select: async () => {
          if (global.__forceDbError) return { data: null, error: { message: 'forced' } };
          const idStart = (_tableData[table] || []).length + 1;
          const newRows = rows.map((r, i) => ({ id: idStart + i, ...r }));
          _tableData[table] = (_tableData[table] || []).concat(newRows);
          return { data: newRows, error: null };
        }
      }),
      delete: () => ({
        eq: async (col, val) => {
          if (global.__forceDbError) return { error: { message: 'forced' } };
          return { error: null };
        }
      })
    });

    return { auth, from };
  }
};

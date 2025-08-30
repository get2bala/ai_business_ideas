// Provide a minimal DOM environment hooks are already provided by jsdom testEnvironment

// Mock a simple supabase-like client used by the app
global.supabase = {
  createClient: (url, key) => {
    // Simple mock client with auth and from() chainable API
    const auth = {
      _user: null,
      onAuthStateChange: (cb) => {
        // Expose a method to simulate auth changes in tests
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
      // emulate db.from(table).select('*').order(...)
      select: (cols) => ({
        order: async (col, opts) => {
          if (global.__forceDbError) return { data: null, error: { message: 'forced' } };
          return { data: _tableData[table] || [], error: null };
        },
        // allow awaiting select() directly in some code paths
        then: async (resolve) => {
          if (global.__forceDbError) return resolve({ data: null, error: { message: 'forced' } });
          return resolve({ data: _tableData[table] || [], error: null });
        }
      }),
      // emulate db.from(table).insert(rows).select()
      insert: (rows) => ({
        select: async () => {
          if (global.__forceDbError) return { data: null, error: { message: 'forced' } };
          const idStart = (_tableData[table] || []).length + 1;
          const newRows = rows.map((r, i) => ({ id: idStart + i, ...r }));
          _tableData[table] = (_tableData[table] || []).concat(newRows);
          return { data: newRows, error: null };
        }
      }),
      // emulate db.from(table).delete().eq(...)
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

// Simple test hooks: capture console.error calls so tests can assert on them
const originalConsoleError = console.error;
beforeEach(() => {
  console._errors = [];
  console.error = (...args) => {
    console._errors.push(args);
    originalConsoleError.apply(console, args);
  };
});
afterEach(() => {
  console.error = originalConsoleError;
  delete global.__triggerAuth;
  delete global.__forceDbError;
});

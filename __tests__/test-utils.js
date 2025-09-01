// test-utils.js
export function triggerAuthStateChange(user = null) {
    if (global.__authCallback) {
        global.__authCallback(
            user ? 'SIGNED_IN' : 'SIGNED_OUT',
            user ? { user } : null
        );
    }
}

// Helper to create a test user object
export function createTestUser(email = 'test@example.com') {
    return {
        id: 'test-user-id',
        email,
        user_metadata: {
            full_name: 'Test User'
        }
    };
}

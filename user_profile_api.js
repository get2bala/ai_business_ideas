// Helper to get current authenticated user id (Supabase v2)
function getCurrentUserId() {
    if (db && db.auth && db.auth.getUser) {
        // Supabase v2 async getUser
        // This function should be awaited in async context
        return db.auth.getUser().then(res => res.data?.user?.id || null);
    } else if (db && db.auth && db.auth.user) {
        // Supabase v1 sync user
        return db.auth.user()?.id || null;
    }
    return null;
}

// user_profile_api.js
// Utility to handle profile CRUD operations for users
import { db } from './db.js';

// Fetch profile for a given user
export async function fetchProfile(userId) {
    if (!userId) return null;
    const { data, error } = await db.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

// Add (create) a profile for a user
// If userId is not provided, try to get it from auth context
export async function addProfile(userId, display_name, bio) {
    let uid = userId;
    if (!uid) {
        uid = await getCurrentUserId();
    }
    if (!uid || !display_name) return null;
    const { data, error } = await db.from('profiles').insert([
        { id: uid, display_name, bio }
    ]).select();
    if (error) {
        console.error('Error adding profile:', error);
        return null;
    }
    return data[0];
}

// Update a profile for a user
export async function updateProfile(userId, updates) {
    if (!userId || !updates) return null;
    const { data, error } = await db.from('profiles').update(updates).eq('id', userId).select();
    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }
    return data[0];
}

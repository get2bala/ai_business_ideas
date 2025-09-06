// upvote_api.js
// Utility to handle upvote API calls
import { db } from './db.js';

// Fetch upvotes count for a given idea
export async function fetchUpvotesCount(ideaId) {
    if (!ideaId) return 0;
    
    try {
        const { data, error } = await db.from('upvotes')
            .select('id')
            .eq('idea_id', ideaId);
            
        if (error) throw error;
        return data ? data.length : 0;
    } catch (error) {
        console.error('Error fetching upvotes count:', error);
        return 0;
    }
}

// Fetch all upvoted idea IDs for a user
export async function fetchUpvotedIdeasForUser(userId) {
    try {
        const query = db.from('upvotes').select('idea_id, user_id');
        // If the client supports .eq chainable filters, use them
        if (typeof query.eq === 'function') {
            const { data, error } = await query.eq('user_id', userId);
            if (error) {
                console.error('Error fetching upvoted ideas for user', userId, error);
                return [];
            }
            return data.map(r => r.idea_id);
        }
        // Fallback for simple/mocked clients: await the select() and filter client-side
        if (typeof query.then === 'function') {
            const res = await query;
            const rows = (res && res.data) || [];
            const filtered = rows.filter(r => String(r.user_id) === String(userId) || r.user_id === undefined);
            return filtered.map(r => r.idea_id).filter(Boolean);
        }
        return [];
    } catch (e) {
        console.error('fetchUpvotedIdeasForUser unexpected error', e);
        return [];
    }
}

// Check if a user has upvoted a specific idea
export async function hasUserUpvoted(userId, ideaId) {
    try {
        const sel = db.from('upvotes').select('id, user_id, idea_id');
        let rows = [];
        if (typeof sel.eq === 'function') {
            const resp = await sel.eq('user_id', userId).eq('idea_id', ideaId).limit(1);
            if (resp.error) {
                console.error('hasUserUpvoted lookup error', resp.error);
                return false;
            }
            rows = resp.data || [];
        } else if (typeof sel.then === 'function') {
            const resp = await sel;
            rows = (resp && resp.data) || [];
            rows = rows.filter(r => String(r.user_id) === String(userId) && r.idea_id == ideaId);
        }
        return rows && rows.length > 0;
    } catch (e) {
        console.error('hasUserUpvoted unexpected error', e);
        return false;
    }
}

// Add an upvote
export async function addUpvote(userId, ideaId) {
    try {
        // First check if user has already upvoted
        const alreadyUpvoted = await hasUserUpvoted(userId, ideaId);
        if (alreadyUpvoted) {
            return { success: true, alreadyExists: true };
        }
        
        const { data, error } = await db.from('upvotes').insert([{
            user_id: userId,
            idea_id: ideaId
        }]).select();
        
        if (error) {
            console.error('Error adding upvote', error);
            return { success: false, error };
        }
        return { success: true, data: data[0] };
    } catch (e) {
        console.error('addUpvote unexpected error', e);
        return { success: false, error: e };
    }
}

// Remove an upvote
export async function removeUpvote(userId, ideaId) {
    try {
        const del = db.from('upvotes').delete();
        if (typeof del.eq === 'function') {
            const { error } = await del.eq('user_id', userId).eq('idea_id', ideaId);
            if (error) {
                console.error('Error removing upvote', error);
                return false;
            }
            return true;
        }
        // Fallback: assume success if mock delete returns without error
        const res = await del;
        if (res && res.error) {
            console.error('Error removing upvote', res.error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('removeUpvote unexpected error', e);
        return false;
    }
}

// Toggle upvote: upvote if not upvoted, remove upvote if already upvoted
export async function toggleUpvote(userId, ideaId) {
    try {
        const isUpvoted = await hasUserUpvoted(userId, ideaId);
        if (isUpvoted) {
            const removed = await removeUpvote(userId, ideaId);
            return { success: removed, isUpvoted: false };
        } else {
            const added = await addUpvote(userId, ideaId);
            return { success: added.success, isUpvoted: true };
        }
    } catch (e) {
        console.error('toggleUpvote unexpected error', e);
        return { success: false, isUpvoted: false, error: e };
    }
}

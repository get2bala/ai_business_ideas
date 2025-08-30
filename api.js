// api.js
import { db } from './app.js'; // We'll export 'db' from app.js

export async function fetchIdeas() {
    const { data, error } = await db
        .from('ideas')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching ideas:', error);
        return []; // Return empty array on error
    }
    return data;
}

export async function addIdea(ideaData, userId) {
    const { data, error } = await db.from('ideas').insert([{
        title: ideaData.title,
        summary: ideaData.summary,
        details: ideaData.details,
        tags: ideaData.tags,
        icon: ideaData.icon,
        user_id: userId
    }]).select(); // .select() returns the new record

    if (error) {
        console.error("Error adding idea:", error.message);
        return null;
    }
    return data[0];
}

export async function deleteIdea(ideaId) {
    const { error } = await db.from('ideas').delete().eq('id', ideaId);
    if (error) {
        console.error("Error deleting idea:", error.message);
        return false;
    }
    return true;
}

// Favorites API (persisted in Supabase)
// Table: favorites
// Columns: id (auto), user_id (text), idea_id (integer), created_at (timestamp)
export async function fetchFavoritesForUser(userId) {
    try {
        const query = db.from('favorites').select('idea_id, user_id');
        // If the client supports .eq chainable filters, use them
        if (typeof query.eq === 'function') {
            const { data, error } = await query.eq('user_id', String(userId));
            if (error) {
                console.error('Error fetching favorites for user', userId, error);
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
        console.error('fetchFavoritesForUser unexpected error', e);
        return [];
    }
}

export async function addFavorite(userId, ideaId) {
    try {
        const { data, error } = await db.from('favorites').insert([{
            user_id: String(userId),
            idea_id: ideaId
        }]).select();
        if (error) {
            console.error('Error adding favorite', error);
            return null;
        }
        return data[0];
    } catch (e) {
        console.error('addFavorite unexpected error', e);
        return null;
    }
}

export async function removeFavorite(userId, ideaId) {
    try {
        const del = db.from('favorites').delete();
        if (typeof del.eq === 'function') {
            const { error } = await del.eq('user_id', String(userId)).eq('idea_id', ideaId);
            if (error) {
                console.error('Error removing favorite', error);
                return false;
            }
            return true;
        }
        // Fallback: assume success if mock delete returns without error
        const res = await del;
        if (res && res.error) {
            console.error('Error removing favorite', res.error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('removeFavorite unexpected error', e);
        return false;
    }
}

// Toggle helper: returns true if favorited after the call, false otherwise
export async function toggleFavorite(userId, ideaId) {
    try {
        // Check if exists. Use chainable API when available; otherwise fetch and check client-side.
        const sel = db.from('favorites').select('id, user_id, idea_id');
        let rows = [];
        if (typeof sel.eq === 'function') {
            const resp = await sel.eq('user_id', String(userId)).eq('idea_id', ideaId).limit(1);
            if (resp.error) {
                console.error('toggleFavorite lookup error', resp.error);
                return false;
            }
            rows = resp.data || [];
        } else if (typeof sel.then === 'function') {
            const resp = await sel;
            rows = (resp && resp.data) || [];
            rows = rows.filter(r => String(r.user_id) === String(userId) || r.idea_id == ideaId);
        }
        if (rows && rows.length > 0) {
            const removed = await removeFavorite(userId, ideaId);
            return removed ? false : true;
        } else {
            const added = await addFavorite(userId, ideaId);
            return added ? true : false;
        }
    } catch (e) {
        console.error('toggleFavorite unexpected error', e);
        return false;
    }
}
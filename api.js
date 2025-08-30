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
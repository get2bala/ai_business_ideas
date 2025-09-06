// comments_api.js
// Utility to handle comment CRUD operations for ideas
import { db } from './db.js';

// Fetch comment count for a given idea
export async function fetchCommentCount(ideaId) {
    if (!ideaId) return 0;
    
    try {
        const { data, error } = await db.from('comments')
            .select('id')
            .eq('idea_id', ideaId);
            
        if (error) throw error;
        return data ? data.length : 0;
    } catch (error) {
        console.error('Error fetching comment count:', error);
        return 0;
    }
}

// Fetch comments for a given idea
export async function fetchComments(ideaId) {
    if (!ideaId) return [];
    
    try {
        // First, fetch the comments
        const { data: comments, error: commentsError } = await db.from('comments')
            .select('*')
            .eq('idea_id', ideaId)
            .order('created_at', { ascending: true });
            
        if (commentsError) throw commentsError;
        if (!comments || comments.length === 0) return [];
        
        // Then, for each comment, fetch the profile display name
        const commentsWithProfiles = await Promise.all(comments.map(async (comment) => {
            const { data: profile, error: profileError } = await db.from('profiles')
                .select('display_name')
                .eq('id', comment.user_id)
                .single();
                
            return {
                ...comment,
                profiles: profileError ? null : (profile || { display_name: 'Anonymous User' })
            };
        }));
        
        return commentsWithProfiles;
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error; // Propagate the error to see it in the UI
    }
}

// Add a comment to an idea
export async function addComment(ideaId, userId, text) {
    if (!ideaId || !userId || !text) return null;
    const { data, error } = await db.from('comments').insert([
        { idea_id: ideaId, user_id: userId, text }
    ]).select();
    if (error) {
        console.error('Error adding comment:', error);
        return null;
    }
    return data[0];
}

// Delete a comment (only by owner)
export async function deleteComment(commentId, userId) {
    if (!commentId || !userId) return false;
    // Only allow delete if user is owner
    const { error } = await db.from('comments').delete().eq('id', commentId).eq('user_id', userId);
    if (error) {
        console.error('Error deleting comment:', error);
        return false;
    }
    return true;
}

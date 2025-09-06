// comments_ui.js
// UI logic for displaying and managing comments for an idea
import { fetchComments, addComment, deleteComment } from './comments_api.js';

export async function renderCommentsSection(ideaId, user) {
    const container = document.getElementById('comments-section');
    if (!container) return;
    container.innerHTML = '<div>Loading comments…</div>';
    
    try {
        const comments = await fetchComments(ideaId);
        console.log('Fetched comments:', comments); // Debug log
        
        container.innerHTML = '';
        if (!comments || comments.length === 0) {
            container.innerHTML = '<div class="text-slate-500">No comments yet.</div>';
        } else {
            comments.forEach(comment => {
                const div = document.createElement('div');
                div.className = 'comment mb-2 p-2 border-b';
                
                // Handle different possible structures from Supabase join
                let authorName = 'Anonymous User';
                if (comment.profiles && comment.profiles.display_name) {
                    authorName = comment.profiles.display_name;
                } else if (Array.isArray(comment.profiles) && comment.profiles[0]?.display_name) {
                    authorName = comment.profiles[0].display_name;
                }
                
                div.innerHTML = `
                    <div class="text-sm text-slate-800">${comment.text}</div>
                    <div class="text-xs text-slate-400">by ${authorName} on ${new Date(comment.created_at).toLocaleString()}</div>
                    ${user && user.id === comment.user_id ? `<button class="delete-comment-btn text-xs text-red-500" data-id="${comment.id}">Delete</button>` : ''}
                `;
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Error rendering comments:', error);
        container.innerHTML = '<div class="text-red-500">Error loading comments</div>';
    }
    // Attach delete handlers
    if (user) {
        container.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const commentId = btn.getAttribute('data-id');
                if (confirm('Delete this comment?')) {
                    await deleteComment(commentId, user.id);
                    renderCommentsSection(ideaId, user);
                }
            });
        });
    }
}

export function setupCommentForm(ideaId, user) {
    const form = document.getElementById('comment-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const input = document.getElementById('comment-input');
        const text = input.value.trim();
        if (!text) return;
        await addComment(ideaId, user.id, text);
        input.value = '';
        renderCommentsSection(ideaId, user);
    };
}

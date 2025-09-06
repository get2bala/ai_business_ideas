// ui.js
import * as api from './api.js';
import { fetchAutoIdea } from './auto_idea_api.js';
import { initializeUpvoteButtons, initializeModalUpvoteButton } from './upvote_ui.js';
import { fetchUpvotesCount, hasUserUpvoted, toggleUpvote } from './upvote_api.js';
import { fetchCommentCount } from './comments_api.js';
import { copyShareUrl, shareIdea } from './share_api.js';

// Small UI indicator for automatic idea generation status
function createAutoGenStatusIndicator() {
    try {
        const headerBtn = document.getElementById('mobile-menu-btn');
        if (!headerBtn) return null;
        // Avoid creating twice
        if (document.getElementById('auto-gen-status')) return document.getElementById('auto-gen-status');
        const span = document.createElement('span');
        span.id = 'auto-gen-status';
        span.title = 'Auto-generate status: unknown';
        span.className = 'ml-2 inline-block w-3 h-3 rounded-full bg-gray-300';
        headerBtn.insertAdjacentElement('afterend', span);
        return span;
    } catch (e) {
        return null;
    }
}

function setAutoGenStatus(state, message) {
    // state: 'unknown'|'loading'|'ok'|'error'
    const el = document.getElementById('auto-gen-status') || createAutoGenStatusIndicator();
    if (!el) return;
    el.title = `Auto-generate: ${state}${message ? ' - ' + message : ''}`;
    el.classList.remove('bg-gray-300','bg-yellow-400','bg-green-500','bg-red-500');
    if (state === 'loading') el.classList.add('bg-yellow-400');
    else if (state === 'ok') el.classList.add('bg-green-500');
    else if (state === 'error') el.classList.add('bg-red-500');
    else el.classList.add('bg-gray-300');
}

// Avoid caching DOM nodes at module load (tests replace document.body).
// Initialize markdown-it lazily inside openModal so that if the global
// `markdownit` script isn't available at module evaluation time we still
// have a safe fallback.

export function renderIdeas(ideas, activeTags, user, onIdeaDeleted) {
    const grid = document.getElementById('ideas-grid');
    const filterContainer = document.getElementById('filter-container');
    const modal = document.getElementById('idea-modal');
    const modalBody = document.getElementById('modal-body');
    if (!grid) return; // defensive
    grid.innerHTML = '';
    // Expose current user id on body for delegated handlers
    if (typeof document !== 'undefined' && document.body) {
        document.body.dataset.currentUser = user ? String(user.id) : '';
    }

    // (favorites toggle moved into the mobile hamburger menu in auth.js)
    const filteredIdeas = ideas.filter(idea => {
        if (activeTags.size === 0) return true;
        return [...activeTags].every(tag => idea.tags.includes(tag));
    });

    // If user wants to see only favorites, further filter here
    // Backwards-compatible: some code/tests expect 'mobile-favorites-toggle',
    // the runtime UI uses 'show-favorites-btn'. Accept either.
    const showBtn = document.getElementById('show-favorites-btn') || document.getElementById('mobile-favorites-toggle');
    const showOnlyFavorites = showBtn && showBtn.dataset.active === 'true' && user;
    // Fetch favorites for the current user from backend (async)
    const userFavorites = new Set();
    if (user) {
        // We'll fetch favorites synchronously here via a promise (renderIdeas is sync),
        // but to keep UI responsive we optimistically render and then update when data arrives.
        // Start async fetch and update DOM when ready.
    api.fetchFavoritesForUser(user.id).then(arr => {
            const set = new Set(arr.map(String));
            // Update any existing fav buttons in the grid
            const cards = document.querySelectorAll('#ideas-grid .card');
            cards.forEach(card => {
                const id = card.dataset.ideaId;
                const btn = card.querySelector('.fav-btn');
                if (!btn || !id) return;
        // Do not overwrite a button that is currently being toggled optimistically
        if (btn.dataset && btn.dataset._toggling === '1') return;
        const isFav = set.has(String(id));
                btn.dataset.favorited = isFav.toString();
                btn.setAttribute('aria-pressed', isFav.toString());
                if (isFav) {
                    btn.classList.remove('text-gray-400');
                    btn.classList.add('text-red-500');
                } else {
                    btn.classList.remove('text-red-500');
                    btn.classList.add('text-gray-400');
                }
            });
        }).catch(() => {});
    }

    if (filteredIdeas.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-slate-500">No ideas match the selected tags.</p>`;
        return;
    }

    filteredIdeas.forEach(idea => {
        if (showOnlyFavorites && !userFavorites.has(String(idea.id))) return; // skip non-favorites
    const card = document.createElement('div');
    card.className = 'card bg-white p-6 rounded-lg shadow-sm cursor-pointer flex flex-col';
    // Ensure each card has the idea id available for delegated handlers
    if (idea && idea.id !== undefined && idea.id !== null) card.dataset.ideaId = String(idea.id);
        const isFav = false; // default; real state will be applied when backend fetch completes
        card.innerHTML = createCardHTML(idea, user, isFav);
        grid.appendChild(card);
        
        // Add event listeners
        card.addEventListener('click', () => openModal(idea));
        
        // Make upvote button, comment button, and share button stop propagation
        const actionButtons = card.querySelectorAll('.social-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click (modal opening)
            });
        });
        
        // Favorite button handler (if present)
        const favBtn = card.querySelector('.fav-btn');
        if (favBtn) {
            // mark that this button has a per-card handler attached so delegated listener can skip it
            favBtn.dataset._attached = '1';
            favBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                if (!user) {
                    alert('Please log in to favorite ideas.');
                    return;
                }
                    // Mark this button so delegated handler can skip it (some test envs still dispatch)
                    favBtn.dataset._handled = '1';
                    // Mark as currently toggling so backend-sync won't overwrite optimistic state
                    favBtn.dataset._toggling = '1';
                    // Optimistically toggle UI
                    const currently = favBtn.dataset.favorited === 'true';
                const newState = !currently;
                favBtn.dataset.favorited = newState.toString();
                favBtn.setAttribute('aria-pressed', newState.toString());
                if (newState) {
                    favBtn.classList.remove('text-gray-400');
                    favBtn.classList.add('text-red-500');
                } else {
                    favBtn.classList.remove('text-red-500');
                    favBtn.classList.add('text-gray-400');
                }
                // Persist to backend
                const res = await api.toggleFavorite(user.id, idea.id);
                // If backend indicates final state differs (edge cases), update UI
                if (!res) {
                    // backend returned false -> not favorited; ensure UI reflects that
                    favBtn.dataset.favorited = 'false';
                    favBtn.setAttribute('aria-pressed', 'false');
                    favBtn.classList.remove('text-red-500');
                    favBtn.classList.add('text-gray-400');
                }
                    // cleanup handled/toggling markers
                    delete favBtn.dataset._handled;
                    delete favBtn.dataset._toggling;
            });
        }
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                    const success = await api.deleteIdea(idea.id);
                    if (success) {
                        onIdeaDeleted(); // Callback to refresh data in app.js
                    }
                }
            });
        }
    });
    
    // Initialize social action buttons
    initializeSocialActionButtons(filteredIdeas, user);
}

// Initialize social action buttons on all idea cards
async function initializeSocialActionButtons(ideas, user) {
    // Process each card
    const cards = document.querySelectorAll('.card');
    
    for (const card of cards) {
        const ideaId = card.dataset.ideaId;
        if (!ideaId) continue;
        
        // Find the idea object from the array
        const idea = ideas.find(i => String(i.id) === String(ideaId));
        if (!idea) continue;
        
        // Initialize upvote count
        try {
            const upvoteCount = await fetchUpvotesCount(ideaId);
            const upvoteCountEl = card.querySelector('.upvote-count');
            if (upvoteCountEl) upvoteCountEl.textContent = upvoteCount;
            
            // Set active state if user has upvoted
            if (user) {
                const hasUpvoted = await hasUserUpvoted(user.id, ideaId);
                const upvoteBtn = card.querySelector('.upvote-btn');
                if (upvoteBtn && hasUpvoted) {
                    upvoteBtn.classList.remove('text-slate-500');
                    upvoteBtn.classList.add('text-blue-500');
                    upvoteBtn.setAttribute('data-upvoted', 'true');
                }
            }
        } catch (error) {
            console.error('Error initializing upvote count:', error);
        }
        
        // Initialize comment count
        try {
            const commentCount = await fetchCommentCount(ideaId);
            const commentCountEl = card.querySelector('.comment-count');
            // Only update comment count if user is logged in
            if (commentCountEl && user) {
                commentCountEl.textContent = commentCount;
            }
        } catch (error) {
            console.error('Error initializing comment count:', error);
        }
        
        // Add click events
        
        // Upvote button click
        const upvoteBtn = card.querySelector('.upvote-btn');
        if (upvoteBtn) {
            upvoteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent card click (modal opening)
                
                const userId = document.body && document.body.dataset ? document.body.dataset.currentUser : null;
                if (!userId) {
                    // Show login prompt for non-logged in users
                    alert('Please log in to upvote ideas');
                    return;
                }
                
                const ideaId = upvoteBtn.getAttribute('data-idea-id');
                const isUpvoted = upvoteBtn.getAttribute('data-upvoted') === 'true';
                const countEl = upvoteBtn.querySelector('.upvote-count');
                const currentCount = parseInt(countEl.textContent, 10) || 0;
                
                // Optimistic UI update
                upvoteBtn.setAttribute('data-upvoted', (!isUpvoted).toString());
                if (!isUpvoted) {
                    upvoteBtn.classList.remove('text-slate-500');
                    upvoteBtn.classList.add('text-blue-500');
                    countEl.textContent = currentCount + 1;
                } else {
                    upvoteBtn.classList.remove('text-blue-500');
                    upvoteBtn.classList.add('text-slate-500');
                    countEl.textContent = Math.max(0, currentCount - 1);
                }
                
                // Send to server
                try {
                    const result = await toggleUpvote(userId, ideaId);
                    
                    // If operation failed, revert UI
                    if (!result.success) {
                        upvoteBtn.setAttribute('data-upvoted', isUpvoted.toString());
                        if (isUpvoted) {
                            upvoteBtn.classList.remove('text-slate-500');
                            upvoteBtn.classList.add('text-blue-500');
                        } else {
                            upvoteBtn.classList.remove('text-blue-500');
                            upvoteBtn.classList.add('text-slate-500');
                        }
                        countEl.textContent = currentCount;
                    }
                } catch (error) {
                    console.error('Error toggling upvote:', error);
                    // Revert UI
                    upvoteBtn.setAttribute('data-upvoted', isUpvoted.toString());
                    if (isUpvoted) {
                        upvoteBtn.classList.remove('text-slate-500');
                        upvoteBtn.classList.add('text-blue-500');
                    } else {
                        upvoteBtn.classList.remove('text-blue-500');
                        upvoteBtn.classList.add('text-slate-500');
                    }
                    countEl.textContent = currentCount;
                }
            });
        }
        
        // Comment button click - open modal and scroll to comments
        const commentBtn = card.querySelector('.comment-btn');
        if (commentBtn) {
            commentBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click (modal opening)
                
                // Open the modal
                openModal(idea);
                
                // Scroll to comments section after a short delay to allow modal to open
                setTimeout(() => {
                    const commentsSection = document.getElementById('comments-section');
                    if (commentsSection) {
                        commentsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 300);
            });
        }
        
        // Share button click
        const shareBtn = card.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent card click (modal opening)
                
                const ideaId = shareBtn.getAttribute('data-idea-id');
                
                // Try to use navigator.share if available (mobile devices)
                if (navigator.share) {
                    try {
                        await shareIdea(idea);
                        showToast('Shared successfully!');
                    } catch (error) {
                        console.error('Error sharing idea:', error);
                        fallbackToClipboardShare(ideaId);
                    }
                } else {
                    // Fallback to clipboard copy
                    fallbackToClipboardShare(ideaId);
                }
            });
        }
    }
}

// Fallback to clipboard copying for share
async function fallbackToClipboardShare(ideaId) {
    // Create a popup dialog with the link
    const shareUrl = await copyShareUrl(ideaId);
    
    // Create or get a share dialog
    let shareDialog = document.getElementById('share-dialog');
    if (!shareDialog) {
        shareDialog = document.createElement('div');
        shareDialog.id = 'share-dialog';
        shareDialog.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';
        document.body.appendChild(shareDialog);
    }
    
    // Set the content of the dialog
    shareDialog.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
            <h3 class="text-lg font-semibold mb-2">Share this idea</h3>
            <div class="flex mb-3">
                <input type="text" value="${shareUrl.url}" class="flex-grow p-2 border rounded-l" id="share-url-input" readonly>
                <button class="bg-sky-500 text-white px-4 py-2 rounded-r" id="copy-share-url-btn">Copy</button>
            </div>
            <div class="flex justify-end">
                <button class="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded" id="close-share-dialog-btn">Close</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('close-share-dialog-btn').addEventListener('click', () => {
        shareDialog.remove();
    });
    
    document.getElementById('copy-share-url-btn').addEventListener('click', async () => {
        const input = document.getElementById('share-url-input');
        input.select();
        
        try {
            await navigator.clipboard.writeText(input.value);
            showToast('Link copied to clipboard!');
        } catch (error) {
            // Fallback to document.execCommand
            try {
                document.execCommand('copy');
                showToast('Link copied to clipboard!');
            } catch (err) {
                showToast('Failed to copy link. Please select and copy manually.', 'error');
            }
        }
    });
    
    // Close when clicking outside
    shareDialog.addEventListener('click', (e) => {
        if (e.target === shareDialog) {
            shareDialog.remove();
        }
    });
    
    // Allow closing with escape key
    document.addEventListener('keydown', function closeShareDialogOnEsc(e) {
        if (e.key === 'Escape') {
            shareDialog.remove();
            document.removeEventListener('keydown', closeShareDialogOnEsc);
        }
    });
}

// Show a toast notification
function showToast(message, type = 'success') {
    // Check if there's already a toast container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 right-4 z-50';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `p-3 rounded shadow-md mb-2 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
    toast.textContent = message;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            // Remove container if empty
            if (toastContainer.children.length === 0) {
                document.body.removeChild(toastContainer);
            }
        }, 300);
    }, 3000);
}

function createCardHTML(idea, user, isFav = false) {
    const deleteButton = (user && user.id === idea.user_id) ?
        `<button class="delete-btn bg-red-500 text-white px-2 py-1 rounded-full text-xs absolute top-2 right-2 z-10">Delete</button>` : '';

    const favButton = user ?
        `<button class="fav-btn focus:outline-none ml-2 ${isFav ? 'text-red-500' : 'text-gray-400'}" aria-label="favorite" data-favorited="${isFav}" aria-pressed="${isFav}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.01 4.01 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 17.99 4 20 6.01 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
         </button>` : '';

    return `
        <div class="relative">
            ${deleteButton}
            <div class="flex-shrink-0 mb-4">${idea.icon}</div>
            <h3 class="text-xl font-semibold text-slate-800 mb-2">${idea.title}</h3>
            <p class="text-slate-600 flex-grow">${idea.summary}</p>
            <div class="mt-4 flex items-center justify-between">
                <div class="flex flex-wrap gap-2">
                    ${idea.tags.map(tag => `<span class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${tag}</span>`).join('')}
                </div>
                <div class="flex-shrink-0">
                    ${favButton}
                </div>
            </div>
            
            <!-- Reddit-style social action buttons -->
            <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between">
                <!-- Upvote button -->
                <button class="social-action-btn upvote-btn flex items-center text-slate-500 hover:text-blue-500 transition-colors" data-idea-id="${idea.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 15l7-7 7 7"></path>
                    </svg>
                    <span class="upvote-count text-sm">0</span>
                </button>
                
                <!-- Comments button - always visible but count only shown when logged in -->
                <button class="social-action-btn comment-btn flex items-center text-slate-500 hover:text-green-500 transition-colors" data-idea-id="${idea.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <span class="comment-count text-sm">${user ? '0' : 'Comments'}</span>
                </button>
                
                <!-- Share button -->
                <button class="social-action-btn share-btn flex items-center text-slate-500 hover:text-purple-500 transition-colors" data-idea-id="${idea.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                    <span class="text-sm">Share</span>
                </button>
            </div>
        </div>
    `;
}

// ... (You can move populateFilters, openModal, closeModal, etc. here)
// Modal functions and filter helpers
export function openModal(idea) {
    const modal = document.getElementById('idea-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;

    // Prefer the global markdown-it if present, otherwise fall back to a
    // minimal markdown-to-HTML converter (very small subset) to keep tests
    // and environments without the CDN script working.
    const md = (typeof window !== 'undefined' && window.markdownit) ? window.markdownit() : null;
    // const renderedDetails = md ? md.render(idea.details || '') : simpleMarkdownFallback(idea.details || '');
const renderedDetails = md ? md.render(idea.details || '') : markdownParser(idea.details || '');
    modalBody.innerHTML = `
        <div class="p-4">
            <div class="mb-4">${idea.icon}</div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">${idea.title}</h2>
            <p class="text-slate-600 mb-4">${idea.summary}</p>
            <div class="prose text-slate-700">${renderedDetails}</div>
            <div class="flex flex-wrap gap-2 mt-4">
                ${idea.tags.map(tag => `<span class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${tag}</span>`).join('')}
            </div>
            
            <!-- Social action buttons for modal -->
            <div class="mt-4 pt-3 border-t border-slate-200 flex justify-between">
                <!-- Comments count button -->
                <button class="modal-social-btn comment-modal-btn flex items-center text-slate-500 hover:text-green-500 transition-colors px-3 py-2 rounded-md hover:bg-slate-100" data-idea-id="${idea.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    <span class="modal-comment-count text-sm">0</span>
                    <span class="ml-1 text-sm">Comments</span>
                </button>
                
                <!-- Share button -->
                <button class="modal-social-btn share-modal-btn flex items-center text-slate-500 hover:text-purple-500 transition-colors px-3 py-2 rounded-md hover:bg-slate-100" data-idea-id="${idea.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                    <span class="text-sm">Share</span>
                </button>
            </div>
            
            <hr class="my-4">
            <div id="comments-section" class="mt-4"></div>
            <form id="comment-form" class="mt-2 flex gap-2" style="display:none;">
                <input id="comment-input" type="text" class="flex-1 border rounded p-2" placeholder="Add a comment..." required />
                <button type="submit" class="bg-sky-500 text-white px-4 py-2 rounded">Post</button>
            </form>
        </div>
    `;
    // Show comment form only if user is logged in
    const userId = (typeof document !== 'undefined' && document.body && document.body.dataset.currentUser) ? document.body.dataset.currentUser : null;
    if (userId) {
        const form = document.getElementById('comment-form');
        if (form) form.style.display = '';
    }
    // Dynamically import and render comments section
    import('./comments_ui.js').then(mod => {
        const userId = (typeof document !== 'undefined' && document.body && document.body.dataset.currentUser) ? document.body.dataset.currentUser : null;
        const user = userId ? { id: userId } : null;
        mod.renderCommentsSection(idea.id, user);
        if (user) mod.setupCommentForm(idea.id, user);
    });
    
    // Initialize modal social action buttons
    initializeModalSocialButtons(idea);
    
    modal.classList.add('active');
}

// Initialize social action buttons in the modal
async function initializeModalSocialButtons(idea) {
    try {
        // Initialize comment count
        const commentCount = await fetchCommentCount(idea.id);
        const commentCountEl = document.querySelector('.modal-comment-count');
        if (commentCountEl) commentCountEl.textContent = commentCount;
        
        // Get user info
        const userId = document.body && document.body.dataset ? document.body.dataset.currentUser : null;
        
        // Comment button click - scroll to comments
        const commentBtn = document.querySelector('.comment-modal-btn');
        if (commentBtn) {
            commentBtn.addEventListener('click', () => {
                const commentsSection = document.getElementById('comments-section');
                if (commentsSection) {
                    commentsSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        // Share button click
        const shareBtn = document.querySelector('.share-modal-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                // Try to use navigator.share if available
                if (navigator.share) {
                    try {
                        await shareIdea(idea);
                        showToast('Shared successfully!');
                    } catch (error) {
                        console.error('Error sharing idea:', error);
                        fallbackToClipboardShare(idea.id);
                    }
                } else {
                    // Fallback to clipboard copy
                    fallbackToClipboardShare(idea.id);
                }
            });
        }
    } catch (error) {
        console.error('Error initializing modal social buttons:', error);
    }
}

// ui.js

function markdownParser(mdText) {
    // A helper to escape basic HTML to prevent security issues
    const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const lines = escapeHtml(mdText).split('\n');
    
    let html = '';
    let inParagraph = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Process inline styles like bold/italics
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                   .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Handle headings
        if (line.startsWith('## ')) {
            if (inParagraph) { // Close any open paragraph before the heading
                html += '</p>\n';
                inParagraph = false;
            }
            html += `<h2>${line.substring(3)}</h2>\n`;
        } else if (line.trim() === '') {
            // Empty line signifies a paragraph break
            if (inParagraph) {
                html += '</p>\n';
                inParagraph = false;
            }
        } else {
            // Line is part of a paragraph
            if (!inParagraph) {
                html += '<p>';
                inParagraph = true;
            }
            
            // Add the line content. Add a line break if it's not the last line of the paragraph.
            html += line;
            if (inParagraph && (i + 1 < lines.length && lines[i+1].trim() !== '' && !lines[i+1].startsWith('## '))) {
                html += '<br>';
            }
        }
    }

    // After the loop, close the last paragraph if it's still open
    if (inParagraph) {
        html += '</p>\n';
    }

    return html;
}

// Favorites helpers (simple localStorage-backed per-user favorites)
// favorites now persisted via backend API (see api.js)


function closeModal() {
    const modal = document.getElementById('idea-modal');
    if (!modal) return;
    modal.classList.remove('active');
}

// Attach modal event handlers if the DOM nodes exist. Scripts are loaded at end of body in index.html
{
    const modal = document.getElementById('idea-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modal && modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => closeModal());
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }
}

// Delegated handler for favorite buttons to be robust in various DOM setups
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.fav-btn');
    if (!btn) return;
    // If this button has a per-card handler attached, skip delegated handling
    if (btn.dataset && btn.dataset._attached === '1') {
        return;
    }
    // If a per-card handler already handled this click, skip to avoid double-toggle
    if (btn.dataset && btn.dataset._handled === '1') {
        delete btn.dataset._handled;
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    const userId = document.body && document.body.dataset ? document.body.dataset.currentUser : '';
    if (!userId) {
        alert('Please log in to favorite ideas.');
        return;
    }
    // determine idea id by walking up to card
    const card = btn.closest && btn.closest('.card');
    let ideaId = null;
    if (card && card.dataset && card.dataset.ideaId) ideaId = card.dataset.ideaId;
    if (!ideaId) ideaId = btn.dataset.ideaId || Date.now();
    // Optimistic UI toggle
    const currently = btn.dataset.favorited === 'true';
    const newState = !currently;
    btn.dataset.favorited = newState.toString();
    btn.setAttribute('aria-pressed', newState.toString());
    if (newState) {
        btn.classList.remove('text-gray-400');
        btn.classList.add('text-red-500');
    } else {
        btn.classList.remove('text-red-500');
        btn.classList.add('text-gray-400');
    }
    // Persist change
    api.toggleFavorite(userId, ideaId).then(result => {
        if (!result) {
            // Revert UI on failure
            btn.dataset.favorited = 'false';
            btn.setAttribute('aria-pressed', 'false');
            btn.classList.remove('text-red-500');
            btn.classList.add('text-gray-400');
        }
    }).catch(() => {
        btn.dataset.favorited = 'false';
        btn.setAttribute('aria-pressed', 'false');
        btn.classList.remove('text-red-500');
        btn.classList.add('text-gray-400');
    });
});

// --- Automatic Idea Generation: listen for requests and show modal ---
document.addEventListener('generateAutoIdea', async (e) => {
    // e.detail can contain a prompt string
    const prompt = (e && e.detail && e.detail.prompt) ? e.detail.prompt : undefined;
    // Create modal DOM if needed
    let autoModal = document.getElementById('auto-idea-modal');
    if (!autoModal) {
        autoModal = document.createElement('div');
        autoModal.id = 'auto-idea-modal';
        autoModal.className = 'modal-overlay';
        autoModal.innerHTML = `
            <div class="modal-content relative max-w-xl">
                <button id="auto-idea-modal-close" class="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div id="auto-idea-modal-body" class="p-6">
                    <div id="auto-idea-loading" class="text-center text-slate-500">Generating idea...</div>
                </div>
            </div>
        `;
        document.body.appendChild(autoModal);
        const closeBtn = document.getElementById('auto-idea-modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => autoModal.classList.remove('active'));
        autoModal.addEventListener('click', (ev) => { if (ev.target === autoModal) autoModal.classList.remove('active'); });
        document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') autoModal.classList.remove('active'); });
    }

    const body = document.getElementById('auto-idea-modal-body');
    if (!body) return;
    // Helper to generate and render idea given a promptText
    async function generateAndRender(promptText) {
        if (!promptText || !promptText.toString().trim()) {
            body.innerHTML = `<div class="text-center text-red-500">Please enter a description or industry to generate an idea.</div>`;
            return;
        }
        const text = promptText.toString().trim();
        // show loading
        setAutoGenStatus('loading');
        body.innerHTML = `<div id="auto-idea-loading" class="text-center text-slate-500">Generating idea...</div>`;
        autoModal.classList.add('active');

        try {
            const idea = await fetchAutoIdea(text);
            if (!idea) throw new Error('No idea returned');
            
            // If we get here, the request was successful
            // Render idea into modal
            setAutoGenStatus('ok');
            console.log('rendering generated idea', idea);
            body.innerHTML = `
                <div class="mb-4 text-3xl">${idea.icon || ''}</div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">${idea.title || 'Untitled'}</h2>
                <div class="text-xs text-slate-500 mb-2">Source: ${idea.__source || 'unknown'}</div>
                <p class="text-slate-600 mb-4">${idea.summary || ''}</p>
                <div class="prose text-slate-700 mb-4">${markdownParser(idea.details || '')}</div>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${(idea.tags || []).map(tag => `<span class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${tag}</span>`).join('')}
                </div>
                <div class="flex gap-2 justify-end">
                    <button id="auto-idea-use-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Use Idea</button>
                    <button id="auto-idea-close-btn" class="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded">Close</button>
                </div>
            `;

            // Attach handlers
            const useBtn = document.getElementById('auto-idea-use-btn');
            const closeBtn = document.getElementById('auto-idea-close-btn');
            if (closeBtn) closeBtn.addEventListener('click', () => autoModal.classList.remove('active'));
            if (useBtn) {
                useBtn.addEventListener('click', () => {
                    // Populate add-idea form fields (if present) and open add-idea modal
                    const addModal = document.getElementById('add-idea-modal');
                    const titleEl = document.getElementById('idea-title');
                    const summaryEl = document.getElementById('idea-summary');
                    const detailsEl = document.getElementById('idea-details');
                    const tagsEl = document.getElementById('idea-tags');
                    const iconEl = document.getElementById('idea-icon');
                    // Clean the title and summary from any markdown markers
                    if (titleEl) titleEl.value = (idea.title || '').replace(/\*/g, '');
                    if (summaryEl) summaryEl.value = (idea.summary || '').replace(/\*/g, '');
                    // Preserve markdown in details
                    if (detailsEl) detailsEl.value = idea.details || '';
                    if (tagsEl) tagsEl.value = (idea.tags || []).join(', ');
                    if (iconEl) iconEl.value = idea.icon || '';
                    // Ensure the add-idea modal is visible so user can edit/save
                    if (addModal) addModal.classList.add('active');
                    // Close auto modal
                    autoModal.classList.remove('active');
                });
            }
        } catch (err) {
            setAutoGenStatus('error', err && err.message ? err.message : 'failed');
            
            if (err.message === 'Authentication required') {
                body.innerHTML = `
                    <div class="text-center">
                        <div class="text-red-500 mb-4">Please log in to generate ideas.</div>
                        <button id="auto-idea-login-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Log In</button>
                    </div>`;
                const loginBtn = document.getElementById('auto-idea-login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', () => {
                        const loginModal = document.getElementById('login-modal');
                        if (loginModal) loginModal.classList.add('active');
                        autoModal.classList.remove('active');
                    });
                }
            } else {
                body.innerHTML = `<div class="text-center text-red-500">Failed to generate idea. Please try again.</div>`;
            }
            console.error('generateAutoIdea error', err);
        }
    }

    // If a prompt was provided via the event, auto-generate. Otherwise show options to the user.
    if (!prompt) {
        body.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-slate-800 mb-4 text-center">Create New Idea</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- AI Generation Option -->
                    <div class="p-6 border rounded-lg hover:border-blue-500 cursor-pointer transition-all" id="ai-generation-option">
                        <h3 class="text-lg font-semibold text-slate-800 mb-2">AI Generated</h3>
                        <p class="text-slate-600 mb-4">Let AI help you generate a comprehensive business idea based on your input.</p>
                        <input id="auto-idea-prompt" type="text" placeholder="Specify a problem or industry?" class="w-full p-2 border rounded mb-4" />
                        <button id="auto-idea-generate-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Generate with AI</button>
                    </div>
                    
                    <!-- Manual Entry Option -->
                    <div class="p-6 border rounded-lg hover:border-blue-500 cursor-pointer transition-all" id="manual-entry-option">
                        <h3 class="text-lg font-semibold text-slate-800 mb-2">Manual Entry</h3>
                        <p class="text-slate-600 mb-4">Create your own business idea with our structured template.</p>
                        <button id="manual-entry-btn" class="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded">Create Manually</button>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <button id="auto-idea-cancel-btn" class="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded">Close</button>
                </div>
            </div>
        `;
        autoModal.classList.add('active');
        const genBtn = document.getElementById('auto-idea-generate-btn');
        const manualBtn = document.getElementById('manual-entry-btn');
        const cancelBtn = document.getElementById('auto-idea-cancel-btn');
        const inputEl = document.getElementById('auto-idea-prompt');
        
        if (cancelBtn) cancelBtn.addEventListener('click', () => autoModal.classList.remove('active'));
        
        // AI Generation option
        if (genBtn && inputEl) {
            genBtn.addEventListener('click', () => generateAndRender(inputEl.value));
            // Also support Enter key in input
            inputEl.addEventListener('keydown', (ev) => { 
                if (ev.key === 'Enter') { 
                    ev.preventDefault(); 
                    generateAndRender(inputEl.value); 
                } 
            });
        }
        
        // Manual Entry option
        if (manualBtn) {
            manualBtn.addEventListener('click', () => {
                const addModal = document.getElementById('add-idea-modal');
                if (addModal) {
                    addModal.classList.add('active');
                    autoModal.classList.remove('active');
                }
            });
        }
    } else {
        // auto-run
        generateAndRender(prompt);
    }
});
// ui.js
import * as api from './api.js';

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

    // Ensure filter container exists
    if (filterContainer) {
        // If user is logged in, show the "Show my favorites" toggle
        let showBtn = document.getElementById('show-favorites-btn');
        if (user && !showBtn) {
            showBtn = document.createElement('button');
            showBtn.id = 'show-favorites-btn';
            showBtn.className = 'px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm';
            showBtn.textContent = 'Show my favorites';
            showBtn.dataset.active = 'false';
            showBtn.addEventListener('click', () => {
                const active = showBtn.dataset.active === 'true';
                showBtn.dataset.active = (!active).toString();
                showBtn.classList.toggle('bg-slate-800');
                showBtn.classList.toggle('text-white');
                // Inform app to re-render (app.js listens for this)
                document.dispatchEvent(new CustomEvent('favoritesChange'));
            });
            filterContainer.prepend(showBtn);
        }
        // If no user, remove the button (logout case)
        if (!user) {
            const existing = document.getElementById('show-favorites-btn');
            if (existing) existing.remove();
        }
    }
    const filteredIdeas = ideas.filter(idea => {
        if (activeTags.size === 0) return true;
        return [...activeTags].every(tag => idea.tags.includes(tag));
    });

    // If user wants to see only favorites, further filter here
    const showBtn = document.getElementById('show-favorites-btn');
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
        </div>
    `;
}

// ... (You can move populateFilters, openModal, closeModal, etc. here)
// Modal functions and filter helpers
function openModal(idea) {
    const modal = document.getElementById('idea-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;

    // Prefer the global markdown-it if present, otherwise fall back to a
    // minimal markdown-to-HTML converter (very small subset) to keep tests
    // and environments without the CDN script working.
    const md = (typeof window !== 'undefined' && window.markdownit) ? window.markdownit() : null;
    const renderedDetails = md ? md.render(idea.details || '') : simpleMarkdownFallback(idea.details || '');

    modalBody.innerHTML = `
        <div class="p-4">
            <div class="mb-4">${idea.icon}</div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">${idea.title}</h2>
            <p class="text-slate-600 mb-4">${idea.summary}</p>
            <div class="prose text-slate-700">${renderedDetails}</div>
            <div class="flex flex-wrap gap-2 mt-4">
                ${idea.tags.map(tag => `<span class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${tag}</span>`).join('')}
            </div>
        </div>
    `;

    modal.classList.add('active');

}

function simpleMarkdownFallback(mdText) {
    // Very small and safe fallback: escape HTML and convert double newlines to paragraphs
    const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escaped = escapeHtml(mdText);
    // Convert headings (# ...), bold (**text**), italics (*text*), and paragraphs
    let out = escaped
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/\n{2,}/gim, '</p><p>');
    out = `<p>${out}</p>`;
    return out;
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
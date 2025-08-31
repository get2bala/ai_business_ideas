// ui.js
import * as api from './api.js';
import { fetchAutoIdea } from './auto_idea_api.js';

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
            // Render idea into modal
            setAutoGenStatus('ok');
            console.log('rendering generated idea', idea);
            body.innerHTML = `
                <div class="mb-4 text-3xl">${idea.icon || ''}</div>
                <h2 class="text-2xl font-bold text-slate-800 mb-2">${idea.title || 'Untitled'}</h2>
                <div class="text-xs text-slate-500 mb-2">Source: ${idea.__source || 'unknown'}</div>
                <p class="text-slate-600 mb-4">${idea.summary || ''}</p>
                <div class="prose text-slate-700 mb-4">${simpleMarkdownFallback(idea.details || '')}</div>
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
                    if (titleEl) titleEl.value = idea.title || '';
                    if (summaryEl) summaryEl.value = idea.summary || '';
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
            body.innerHTML = `<div class="text-center text-red-500">Failed to generate idea. Please try again.</div>`;
            console.error('generateAutoIdea error', err);
        }
    }

    // If a prompt was provided via the event, auto-generate. Otherwise show an input for the user.
    if (!prompt) {
        body.innerHTML = `
            <div class="space-y-4">
                <input id="auto-idea-prompt" type="text" placeholder="Specify a problem or industry?" class="w-full p-2 border rounded" />
                <div class="flex gap-2 justify-end">
                    <button id="auto-idea-generate-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Generate</button>
                    <button id="auto-idea-cancel-btn" class="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded">Close</button>
                </div>
            </div>
        `;
        autoModal.classList.add('active');
        const genBtn = document.getElementById('auto-idea-generate-btn');
        const cancelBtn = document.getElementById('auto-idea-cancel-btn');
        const inputEl = document.getElementById('auto-idea-prompt');
        if (cancelBtn) cancelBtn.addEventListener('click', () => autoModal.classList.remove('active'));
        if (genBtn && inputEl) genBtn.addEventListener('click', () => generateAndRender(inputEl.value));
        // Also support Enter key in input
        if (inputEl) inputEl.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); generateAndRender(inputEl.value); } });
    } else {
        // auto-run
        generateAndRender(prompt);
    }
});
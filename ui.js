// ui.js
import { deleteIdea } from './api.js';

const grid = document.getElementById('ideas-grid');
const filterContainer = document.getElementById('filter-container');
const modal = document.getElementById('idea-modal');
const modalBody = document.getElementById('modal-body');
const md = window.markdownit();

export function renderIdeas(ideas, activeTags, user, onIdeaDeleted) {
    grid.innerHTML = '';
    const filteredIdeas = ideas.filter(idea => {
        if (activeTags.size === 0) return true;
        return [...activeTags].every(tag => idea.tags.includes(tag));
    });

    if (filteredIdeas.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-slate-500">No ideas match the selected tags.</p>`;
        return;
    }

    filteredIdeas.forEach(idea => {
        const card = document.createElement('div');
        card.className = 'card bg-white p-6 rounded-lg shadow-sm cursor-pointer flex flex-col';
        card.innerHTML = createCardHTML(idea, user);
        grid.appendChild(card);
        
        // Add event listeners
        card.addEventListener('click', () => openModal(idea));
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm("Are you sure?")) {
                    const success = await deleteIdea(idea.id);
                    if (success) {
                        onIdeaDeleted(); // Callback to refresh data in app.js
                    }
                }
            });
        }
    });
}

function createCardHTML(idea, user) {
    const deleteButton = (user && user.id === idea.user_id) ?
        `<button class="delete-btn bg-red-500 text-white px-2 py-1 rounded-full text-xs absolute top-2 right-2 z-10">Delete</button>` : '';

    return `
        <div class="relative">
            ${deleteButton}
            <div class="flex-shrink-0 mb-4">${idea.icon}</div>
            <h3 class="text-xl font-semibold text-slate-800 mb-2">${idea.title}</h3>
            <p class="text-slate-600 flex-grow">${idea.summary}</p>
            <div class="flex flex-wrap gap-2 mt-4">
                ${idea.tags.map(tag => `<span class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

// ... (You can move populateFilters, openModal, closeModal, etc. here)
// For brevity, I'm showing the key refactored part.
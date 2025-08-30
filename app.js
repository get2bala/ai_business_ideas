// app.js

// --- MODULE IMPORTS ---
import { fetchIdeas, addIdea } from './api.js';
import { initAuth, getCurrentUser } from './auth.js';
import { renderIdeas } from './ui.js'; // You would import other UI functions here too

// --- SUPABASE SETUP ---
const { createClient } = supabase;
// Export 'db' so other modules can import it
export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- GLOBAL STATE ---
let ideasDatabase = [];
let activeTags = new Set();
let currentUser = null;

// --- DOM ELEMENTS ---

const addIdeaForm = document.getElementById('add-idea-form');
const addIdeaBtn = document.getElementById('add-idea-btn');
const addIdeaModal = document.getElementById('add-idea-modal');
const addIdeaModalClose = document.getElementById('add-idea-modal-close');
const loadingIndicator = document.getElementById('loading-indicator');

// --- MAIN LOGIC ---
async function main() {
    loadingIndicator.style.display = 'block';
    ideasDatabase = await fetchIdeas();
    loadingIndicator.style.display = 'none';
    
    // Call UI functions to render initial state
    // populateFilters(ideasDatabase);
    renderApp();
}

// Renders the ideas based on current state
function renderApp() {
    renderIdeas(ideasDatabase, activeTags, currentUser, async () => {
        // This is the callback for when an idea is deleted
        ideasDatabase = await fetchIdeas(); // Re-fetch data
        renderApp(); // Re-render the UI
    });
}

// --- EVENT LISTENERS ---

// Add Idea Modal logic
if (addIdeaBtn && addIdeaModal && addIdeaModalClose && addIdeaForm) {
    addIdeaBtn.addEventListener('click', () => {
        if (!currentUser) return;
        addIdeaModal.classList.add('active');
    });
    addIdeaModalClose.addEventListener('click', () => {
        addIdeaModal.classList.remove('active');
    });
    addIdeaModal.addEventListener('click', (e) => {
        if (e.target === addIdeaModal) addIdeaModal.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') addIdeaModal.classList.remove('active');
    });
    addIdeaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const ideaData = {
            title: e.target.elements['idea-title'].value,
            summary: e.target.elements['idea-summary'].value,
            details: e.target.elements['idea-details'].value,
            tags: e.target.elements['idea-tags'].value.split(',').map(tag => tag.trim()),
            icon: e.target.elements['idea-icon'].value,
        };
        const newIdea = await addIdea(ideaData, currentUser.id);
        if (newIdea) {
            ideasDatabase.push(newIdea);
            renderApp();
            addIdeaForm.reset();
            addIdeaModal.classList.remove('active');
        }
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initAuth((user) => {
        // This function is called whenever auth state changes
        currentUser = user;
        renderApp(); // Re-render the UI with the correct user state
    });
    main();
});
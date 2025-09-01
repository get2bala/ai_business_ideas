// app.js

// --- MODULE IMPORTS ---
import { fetchIdeas, addIdea } from './api.js';
import { initAuth, getCurrentUser } from './auth.js';
import { renderIdeas } from './ui.js'; // You would import other UI functions here too

import { db } from './db.js';

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

// Lightweight toast / notification helper to show success/error and payload details
function showToast(message, type = 'info', payload) {
    if (typeof document === 'undefined') return;
    const container = document.createElement('div');
    container.className = `toast toast-${type}`;
    container.style.position = 'fixed';
    container.style.right = '20px';
    container.style.top = '20px';
    container.style.zIndex = 9999;
    container.style.background = '#fff';
    container.style.padding = '12px 16px';
    container.style.border = '1px solid rgba(0,0,0,0.12)';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    container.style.maxWidth = '360px';
    container.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';

    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    title.textContent = message;
    container.appendChild(title);

    if (payload !== undefined) {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontSize = '12px';
        pre.style.margin = '0';
        pre.style.maxHeight = '220px';
        pre.style.overflow = 'auto';
        try {
            pre.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
        } catch (e) {
            pre.textContent = String(payload);
        }
        container.appendChild(pre);
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.position = 'absolute';
    closeBtn.style.right = '8px';
    closeBtn.style.top = '6px';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => container.remove());
    container.appendChild(closeBtn);

    document.body.appendChild(container);
    // Auto-dismiss after 6s
    setTimeout(() => { if (container.parentNode) container.remove(); }, 6000);
}

// Re-render when favorites filter is toggled
document.addEventListener('favoritesChange', () => {
    renderApp();
});

function showApp() {
    const homeContent = document.getElementById('home-content');
    const appContent = document.getElementById('app-content');
    if (homeContent) homeContent.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
}

// --- EVENT LISTENERS ---

// Add Idea Modal logic
// Attach modal and submit handlers when modal + form exist. `addIdeaBtn` is optional.
if (addIdeaModal && addIdeaModalClose && addIdeaForm) {
    if (addIdeaBtn) {
        addIdeaBtn.addEventListener('click', () => {
            if (!currentUser) return;
            addIdeaModal.classList.add('active');
        });
    }
    addIdeaModalClose.addEventListener('click', () => {
        addIdeaModal.classList.remove('active');
    });
    addIdeaModal.addEventListener('click', (e) => {
        if (e.target === addIdeaModal) addIdeaModal.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') addIdeaModal.classList.remove('active');
    });
    async function handleAddIdeaSubmit(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();

        if (!currentUser) {
            showToast('Please log in to add an idea', 'error');
            return;
        }

        // Resolve the form element robustly: prefer the known addIdeaForm, fall back
        // to the event's form (click on button) or event.target if it's the form.
        const formEl = addIdeaForm || (e && e.target && e.target.form) || (e && e.target && e.target.tagName === 'FORM' && e.target);
        if (!formEl || !formEl.elements) {
            showToast('Internal error: form not found', 'error');
            console.error('handleAddIdeaSubmit: form element not found', { addIdeaForm, eventTarget: e && e.target });
            return;
        }

        const formElements = formEl.elements;
        if (!formElements['idea-title'] || !formElements['idea-summary']) {
            showToast('Title and summary fields are missing from the form', 'error');
            return;
        }
        if (!formElements['idea-title'].value || !formElements['idea-summary'].value) {
            showToast('Title and summary are required', 'error');
            return;
        }

        const ideaData = {
            title: formElements['idea-title'].value,
            summary: formElements['idea-summary'].value,
            details: formElements['idea-details'] ? formElements['idea-details'].value : '',
            tags: formElements['idea-tags'] && formElements['idea-tags'].value ? formElements['idea-tags'].value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            icon: formElements['idea-icon'] && formElements['idea-icon'].value ? formElements['idea-icon'].value : null,
        };
        try {
            console.log('Submitting new idea:', ideaData, 'currentUserId:', currentUser && currentUser.id);
            const newIdea = await addIdea(ideaData, currentUser.id);
            if (newIdea) {
                // UI: show only success message; payload is logged to console
                showToast('Idea added successfully', 'success');
                console.log('Successfully added idea payload:', newIdea);
                ideasDatabase = await fetchIdeas(); // Refresh the entire database
                renderApp();
                addIdeaForm.reset();
                // close modal after a short delay so user sees the toast
                setTimeout(() => addIdeaModal.classList.remove('active'), 500);
            } else {
                showToast('Failed to add idea', 'error');
                console.log('Failed to add idea. Payload:', ideaData);
            }
        } catch (error) {
            console.error('Error adding idea:', error, 'payload:', ideaData);
            showToast('An error occurred while adding the idea', 'error');
        }
    }

    addIdeaForm.addEventListener('submit', handleAddIdeaSubmit);
    const addIdeaSubmitBtn = document.getElementById('add-idea-submit-btn');
    if (addIdeaSubmitBtn) addIdeaSubmitBtn.addEventListener('click', handleAddIdeaSubmit);
}

const forgeLegacyBtn = document.getElementById('forge-legacy-btn');
if (forgeLegacyBtn) {
    forgeLegacyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showApp();
    });
}

const startBuildingBtn = document.getElementById('start-building-btn');
if (startBuildingBtn) {
    startBuildingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showApp();
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initAuth((user) => {
        // This function is called whenever auth state changes
        currentUser = user;
    console.log('Auth state changed. currentUser:', currentUser);
        renderApp(); // Re-render the UI with the correct user state
    });
    main();
});

// --- SUPABASE SETUP ---
// Credentials are now imported from config.js for better security and maintainability.

// Initialize Supabase and Markdown-it clients
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const md = window.markdownit();

// --- GLOBAL STATE ---
let ideasDatabase = []; // This will hold all fetched ideas
let activeTags = new Set(); // This will track which tags are currently selected by the user

// --- Wait for the DOM to be fully loaded before running the script ---
document.addEventListener('DOMContentLoaded', () => {
    // Get references to all necessary DOM elements
    const grid = document.getElementById('ideas-grid');
    const filterContainer = document.getElementById('filter-container');
    const modal = document.getElementById('idea-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- DATA FETCHING ---
    async function fetchIdeas() {
        // Fetch all columns from the 'ideas' table, ordered by their ID.
        const { data, error } = await db
            .from('ideas')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching ideas:', error);
            grid.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load ideas. Check your Supabase URL/Key and console for errors.</p>`;
            return;
        }
        
        ideasDatabase = data; // Store the fetched data globally
        loadingIndicator.style.display = 'none'; // Hide the loading indicator
        
        // Once data is loaded, populate the UI
        populateFilters();
        renderIdeas();
    }

    // --- UI RENDERING ---
    const populateFilters = () => {
         // Create a set of all unique tags from the database
         const allTags = new Set(ideasDatabase.flatMap(idea => idea.tags));
         // Create a sorted array of tags, with 'All' at the beginning
         const sortedTags = ['All', ...Array.from(allTags).sort()];

         // Generate the HTML for the filter buttons
         filterContainer.innerHTML = sortedTags.map(tag => `
            <button class="filter-btn px-4 py-2 rounded-full text-sm font-medium bg-white text-slate-700" data-tag="${tag}">${tag}</button>
        `).join('');

         // Set 'All' as the active filter by default
         filterContainer.querySelector('[data-tag="All"]').classList.add('active');
    };

    const renderIdeas = () => {
        grid.innerHTML = ''; // Clear the grid before rendering new cards
        
        // Filter the database based on the currently active tags
        const filteredIdeas = ideasDatabase.filter(idea => {
            if (activeTags.size === 0) return true; // If no tags are active, show all ideas
            // Otherwise, the idea must include *every* active tag
            return [...activeTags].every(tag => idea.tags.includes(tag));
        });
        
        // If no ideas match the filter, show a message
        if (filteredIdeas.length === 0) {
            grid.innerHTML = `<p class="col-span-full text-center text-slate-500">No ideas match the selected tags.</p>`;
        }

        // Create and append a card for each filtered idea
        filteredIdeas.forEach(idea => {
            const card = document.createElement('div');
            card.className = 'card bg-white p-6 rounded-lg shadow-sm cursor-pointer flex flex-col';
            card.dataset.id = idea.id;
            card.innerHTML = `
                <div class="flex-shrink-0 mb-4">
                    ${idea.icon}
                </div>
                <h3 class="text-xl font-semibold text-slate-800 mb-2">${idea.title}</h3>
                <p class="text-slate-600 flex-grow">${idea.summary}</p>
                <div class="flex flex-wrap gap-2 mt-4">
                    ${idea.tags.map(tag => `<span class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${tag}</span>`).join('')}
                </div>
            `;
            grid.appendChild(card);
            // Add a click listener to the card to open the modal
            card.addEventListener('click', () => openModal(idea.id));
        });
    };

    // --- EVENT HANDLING ---
    filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return; // Ignore clicks that aren't on a button

        const tag = btn.dataset.tag;

        if (tag === 'All') {
            // If 'All' is clicked, clear active tags and set only 'All' button to active
            activeTags.clear();
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        } else {
            // If any other tag is clicked, deactivate the 'All' button
            document.querySelector('[data-tag="All"]').classList.remove('active');
            
            // Toggle the clicked tag in the active set
            if (activeTags.has(tag)) {
                activeTags.delete(tag);
                btn.classList.remove('active');
            } else {
                activeTags.add(tag);
                btn.classList.add('active');
            }
            
            // If no tags are selected after toggling, re-activate the 'All' button
            if (activeTags.size === 0) {
                document.querySelector('[data-tag="All"]').classList.add('active');
            }
        }
        // Re-render the ideas grid with the new filters
        renderIdeas();
    });

    const openModal = (id) => {
        const idea = ideasDatabase.find(i => i.id === id);
        if (!idea) return;

        // Use markdown-it to convert the 'details' markdown into HTML
        const renderedDetails = md.render(idea.details);

        // Populate the modal with the idea's data and the rendered HTML
        modalBody.innerHTML = `
            <div class="flex items-start gap-4 mb-4">
                 ${idea.icon}
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">${idea.title}</h2>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${idea.tags.map(tag => `<span class="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-markdown">
                ${renderedDetails}
            </div>
        `;
        modal.classList.add('active'); // Show the modal
    };

    const closeModal = () => {
        modal.classList.remove('active'); // Hide the modal
    };

    // Add event listeners to close the modal
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Close if the click is on the overlay itself, not the content
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        // Close if the 'Escape' key is pressed
        if (e.key === 'Escape') closeModal();
    });
    
    // --- INITIALIZATION ---
    // Start the application by fetching the data from Supabase
    fetchIdeas();
});

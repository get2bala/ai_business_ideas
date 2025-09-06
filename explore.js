// explore.js - Handles the Reddit-style explore page functionality

// --- MODULE IMPORTS ---
import { fetchIdeas, addIdea } from './api.js';
import { initAuth, getCurrentUser, handleLogout } from './auth.js';
import { showIdeaDetails } from './showIdeaDetails.js';
import './eventHandlers.js';
import { createIdeaCardElement } from './reddit-style-card.js';

// --- GLOBAL STATE ---
let ideasDatabase = [];
let activeTags = new Set();
let currentUser = null;
let searchQuery = '';
let isDetailView = false;
let currentIdeaId = null;

// Tag categories for better organization
const tagCategories = {
    industries: [
        'SaaS', 'FinTech', 'EdTech', 'HealthTech', 'E-commerce', 
        'Travel', 'Food', 'Real Estate', 'Manufacturing', 'Energy'
    ],
    technologies: [
        'AI', 'Machine Learning', 'Blockchain', 'IoT', 'AR/VR',
        'Mobile', 'Cloud', 'Big Data', 'API', '3D Printing'
    ],
    businessModels: [
        'Subscription', 'Marketplace', 'Freemium', 'On-demand', 'B2B',
        'B2C', 'SaaS', 'Ad-supported', 'Franchise', 'Direct-to-consumer'
    ],
    popular: [
        'AI', 'SaaS', 'B2B', 'Subscription', 'Healthcare', 
        'Mobile', 'Sustainability', 'Fintech', 'E-commerce', 'Marketplace'
    ]
};

// --- DOM ELEMENTS ---
// Main containers
const ideasContainer = document.getElementById('ideas-container');
const loadingIndicator = document.getElementById('loading-indicator');
const sidebar = document.getElementById('sidebar');

// Search elements - now in sidebar
const searchInput = document.getElementById('sidebar-idea-search');
const activeFiltersContainer = document.getElementById('active-filters-container');

// Navigation elements
const hamburgerMenu = document.getElementById('hamburger-menu');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const profileMenuToggle = document.getElementById('profile-menu-toggle');
const profileMenu = document.getElementById('profile-menu');
const logoutBtn = document.getElementById('logout-btn');
const generateIdeaLink = document.getElementById('generate-idea-link');

// View containers
const ideasListView = document.getElementById('ideas-list-view');
const ideaDetailView = document.getElementById('idea-detail-view');
const backToListBtn = document.getElementById('back-to-list-btn');
const backButton = document.getElementById('back-button');
const ideaDetailContent = document.getElementById('idea-detail-content');

// Modal elements
const addIdeaModal = document.getElementById('add-idea-modal');
const addIdeaModalClose = document.getElementById('add-idea-modal-close');
const addIdeaForm = document.getElementById('add-idea-form');
const addIdeaSubmitBtn = document.getElementById('add-idea-submit-btn');
const profileMenuModal = document.getElementById('profile-menu-modal');
const userProfileSection = document.getElementById('user-profile-section');

// --- MAIN LOGIC ---

// Initialize the page
async function initExplore() {
    loadingIndicator.style.display = 'block';
    
    // Fetch all ideas
    ideasDatabase = await fetchIdeas();
    
    // Initialize tag filters in the sidebar
    initializeTagFilters();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Render the ideas
    renderIdeas();
    
    loadingIndicator.style.display = 'none';
}

// Initialize tag filters in the sidebar
function initializeTagFilters() {
    // Populate popular tags
    const popularTagsContainer = document.getElementById('popular-tags');
    populateTagSection(popularTagsContainer, tagCategories.popular);
    
    // Populate industry tags
    const industryTagsContainer = document.getElementById('industry-tags');
    populateTagSection(industryTagsContainer, tagCategories.industries);
    
    // Populate technology tags
    const technologyTagsContainer = document.getElementById('technology-tags');
    populateTagSection(technologyTagsContainer, tagCategories.technologies);
    
    // Populate business model tags
    const businessModelTagsContainer = document.getElementById('business-model-tags');
    populateTagSection(businessModelTagsContainer, tagCategories.businessModels);
    
    // Initialize collapsible sections
    initializeCollapsibleSections();
}

// Initialize collapsible sections
function initializeCollapsibleSections() {
    const headers = document.querySelectorAll('.tag-group-header');
    
    headers.forEach(header => {
        const section = header.dataset.section;
        const contentId = section === 'popular' ? 'popular-tags' : 
                         section === 'industry' ? 'industry-tags' : 
                         section === 'technology' ? 'technology-tags' : 
                         'business-model-tags';
        
        const content = document.getElementById(contentId);
        const arrowIcon = header.querySelector('svg');
        
        // Only popular tags are visible by default
        if (section === 'popular') {
            arrowIcon.classList.add('rotated');
        }
        
        header.addEventListener('click', () => {
            // Toggle the visibility of the content
            content.classList.toggle('hidden');
            // Toggle the rotation of the arrow icon
            arrowIcon.classList.toggle('rotated');
            
            // Apply a specific class to rotated arrows to ensure they display correctly
            if (arrowIcon.classList.contains('rotated')) {
                arrowIcon.style.transform = 'rotate(180deg)';
            } else {
                arrowIcon.style.transform = 'rotate(0deg)';
            }
        });
    });
}

// Populate a tag section with filter buttons
function populateTagSection(container, tags) {
    container.innerHTML = '';
    
    tags.forEach(tag => {
        const tagElement = document.createElement('button');
        tagElement.className = `tag-filter ${activeTags.has(tag) ? 'active' : ''}`;
        tagElement.textContent = tag;
        tagElement.setAttribute('data-tag', tag);
        
        tagElement.addEventListener('click', () => {
            toggleTagFilter(tag, tagElement);
        });
        
        container.appendChild(tagElement);
    });
}

// Toggle a tag filter
function toggleTagFilter(tag, element) {
    if (activeTags.has(tag)) {
        activeTags.delete(tag);
        element.classList.remove('active');
    } else {
        activeTags.add(tag);
        element.classList.add('active');
    }
    
    // Update all instances of this tag in other sections
    document.querySelectorAll(`.tag-filter[data-tag="${tag}"]`).forEach(el => {
        if (activeTags.has(tag)) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
    
    // Update active filters display in search bar area
    updateActiveFiltersDisplay();
    
    // Re-render ideas with the new filter
    renderIdeas();
}

// Update the active filters display in the search bar area
function updateActiveFiltersDisplay() {
    if (!activeFiltersContainer) return;
    
    if (activeTags.size === 0 && !searchQuery) {
        activeFiltersContainer.classList.add('hidden');
        activeFiltersContainer.innerHTML = '';
        return;
    }
    
    activeFiltersContainer.classList.remove('hidden');
    activeFiltersContainer.innerHTML = '';
    
    // Add filter tags
    activeTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'filter-tag mr-2 mb-1';
        tagElement.innerHTML = `
            ${tag}
            <span class="close-tag" data-tag="${tag}">&times;</span>
        `;
        activeFiltersContainer.appendChild(tagElement);
        
        // Add event listener to the close button
        tagElement.querySelector('.close-tag').addEventListener('click', () => {
            activeTags.delete(tag);
            // Update all tag buttons UI
            document.querySelectorAll(`.tag-filter[data-tag="${tag}"]`).forEach(el => {
                el.classList.remove('active');
            });
            updateActiveFiltersDisplay();
            renderIdeas();
        });
    });
    
    // Add search query if present
    if (searchQuery) {
        const searchElement = document.createElement('span');
        searchElement.className = 'filter-tag mr-2 mb-1';
        searchElement.innerHTML = `
            "Search: ${searchQuery}"
            <span class="close-tag" data-search="true">&times;</span>
        `;
        activeFiltersContainer.appendChild(searchElement);
        
        // Add event listener to the close button
        searchElement.querySelector('.close-tag').addEventListener('click', () => {
            searchQuery = '';
            if (searchInput) {
                searchInput.value = '';
            }
            updateActiveFiltersDisplay();
            renderIdeas();
        });
    }
    
    // Add "Clear all" button if there are multiple filters
    if (activeTags.size > 1 || (activeTags.size > 0 && searchQuery)) {
        const clearAllBtn = document.createElement('span');
        clearAllBtn.className = 'clear-filters-btn';
        clearAllBtn.textContent = 'Clear all';
        activeFiltersContainer.appendChild(clearAllBtn);
        
        clearAllBtn.addEventListener('click', clearAllFilters);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Set initial state for mobile sidebar
    const leftSidebar = document.getElementById('left-sidebar');
    if (leftSidebar && window.innerWidth <= 768) {
        leftSidebar.classList.add('hidden');
        leftSidebar.classList.remove('active');
    }
    
    // Handle search input
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearchInput(e);
            }
        });
    }
    
    // Category links
    document.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Handle specific category actions
            const linkText = link.textContent.trim();
            
            if (linkText === 'Home') {
                // Navigate to home.html
                window.location.href = 'home.html';
                return;
            } else if (linkText === 'All Ideas') {
                // Clear all filters and show all ideas
                clearAllFilters();
            } else if (linkText === 'My Favorites') {
                // Show only favorite ideas
                showOnlyFavorites();
            } else if (linkText === 'My Ideas') {
                // Show only user's ideas
                showOnlyUserIdeas();
            } else if (linkText === 'Trending') {
                // Sort by upvotes/popularity
                sortByTrending();
            }
        });
    });
    
    // Handle hamburger menu toggle (sidebar toggle button)
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('left-sidebar'); // Sidebar ID
    
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('active'); // Use active class instead of show-sidebar
            
            // Toggle overlay
            toggleSidebarOverlay();
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        // Only do this on mobile view
        if (window.innerWidth > 768) return;
        
        const sidebar = document.getElementById('left-sidebar');
        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        
        // Check if click is outside sidebar and toggle button, and sidebar is active
        if (sidebar && 
            sidebarToggleBtn && !sidebarToggleBtn.contains(e.target) && 
            !sidebar.contains(e.target) && 
            sidebar.classList.contains('active')) {
            
            sidebar.classList.add('hidden');
            sidebar.classList.remove('active');
            
            // Remove any overlay
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) overlay.remove();
        }
    });
    
    // Handle window resize to show/hide sidebar appropriately
    window.addEventListener('resize', () => {
        const sidebar = document.getElementById('left-sidebar');
        
        if (sidebar) {
            if (window.innerWidth > 768) {
                // On desktop/tablet: always show sidebar
                sidebar.classList.remove('active');
                sidebar.classList.remove('hidden');
                
                // Remove overlay if exists
                const overlay = document.getElementById('sidebar-overlay');
                if (overlay) overlay.remove();
            } else {
                // On mobile: hide sidebar by default unless it's currently active
                if (!sidebar.classList.contains('active')) {
                    sidebar.classList.add('hidden');
                }
            }
        }
    });
    
    // Profile menu toggle
    const profileMenuToggle = document.getElementById('profile-menu-toggle');
    
    if (profileMenuToggle) {
        profileMenuToggle.addEventListener('click', toggleProfileMenu);
    }
    
    // Add specific event handler for the sidebar toggle button
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const sidebar = document.getElementById('left-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('active');
            toggleSidebarOverlay();
        }
    });
}
    
    // Generate idea link
    const generateIdeaLink = document.getElementById('generate-idea-link');
    if (generateIdeaLink) {
        generateIdeaLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('Please log in to generate an idea');
                return;
            }
            
            try {
                // Show loading indicator
                const loadingToast = showToast('Generating idea...', 'info');
                
                // Import the auto idea generator
                const { generateIdea } = await import('./auto_idea_generator.js');
                const newIdea = await generateIdea();
                
                // Show the "Add Idea" form with pre-filled fields
                const addIdeaModal = document.getElementById('add-idea-modal');
                const formElements = document.getElementById('add-idea-form').elements;
                
                // Pre-fill form with generated idea
                formElements['idea-title'].value = newIdea.title;
                formElements['idea-summary'].value = newIdea.summary;
                formElements['idea-details'].value = newIdea.details;
                formElements['idea-tags'].value = newIdea.tags.join(', ');
                formElements['idea-icon'].value = newIdea.icon || '';
                
                // Show the modal
                addIdeaModal.classList.add('active');
                
                // Hide loading indicator
                if (loadingToast && loadingToast.parentNode) {
                    loadingToast.parentNode.removeChild(loadingToast);
                }
            } catch (error) {
                console.error('Error generating idea:', error);
                showToast('Failed to generate idea. Please try again.', 'error');
            }
        });
    }
    
    // Handle idea click for detailed view
    ideasContainer.addEventListener('click', handleIdeaClick);
    
    // Handle back button click
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            // Go back to list view
            document.getElementById('idea-detail-view').classList.add('hidden');
            document.getElementById('ideas-list-view').classList.remove('hidden');
            
            // Update URL without the idea ID
            history.pushState({}, '', window.location.pathname);
        });
    }
    
    // Handle history navigation (back button)
    window.addEventListener('popstate', handleHistoryNavigation);
    
    // Initialize URL state (for direct links to ideas)
    handleHistoryNavigation();
    
    // Set up Add Idea modal functionality
    if (addIdeaModal && addIdeaModalClose && addIdeaForm && addIdeaSubmitBtn) {
        // Close modal when clicking X button
        addIdeaModalClose.addEventListener('click', () => {
            addIdeaModal.classList.remove('active');
        });
        
        // Close modal when clicking outside
        addIdeaModal.addEventListener('click', (e) => {
            if (e.target === addIdeaModal) {
                addIdeaModal.classList.remove('active');
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && addIdeaModal.classList.contains('active')) {
                addIdeaModal.classList.remove('active');
            }
        });
        
        // Handle form submission
        addIdeaSubmitBtn.addEventListener('click', handleAddIdeaSubmit);
    }
}

// Toggle sidebar overlay
function toggleSidebarOverlay() {
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('left-sidebar');
    
    if (overlay) {
        overlay.remove();
    } else {
        const newOverlay = document.createElement('div');
        newOverlay.id = 'sidebar-overlay';
        newOverlay.className = 'fixed inset-0 bg-black bg-opacity-50';
        document.body.appendChild(newOverlay);
        
        newOverlay.addEventListener('click', () => {
            if (sidebar) {
                sidebar.classList.remove('active');
                // Add hidden class after a short delay to allow transition
                setTimeout(() => {
                    sidebar.classList.add('hidden');
                }, 300);
            }
            newOverlay.remove();
        });
    }
}

// Toggle the profile menu
function toggleProfileMenu() {
    const profileMenuModal = document.getElementById('profile-menu-modal');
    if (profileMenuModal) {
        profileMenuModal.classList.toggle('active');
        // No custom positioning needed as we're using the default centered modal layout
    }
}

// Handle search input
function handleSearchInput(event) {
    if (!event.target) return;
    
    searchQuery = event.target.value.trim().toLowerCase();
    updateActiveFiltersDisplay();
    renderIdeas();
}

// Handle logout
function logout() {
    // Call the auth API to log out
    handleLogout()
        .then(() => {
            // Redirect to login page
            window.location.href = '/index.html';
        })
        .catch(error => {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        });
    
    // Close the profile menu
    toggleProfileMenu();
}

// Handle idea click
function handleIdeaClick(event) {
    // Ignore clicks on action buttons
    if (event.target.closest('.social-action-btn')) return;
    
    const ideaCard = event.target.closest('.idea-card');
    if (!ideaCard) return;
    
    const ideaId = ideaCard.dataset.ideaId;
    if (!ideaId) return;
    
    const idea = ideasDatabase.find(idea => idea.id === ideaId);
    if (!idea) return;
    
    // Check if user is logged in
    if (!currentUser) {
        // Show login modal if not logged in
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.add('active');
        } else {
            alert('Please log in to view idea details');
        }
        return;
    }
    
    // Show idea details
    showIdeaDetails(idea);
    
    // Update URL with idea ID for sharing/history
    history.pushState({ ideaId }, '', `?idea=${ideaId}`);
}

// Handle history navigation
function handleHistoryNavigation() {
    const urlParams = new URLSearchParams(window.location.search);
    const ideaId = urlParams.get('idea');
    
    if (ideaId) {
        // If we have an idea ID in the URL, show that idea's details
        const idea = ideasDatabase.find(idea => idea.id === ideaId);
        if (idea) {
            if (!currentUser) {
                // Show login modal if not logged in
                const loginModal = document.getElementById('login-modal');
                if (loginModal) {
                    loginModal.classList.add('active');
                }
                return;
            }
            
            showIdeaDetails(idea);
        }
    } else {
        // Go back to list view
        const detailContainer = document.getElementById('idea-detail-container');
        const ideasContainer = document.getElementById('ideas-container');
        
        if (detailContainer && ideasContainer) {
            detailContainer.style.display = 'none';
            ideasContainer.style.display = 'block';
        }
    }
}

// Clear all active filters
function clearAllFilters() {
    activeTags.clear();
    searchQuery = '';
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Update UI to reflect cleared filters
    document.querySelectorAll('.tag-filter').forEach(el => {
        el.classList.remove('active');
    });
    
    renderIdeas();
}

// Show only favorite ideas
async function showOnlyFavorites() {
    if (!currentUser) {
        alert('Please log in to view your favorites');
        return;
    }
    
    // Clear any existing filters first
    activeTags.clear();
    
    // Update UI to reflect cleared filters
    document.querySelectorAll('.tag-filter').forEach(el => {
        el.classList.remove('active');
    });
    
    // Update the category link UI
    document.querySelectorAll('.category-link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.trim() === 'My Favorites') {
            link.classList.add('active');
        }
    });
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    
    try {
        // We'll fetch the user's favorites from the API
        const favorites = await import('./api.js').then(mod => mod.fetchFavoritesForUser(currentUser.id));
        showToast(`Found ${favorites.length} favorite ideas`, 'success');
        
        // Use the existing renderIdeas function with onlyFavorites=true
        renderIdeas(true);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        showToast('Error loading favorites', 'error');
        loadingIndicator.style.display = 'none';
    }
}

// Show only the current user's ideas
async function showOnlyUserIdeas() {
    if (!currentUser) {
        alert('Please log in to view your ideas');
        return;
    }
    
    // Clear any existing filters first
    activeTags.clear();
    
    // Update UI to reflect cleared filters
    document.querySelectorAll('.tag-filter').forEach(el => {
        el.classList.remove('active');
    });
    
    // Update the category link UI
    document.querySelectorAll('.category-link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.trim() === 'My Ideas') {
            link.classList.add('active');
        }
    });
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    
    try {
        // We'll use the existing renderIdeas function with onlyUserIdeas=true
        renderIdeas(false, true);
        
        // Get the count of the user's ideas
        const userIdeasCount = ideasDatabase.filter(idea => idea.user_id === currentUser.id).length;
        showToast(`Found ${userIdeasCount} of your ideas`, 'success');
    } catch (error) {
        console.error('Error fetching user ideas:', error);
        showToast('Error loading your ideas', 'error');
        loadingIndicator.style.display = 'none';
    }
}

// Sort ideas by trending/popularity
async function sortByTrending() {
    // Clear any existing filters first
    activeTags.clear();
    
    // Update UI to reflect cleared filters
    document.querySelectorAll('.tag-filter').forEach(el => {
        el.classList.remove('active');
    });
    
    // Update the category link UI
    document.querySelectorAll('.category-link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.trim() === 'Trending') {
            link.classList.add('active');
        }
    });
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    
    try {
        // Initialize upvote and comment counts
        const upvoteCounts = {};
        const commentCounts = {};
        
        // Load the APIs
        const [upvoteApi, commentApi] = await Promise.all([
            import('./upvote_api.js'),
            import('./comments_api.js')
        ]);
        
        // Fetch upvote and comment counts for all ideas in parallel
        const ideaIds = ideasDatabase.map(idea => idea.id);
        
        // Fetch all upvote counts
        const upvotePromises = ideaIds.map(async (id) => {
            const count = await upvoteApi.fetchUpvotesCount(id);
            upvoteCounts[id] = count;
            return { id, count };
        });
        
        // Fetch all comment counts
        const commentPromises = ideaIds.map(async (id) => {
            const count = await commentApi.fetchCommentCount(id);
            commentCounts[id] = count;
            return { id, count };
        });
        
        // Wait for all counts
        await Promise.all([...upvotePromises, ...commentPromises]);
        
        // Calculate trending scores
        const scoredIdeas = ideasDatabase.map(idea => {
            const upvotes = upvoteCounts[idea.id] || 0;
            const comments = commentCounts[idea.id] || 0;
            const score = upvotes * 2 + comments * 3; // Weight comments a bit more
            return { ...idea, _score: score };
        });
        
        // Sort ideas by score
        ideasDatabase = scoredIdeas.sort((a, b) => b._score - a._score);
        
        // Render the trending ideas
        renderIdeas(false, false, true);
        
        showToast('Showing ideas by trending score', 'success');
    } catch (error) {
        console.error('Error sorting by trending:', error);
        showToast('Error loading trending ideas', 'error');
        
        // Fallback to basic sorting
        renderIdeas(false, false, true);
    }
}

// Render ideas based on current filters and state
async function renderIdeas(onlyFavorites = false, onlyUserIdeas = false, trending = false) {
    if (!ideasContainer) return;
    
    // If we're in detail view, don't rerender the list
    if (isDetailView) return;
    
    loadingIndicator.style.display = 'block';
    ideasContainer.innerHTML = '';
    
    // Get user's favorites
    let userFavorites = new Set();
    if (currentUser) {
        try {
            const favs = await import('./api.js').then(mod => mod.fetchFavoritesForUser(currentUser.id));
            userFavorites = new Set(favs.map(String));
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    }
    
    // Filter ideas based on active tags and search query
    let filteredIdeas = ideasDatabase.filter(idea => {
        // Tag filtering
        if (activeTags.size > 0) {
            if (!idea.tags || !idea.tags.some(tag => activeTags.has(tag))) {
                return false;
            }
        }
        
        // Search query filtering
        if (searchQuery) {
            const titleMatch = idea.title.toLowerCase().includes(searchQuery);
            const summaryMatch = idea.summary.toLowerCase().includes(searchQuery);
            const tagsMatch = idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(searchQuery));
            const detailsMatch = idea.details && idea.details.toLowerCase().includes(searchQuery);
            
            if (!titleMatch && !summaryMatch && !tagsMatch && !detailsMatch) {
                return false;
            }
        }
        
        // Favorites filtering
        if (onlyFavorites && (!currentUser || !userFavorites.has(String(idea.id)))) {
            return false;
        }
        
        // User's own ideas filtering
        if (onlyUserIdeas && (!currentUser || idea.user_id !== currentUser.id)) {
            return false;
        }
        
        return true;
    });
    
    // Sort by trending if needed
    if (trending) {
        // This would ideally be based on upvote count, comment count, or other engagement metrics
        // For now, we'll use a simple algorithm
        filteredIdeas.sort((a, b) => {
            // Placeholder for actual trending data
            const scoreA = (a._upvotes || 0) + (a._comments || 0) * 2;
            const scoreB = (b._upvotes || 0) + (b._comments || 0) * 2;
            return scoreB - scoreA;
        });
    }
    
    // Display no results message if needed
    if (filteredIdeas.length === 0) {
        ideasContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-slate-500">No ideas match your current filters.</p>
                <button id="clear-filters-btn" class="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded">
                    Clear Filters
                </button>
            </div>
        `;
        
        document.getElementById('clear-filters-btn').addEventListener('click', clearAllFilters);
        loadingIndicator.style.display = 'none';
        return;
    }
    
    // Initialize upvote and comment counts
    const upvoteCounts = {};
    const commentCounts = {};
    
    try {
        // Batch fetch upvote and comment counts
        const [upvoteApi, commentApi] = await Promise.all([
            import('./upvote_api.js'),
            import('./comments_api.js')
        ]);
        
        // Load upvotes and comments in parallel for all ideas
        const ideaIds = filteredIdeas.map(idea => idea.id);
        
        // Fetch upvote counts for all ideas
        const upvotePromises = ideaIds.map(async (id) => {
            try {
                const count = await upvoteApi.fetchUpvotesCount(id);
                upvoteCounts[id] = count;
                return { id, count };
            } catch (error) {
                console.error(`Error fetching upvotes for idea ${id}:`, error);
                return { id, count: 0 };
            }
        });
        
        // Fetch comment counts for all ideas
        const commentPromises = ideaIds.map(async (id) => {
            try {
                const count = await commentApi.fetchCommentCount(id);
                commentCounts[id] = count;
                return { id, count };
            } catch (error) {
                console.error(`Error fetching comments for idea ${id}:`, error);
                return { id, count: 0 };
            }
        });
        
        // Wait for all counts to be fetched
        await Promise.all([...upvotePromises, ...commentPromises]);
        
    } catch (error) {
        console.error('Error loading social counts:', error);
    }
    
    // Set up event listeners for the card actions
    setupCardEventListeners();
    
    // Render each idea card
    filteredIdeas.forEach(idea => {
        const isFavorite = currentUser && userFavorites.has(String(idea.id));
        const upvoteCount = upvoteCounts[idea.id] || 0;
        const commentCount = commentCounts[idea.id] || 0;
        
        // Create the card using our Reddit-style component
        const ideaCard = createIdeaCardElement(
            idea, 
            isFavorite, 
            upvoteCount, 
            commentCount, 
            activeTags,
            showIdeaDetails
        );
        
        ideasContainer.appendChild(ideaCard);
    });
    
    loadingIndicator.style.display = 'none';
}

// Set up global event listeners for card actions
function setupCardEventListeners() {
    // Clean up any existing listeners
    document.removeEventListener('upvote', handleUpvoteEvent);
    document.removeEventListener('downvote', handleDownvoteEvent);
    document.removeEventListener('favorite', handleFavoriteEvent);
    document.removeEventListener('share', handleShareEvent);
    document.removeEventListener('tag-selected', handleTagSelectedEvent);
    
    // Set up new listeners
    document.addEventListener('upvote', handleUpvoteEvent);
    document.addEventListener('downvote', handleDownvoteEvent);
    document.addEventListener('favorite', handleFavoriteEvent);
    document.addEventListener('share', handleShareEvent);
    document.addEventListener('tag-selected', handleTagSelectedEvent);
}

// Event handler for upvote
async function handleUpvoteEvent(event) {
    const { ideaId, element } = event.detail;
    
    if (!currentUser) {
        alert('Please log in to upvote ideas.');
        return;
    }
    
    await handleUpvote(ideaId, element);
}

// Handle the actual upvote action
async function handleUpvote(ideaId, element) {
    try {
        // Import the upvote API
        const upvoteApi = await import('./upvote_api.js');
        
        // Call the API to toggle the upvote
        const result = await upvoteApi.toggleUpvote(currentUser.id, ideaId);
        
        // Update UI if successful and element is provided
        if (result.success && element) {
            const upvoteBtn = element.querySelector('.upvote-btn');
            const upvoteCount = element.querySelector('.upvote-count');
            
            if (upvoteBtn) {
                if (result.isUpvoted) {
                    upvoteBtn.classList.add('active');
                    showToast('Upvoted!', 'success');
                } else {
                    upvoteBtn.classList.remove('active');
                    showToast('Upvote removed', 'info');
                }
            }
            
            // Update the count
            if (upvoteCount) {
                // Re-fetch the upvote count
                const count = await upvoteApi.fetchUpvotesCount(ideaId);
                upvoteCount.textContent = count;
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error handling upvote:', error);
        showToast('Error updating upvote', 'error');
        return { success: false, error };
    }
}

// Event handler for downvote
function handleDownvoteEvent(event) {
    const { ideaId } = event.detail;
    
    if (!currentUser) {
        alert('Please log in to downvote ideas.');
        return;
    }
    
    // Implement downvote functionality if needed
    console.log('Downvote clicked for idea:', ideaId);
}

// Event handler for favorite
async function handleFavoriteEvent(event) {
    const { ideaId, element } = event.detail;
    
    if (!currentUser) {
        alert('Please log in to favorite ideas.');
        return;
    }
    
    await toggleFavorite(ideaId, element);
}

// Toggle favorite status of an idea
async function toggleFavorite(ideaId, element) {
    try {
        // Import the API module
        const api = await import('./api.js');
        
        // Call the API function to toggle the favorite status
        const result = await api.toggleFavorite(currentUser.id, ideaId);
        
        // Update UI if element is provided
        if (element) {
            const favoriteIcon = element.querySelector('.favorite-btn i');
            const favoriteCount = element.querySelector('.favorite-count');
            
            if (favoriteIcon) {
                if (result) {
                    favoriteIcon.classList.add('text-red-500');
                    showToast('Added to favorites', 'success');
                } else {
                    favoriteIcon.classList.remove('text-red-500');
                    showToast('Removed from favorites', 'info');
                }
            }
            
            // Update the count if needed
            if (favoriteCount) {
                // Re-fetch the favorites count
                try {
                    const count = await api.fetchFavoritesCount(ideaId);
                    favoriteCount.textContent = count;
                } catch (error) {
                    console.error('Error fetching favorites count:', error);
                }
            }
        }
        
        // Return the result for potential chaining
        return result;
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showToast('Error updating favorites', 'error');
        return false;
    }
}

// Event handler for share
function handleShareEvent(event) {
    const { ideaId } = event.detail;
    
    // Implement share functionality
    const shareUrl = `${window.location.origin}/idea/${ideaId}`;
    navigator.clipboard.writeText(shareUrl)
        .then(() => {
            alert('Link copied to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy link: ', err);
            prompt('Copy this link:', shareUrl);
        });
}

// Event handler for tag selection
function handleTagSelectedEvent(event) {
    const { tag } = event.detail;
    activeTags.add(tag);
    updateActiveFiltersDisplay();
    renderIdeas();
}

// Handle adding a new idea
async function handleAddIdeaSubmit(e) {
    if (e) e.preventDefault();
    
    if (!currentUser) {
        alert('Please log in to add an idea');
        return;
    }
    
    if (!addIdeaForm) return;
    
    const formElements = addIdeaForm.elements;
    if (!formElements['idea-title'].value || !formElements['idea-summary'].value) {
        alert('Title and summary are required');
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
        const newIdea = await addIdea(ideaData, currentUser.id);
        
        if (newIdea) {
            showToast('Idea added successfully!');
            
            // Add to database and re-render
            ideasDatabase = await fetchIdeas();
            renderIdeas();
            
            // Reset form and close modal
            addIdeaForm.reset();
            addIdeaModal.classList.remove('active');
        } else {
            showToast('Failed to add idea. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error adding idea:', error);
        showToast('Error adding idea.', 'error');
    }
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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize markdown-it if available
    if (window.markdownit) {
        window.md = window.markdownit();
    }
    
    // Initialize authentication
    try {
        await initAuth((user) => {
            currentUser = user;
            console.log('Auth state changed:', currentUser);
            
            // Update user profile display in sidebar
            updateUserProfileDisplay();
            
            // Update UI based on user state
            document.querySelectorAll('.fav-btn').forEach(btn => {
                if (!currentUser) btn.style.display = 'none';
                else btn.style.display = '';
            });
            
            // Re-render ideas with user context
            renderIdeas();
        });
        
        // Initialize the page
        await initExplore();
        
        // Set up home button click
        const homeLink = document.querySelector('a[href="index.html"]');
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Navigate to home.html
                window.location.href = 'home.html';
            });
        }
        
        // Set up home menu link
        const homeMenuLink = document.querySelector('.category-link:first-of-type');
        if (homeMenuLink) {
            homeMenuLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Navigate directly to home.html
                window.location.href = 'home.html';
            });
        }
        
        // Set up sidebar toggle explicitly
        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const sidebar = document.getElementById('left-sidebar');
                if (sidebar) {
                    // First, make sure it's not hidden if we're going to show it
                    if (sidebar.classList.contains('hidden')) {
                        sidebar.classList.remove('hidden');
                        // Use a small timeout to ensure CSS transitions work
                        setTimeout(() => {
                            sidebar.classList.add('active');
                        }, 10);
                    } else {
                        // If it's already visible, hide it
                        sidebar.classList.remove('active');
                        // Add hidden class after transition
                        setTimeout(() => {
                            sidebar.classList.add('hidden');
                        }, 300);
                    }
                    toggleSidebarOverlay();
                }
            });
        }
        
        // Set up user profile section
        const userProfileSection = document.getElementById('user-profile-section');
        const profileMenuModal = document.getElementById('profile-menu-modal');
        
        if (userProfileSection) {
            userProfileSection.addEventListener('click', (e) => {
                e.preventDefault();
                if (!currentUser) {
                    // Show login modal if not logged in
                    const loginModal = document.getElementById('login-modal');
                    if (loginModal) {
                        loginModal.classList.add('active');
                    }
                    return;
                }
                
                if (profileMenuModal) {
                    profileMenuModal.classList.add('active');
                    // No custom positioning needed - using the default centered modal
                }
            });
        }
        
        // Set up profile menu functionality
        if (profileMenuModal) {
            // Close on clicking outside
            profileMenuModal.addEventListener('click', (e) => {
                if (e.target === profileMenuModal) {
                    profileMenuModal.classList.remove('active');
                }
            });
            
            // Close on clicking outside
            profileMenuModal.addEventListener('click', (e) => {
                if (e.target === profileMenuModal) {
                    profileMenuModal.classList.remove('active');
                }
            });
            
            // Close on ESC key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && profileMenuModal.classList.contains('active')) {
                    profileMenuModal.classList.remove('active');
                }
            });
            
            // Setup profile menu options
            const editProfileBtn = document.getElementById('profile-menu-edit');
            const logoutBtn = document.getElementById('profile-menu-logout');
            const profileMenuClose = document.getElementById('profile-menu-close');
            
            if (profileMenuClose) {
                profileMenuClose.addEventListener('click', () => {
                    profileMenuModal.classList.remove('active');
                });
            }
            
            if (editProfileBtn) {
                editProfileBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    profileMenuModal.classList.remove('active');
                    if (window.openProfileModal) {
                        window.openProfileModal();
                    }
                });
            }
            
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    profileMenuModal.classList.remove('active');
                    
                    try {
                        const { handleLogout } = await import('./auth.js');
                        await handleLogout();
                        showToast('Logged out successfully', 'success');
                    } catch (error) {
                        console.error('Error logging out:', error);
                        showToast('Error logging out', 'error');
                    }
                });
            }
        }
        
        // Remove top menu references completely as they've been removed from the HTML
        // The top navigation bar has been removed from explore.html
        
        // Remove idea count from cards
        document.querySelectorAll('.idea-card').forEach(card => {
            const countElement = card.querySelector('.idea-count');
            if (countElement) {
                countElement.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error('Error initializing explore page:', error);
    }
});

// Update user profile display in sidebar
async function updateUserProfileDisplay() {
    const userAvatarInitial = document.getElementById('user-avatar-initial');
    const userDisplayName = document.getElementById('user-display-name');
    const userStatus = document.getElementById('user-status');
    const profileMenuName = document.getElementById('profile-menu-name');
    const profileMenuEmail = document.getElementById('profile-menu-email');
    
    if (!userAvatarInitial || !userDisplayName || !userStatus) return;
    
    if (currentUser) {
        // Try to get user profile from the database
        try {
            // Import user profile module
            const profileModule = await import('./user_profile.js');
            const fetchProfile = profileModule.fetchProfile || (async () => null);
            
            const profile = await fetchProfile();
            
            if (profile && profile.display_name) {
                // User has a profile
                userDisplayName.textContent = profile.display_name;
                userAvatarInitial.textContent = profile.display_name.charAt(0).toUpperCase();
                userStatus.textContent = 'Member';
                
                if (profileMenuName) profileMenuName.textContent = profile.display_name;
                if (profileMenuEmail) profileMenuEmail.textContent = currentUser.email || '';
            } else {
                // User is logged in but no profile
                userDisplayName.textContent = currentUser.email ? currentUser.email.split('@')[0] : 'User';
                userAvatarInitial.textContent = userDisplayName.textContent.charAt(0).toUpperCase();
                userStatus.textContent = 'Signed In';
                
                if (profileMenuName) profileMenuName.textContent = userDisplayName.textContent;
                if (profileMenuEmail) profileMenuEmail.textContent = currentUser.email || '';
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            
            // Fallback display
            userDisplayName.textContent = currentUser.email ? currentUser.email.split('@')[0] : 'User';
            userAvatarInitial.textContent = userDisplayName.textContent.charAt(0).toUpperCase();
            userStatus.textContent = 'Signed In';
            
            if (profileMenuName) profileMenuName.textContent = userDisplayName.textContent;
            if (profileMenuEmail) profileMenuEmail.textContent = currentUser.email || '';
        }
    } else {
        // User is not logged in
        userDisplayName.textContent = 'Guest User';
        userAvatarInitial.textContent = '?';
        userStatus.textContent = 'Not signed in';
        
        if (profileMenuName) profileMenuName.textContent = 'Guest User';
        if (profileMenuEmail) profileMenuEmail.textContent = 'Not signed in';
    }
}

// Initialize event listeners for the entire explore page
export function initializeEventListeners() {
    // Set up event handlers for each section
    setupSearchEventListeners();
    setupCategoryEventListeners();
    setupSidebarEventListeners();
    setupProfileEventListeners();
    setupIdeaCardEventListeners();
    setupFilterDisplayEventListeners();
    setupHistoryEventListeners();
    setupResponsiveEventListeners();
    setupModalEventListeners();
}

// Set up search-related event listeners
function setupSearchEventListeners() {
    const searchInput = document.getElementById('idea-search');
    const mobileSearchInput = document.getElementById('mobile-idea-search');
    const searchButton = document.getElementById('search-button');
    const mobileSearchButton = document.getElementById('mobile-search-button');
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearchInput(e);
            }
        });
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', handleSearchInput);
        mobileSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearchInput(e);
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            handleSearchInput({ target: searchInput });
        });
    }
    
    if (mobileSearchButton) {
        mobileSearchButton.addEventListener('click', () => {
            handleSearchInput({ target: mobileSearchInput });
        });
    }
}

// Set up category navigation event listeners
function setupCategoryEventListeners() {
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
            
            if (linkText === 'All Ideas') {
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
            
            // On mobile, close the sidebar after selection
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });
    
    // Handle collapsible sections in sidebar
    document.querySelectorAll('.tag-group-header').forEach(header => {
        header.addEventListener('click', () => {
            const tagList = header.closest('.tag-group').querySelector('.tag-list');
            const arrowIcon = header.querySelector('.arrow-icon') || header.querySelector('svg');
            
            if (tagList) {
                tagList.classList.toggle('hidden');
                if (arrowIcon) {
                    arrowIcon.classList.toggle('rotated');
                }
            }
        });
    });
}

// Set up sidebar and mobile navigation event listeners
function setupSidebarEventListeners() {
    // Handle hamburger menu toggle
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', toggleSidebar);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        // Only do this on mobile view
        if (window.innerWidth > 768) return;
        
        const sidebar = document.getElementById('sidebar');
        const hamburgerMenu = document.getElementById('hamburger-menu');
        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        
        if (sidebar && 
            !sidebar.contains(e.target) && 
            ((hamburgerMenu && !hamburgerMenu.contains(e.target)) || 
             (sidebarToggleBtn && !sidebarToggleBtn.contains(e.target))) && 
            (sidebar.classList.contains('show-sidebar') || sidebar.classList.contains('active'))) {
            
            toggleSidebar();
        }
    });
    
    // Generate idea link
    const generateIdeaLink = document.getElementById('generate-idea-link');
    if (generateIdeaLink) {
        generateIdeaLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (!currentUser) {
                alert('Please log in to generate an idea');
                return;
            }
            
            // Redirect to the idea generation page or show modal
            const addIdeaModal = document.getElementById('add-idea-modal');
            if (addIdeaModal) {
                addIdeaModal.classList.add('active');
            } else {
                window.location.href = '/generate.html';
            }
            
            // On mobile, close the sidebar after selection
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    }
}

// Set up profile menu and user actions
function setupProfileEventListeners() {
    // Handle profile section click
    const userProfileSection = document.getElementById('user-profile-section');
    const profileMenuModal = document.getElementById('profile-menu-modal');
    
    if (userProfileSection && profileMenuModal) {
        userProfileSection.addEventListener('click', () => {
            profileMenuModal.classList.toggle('active');
        });
        
        // Close profile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (profileMenuModal.classList.contains('active') && 
                !userProfileSection.contains(e.target) && 
                !profileMenuModal.contains(e.target)) {
                profileMenuModal.classList.remove('active');
            }
        });
    }
    
    // Handle profile menu toggle (newer design)
    const profileMenuToggle = document.getElementById('profile-menu-toggle');
    const profileMenu = document.getElementById('profile-menu');
    
    if (profileMenuToggle && profileMenu) {
        profileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('hidden');
        });
        
        // Close profile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileMenu.classList.contains('hidden') && 
                !profileMenuToggle.contains(e.target) && 
                !profileMenu.contains(e.target)) {
                profileMenu.classList.add('hidden');
            }
        });
    }
    
    // Setup the logout button
    const logoutBtn = document.getElementById('logout-btn');
    const profileMenuLogout = document.getElementById('profile-menu-logout');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (profileMenuLogout) {
        profileMenuLogout.addEventListener('click', handleLogout);
    }
}

// Set up idea card and detail view event listeners
function setupIdeaCardEventListeners() {
    // Handle idea click for detailed view
    const ideasContainer = document.getElementById('ideas-container');
    if (ideasContainer) {
        ideasContainer.addEventListener('click', handleIdeaClick);
    }
    
    // Setup global event listeners for card actions
    document.removeEventListener('upvote', handleUpvoteEvent);
    document.removeEventListener('downvote', handleDownvoteEvent);
    document.removeEventListener('favorite', handleFavoriteEvent);
    document.removeEventListener('share', handleShareEvent);
    document.removeEventListener('tag-selected', handleTagSelectedEvent);
    
    document.addEventListener('upvote', handleUpvoteEvent);
    document.addEventListener('downvote', handleDownvoteEvent);
    document.addEventListener('favorite', handleFavoriteEvent);
    document.addEventListener('share', handleShareEvent);
    document.addEventListener('tag-selected', handleTagSelectedEvent);
    
    // Handle back button click
    const backToListBtn = document.getElementById('back-to-list-btn');
    const backButton = document.getElementById('back-button');
    
    if (backToListBtn) {
        backToListBtn.addEventListener('click', goBackToListView);
    }
    
    if (backButton) {
        backButton.addEventListener('click', goBackToListView);
    }
}

// Set up active filters display event listeners
function setupFilterDisplayEventListeners() {
    // Handle clear filters button click
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

// Set up history and URL state event listeners
function setupHistoryEventListeners() {
    // Handle history navigation (back button)
    window.addEventListener('popstate', handleHistoryNavigation);
    
    // Initialize URL state (for direct links to ideas)
    handleHistoryNavigation();
}

// Set up responsive design event listeners
function setupResponsiveEventListeners() {
    // Handle window resize to show/hide sidebar appropriately
    window.addEventListener('resize', () => {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (sidebar) {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('show-sidebar');
                sidebar.classList.remove('active');
                sidebar.classList.remove('hidden');
                
                if (sidebarOverlay) {
                    sidebarOverlay.remove();
                }
            } else if (!sidebar.classList.contains('show-sidebar') && !sidebar.classList.contains('active')) {
                sidebar.classList.add('hidden');
            }
        }
    });
}

// Set up modal-related event listeners
function setupModalEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const closeBtn = modal.querySelector('[id$="-close"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// Toggle the sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('left-sidebar'); // Corrected sidebar ID
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar) return;
    
    // Toggle sidebar visibility
    sidebar.classList.toggle('hidden');
    
    // Toggle special class based on the design version
    if (sidebar.classList.contains('explore-sidebar')) {
        sidebar.classList.toggle('active');
    } else {
        sidebar.classList.toggle('show-sidebar');
    }
    
    // Handle overlay
    if (overlay) {
        overlay.remove();
    } else if (sidebar.classList.contains('active') || sidebar.classList.contains('show-sidebar')) {
        const newOverlay = document.createElement('div');
        newOverlay.id = 'sidebar-overlay';
        newOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-10';
        document.body.appendChild(newOverlay);
        
        newOverlay.addEventListener('click', toggleSidebar);
    }
}

// Handle search input
function handleSearchInput(event) {
    if (!event || !event.target) return;
    
    searchQuery = event.target.value.trim().toLowerCase();
    
    // Sync search inputs if we have both mobile and desktop
    const searchInput = document.getElementById('idea-search');
    const mobileSearchInput = document.getElementById('mobile-idea-search');
    
    if (searchInput && event.target !== searchInput) {
        searchInput.value = searchQuery;
    }
    
    if (mobileSearchInput && event.target !== mobileSearchInput) {
        mobileSearchInput.value = searchQuery;
    }
    
    updateActiveFiltersDisplay();
    renderIdeas();
}

// Update active filters display
function updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.getElementById('active-filters-container');
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
            
            const searchInput = document.getElementById('idea-search');
            const mobileSearchInput = document.getElementById('mobile-idea-search');
            
            if (searchInput) {
                searchInput.value = '';
            }
            
            if (mobileSearchInput) {
                mobileSearchInput.value = '';
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

// Clear all filters
function clearAllFilters() {
    activeTags.clear();
    searchQuery = '';
    
    // Update UI to reflect cleared filters
    document.querySelectorAll('.tag-filter').forEach(el => {
        el.classList.remove('active');
    });
    
    const searchInput = document.getElementById('idea-search');
    const mobileSearchInput = document.getElementById('mobile-idea-search');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.value = '';
    }
    
    updateActiveFiltersDisplay();
    renderIdeas();
}

// Handle logout
function handleLogout() {
    // Import and call the handleLogout function
    import('./auth.js').then(auth => {
        auth.handleLogout()
            .then(() => {
                // Redirect to login page
                window.location.href = '/index.html';
            })
            .catch(error => {
                console.error('Logout failed:', error);
                alert('Logout failed. Please try again.');
            });
    });
    
    // Close the profile menu if open
    const profileMenu = document.getElementById('profile-menu');
    const profileMenuModal = document.getElementById('profile-menu-modal');
    
    if (profileMenu) {
        profileMenu.classList.add('hidden');
    }
    
    if (profileMenuModal) {
        profileMenuModal.classList.remove('active');
    }
}

// Handle idea click for detail view
function handleIdeaClick(event) {
    // Ignore clicks on action buttons
    if (event.target.closest('.social-action-btn')) return;
    
    const ideaCard = event.target.closest('.idea-card');
    if (!ideaCard) return;
    
    const ideaId = ideaCard.dataset.ideaId || ideaCard.getAttribute('data-id');
    if (!ideaId) return;
    
    const idea = ideasDatabase.find(idea => idea.id === ideaId);
    if (!idea) return;
    
    // Show idea details
    showIdeaDetails(idea);
    
    // Update URL with idea ID for sharing/history
    history.pushState({ ideaId }, '', `?idea=${ideaId}`);
}

// Go back to list view
function goBackToListView() {
    // Get the appropriate view elements based on the design
    const ideaDetailView = document.getElementById('idea-detail-view');
    const ideasListView = document.getElementById('ideas-list-view');
    
    if (ideaDetailView && ideasListView) {
        ideaDetailView.classList.add('hidden');
        ideasListView.classList.remove('hidden');
        
        // Update URL without the idea ID
        history.pushState({}, '', window.location.pathname);
    }
}

// Handle browser history navigation
function handleHistoryNavigation() {
    const urlParams = new URLSearchParams(window.location.search);
    const ideaId = urlParams.get('idea');
    
    if (ideaId) {
        // If we have an idea ID in the URL, show that idea's details
        const idea = ideasDatabase.find(idea => idea.id === ideaId);
        if (idea) {
            showIdeaDetails(idea);
        }
    } else {
        // Go back to list view
        goBackToListView();
    }
}

// Event handler for upvote
function handleUpvoteEvent(event) {
    const { ideaId, element } = event.detail;
    
    if (!currentUser) {
        alert('Please log in to upvote ideas.');
        return;
    }
    
    try {
        const isActive = element.classList.contains('text-blue-500');
        const countElement = element.nextElementSibling;
        const currentCount = parseInt(countElement.textContent, 10) || 0;
        
        // Optimistic UI update
        if (isActive) {
            element.classList.remove('text-blue-500');
            element.classList.add('text-gray-400');
            countElement.textContent = Math.max(0, currentCount - 1);
        } else {
            element.classList.remove('text-gray-400');
            element.classList.add('text-blue-500');
            countElement.textContent = currentCount + 1;
        }
        
        // Call API to toggle upvote
        import('./upvote_api.js').then(upvoteApi => {
            upvoteApi.toggleUpvote(currentUser.id, ideaId)
                .catch(error => {
                    console.error('Error toggling upvote:', error);
                    // Revert UI on error
                    if (isActive) {
                        element.classList.remove('text-gray-400');
                        element.classList.add('text-blue-500');
                    } else {
                        element.classList.remove('text-blue-500');
                        element.classList.add('text-gray-400');
                    }
                    countElement.textContent = currentCount;
                });
        });
        
        // Dispatch event to update all instances of this idea
        const updateEvent = new CustomEvent('upvote-changed', { 
            detail: { ideaId, newCount: isActive ? currentCount - 1 : currentCount + 1 }
        });
        document.dispatchEvent(updateEvent);
    } catch (error) {
        console.error('Error handling upvote:', error);
    }
}

// Event handler for downvote
function handleDownvoteEvent(event) {
    const { ideaId } = event.detail;
    
    if (!currentUser) {
        alert('Please log in to downvote ideas.');
        return;
    }
    
    // If implementing downvotes, add the logic here
    console.log('Downvote clicked for idea:', ideaId);
}

// Event handler for favorite
function handleFavoriteEvent(event) {
    const { ideaId, element } = event.detail;
    
    if (!currentUser) {
        alert('Please log in to favorite ideas.');
        return;
    }
    
    try {
        const isFavorited = element ? 
            element.getAttribute('data-favorite') === 'true' :
            element.classList.contains('text-yellow-500');
        
        // Optimistically update UI if element provided
        if (element) {
            if (isFavorited) {
                element.classList.remove('text-yellow-500');
                element.classList.add('text-gray-500');
                element.setAttribute('data-favorite', 'false');
            } else {
                element.classList.remove('text-gray-500');
                element.classList.add('text-yellow-500');
                element.setAttribute('data-favorite', 'true');
            }
        }
        
        // Call API to toggle favorite
        import('./api.js').then(api => {
            api.toggleFavorite(currentUser.id, ideaId)
                .catch(error => {
                    console.error('Error toggling favorite:', error);
                    // Revert UI on error
                    if (element) {
                        if (isFavorited) {
                            element.classList.remove('text-gray-500');
                            element.classList.add('text-yellow-500');
                            element.setAttribute('data-favorite', 'true');
                        } else {
                            element.classList.remove('text-yellow-500');
                            element.classList.add('text-gray-500');
                            element.setAttribute('data-favorite', 'false');
                        }
                    }
                });
        });
        
        // Dispatch event to update all instances of this idea
        const updateEvent = new CustomEvent('favorite-changed', { 
            detail: { ideaId, isFavorite: !isFavorited }
        });
        document.dispatchEvent(updateEvent);
    } catch (error) {
        console.error('Error handling favorite:', error);
    }
}

// Event handler for share
function handleShareEvent(event) {
    const { ideaId } = event.detail;
    
    try {
        // Try to use native sharing if available
        if (navigator.share) {
            const idea = ideasDatabase.find(idea => String(idea.id) === String(ideaId));
            import('./share_api.js').then(shareApi => {
                shareApi.shareIdea(idea)
                    .then(() => showToast('Shared successfully!'))
                    .catch(error => {
                        console.error('Error sharing:', error);
                        showToast('Failed to share. Please try again.', 'error');
                    });
            });
        } else {
            // Fallback to clipboard
            const shareUrl = `${window.location.origin}/idea/${ideaId}`;
            navigator.clipboard.writeText(shareUrl)
                .then(() => showToast('Link copied to clipboard!'))
                .catch(err => {
                    console.error('Could not copy link: ', err);
                    prompt('Copy this link:', shareUrl);
                });
        }
    } catch (error) {
        console.error('Error handling share:', error);
    }
}

// Event handler for tag selection
function handleTagSelectedEvent(event) {
    const { tag } = event.detail;
    
    // Add tag to active tags
    activeTags.add(tag);
    
    // Update UI
    document.querySelectorAll(`.tag-filter[data-tag="${tag}"]`).forEach(el => {
        el.classList.add('active');
    });
    
    updateActiveFiltersDisplay();
    renderIdeas();
}

// Show only favorite ideas
function showOnlyFavorites() {
    if (!currentUser) {
        alert('Please log in to view your favorites');
        return;
    }
    
    // We'll use the backend data to find favorites
    // This will be handled in renderIdeas()
    renderIdeas(true);
}

// Show only the current user's ideas
function showOnlyUserIdeas() {
    if (!currentUser) {
        alert('Please log in to view your ideas');
        return;
    }
    
    renderIdeas(false, true);
}

// Sort ideas by trending/popularity
function sortByTrending() {
    // This will be implemented in renderIdeas()
    renderIdeas(false, false, true);
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

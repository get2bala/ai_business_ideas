// showIdeaDetails.js - Function to show idea details inline instead of modal
import { fetchComments, addComment } from './comments_api.js';
import { toggleUpvote, fetchUpvotesCount } from './upvote_api.js';
import { getCurrentUser } from './auth.js';

// Global state for the details view
let currentIdeaId = null;
let isDetailView = false;
let previousScrollPosition = 0;

// Export variables to be accessible by other modules
export { isDetailView, currentIdeaId };

// Function to show idea details
export async function showIdeaDetails(idea, focusSection = null) {
    if (!idea) return;
    
    // Check if user is logged in
    const currentUser = getCurrentUser();
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
    
    // Save current idea ID
    currentIdeaId = idea.id;
    
    // Get DOM elements
    const ideasContainer = document.getElementById('ideas-container');
    const detailContainer = document.getElementById('idea-detail-container');
    
    if (!ideasContainer || !detailContainer) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Save scroll position before switching to detail view
    previousScrollPosition = window.scrollY;
    
    // Hide ideas list and show detail view
    ideasContainer.style.display = 'none';
    detailContainer.style.display = 'block';
    
    // Set state to detail view
    isDetailView = true;
    
    // Update URL with the idea ID for deep linking
    const url = new URL(window.location);
    url.searchParams.set('idea', idea.id);
    window.history.pushState({}, '', url);
    
    // Render idea details
    detailContainer.innerHTML = `
        <div class="detail-view">
            <div class="detail-header sticky top-0 bg-white z-10 py-3 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <button id="back-to-list-btn" class="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="text-2xl font-bold truncate">${idea.title}</h1>
                    <div class="w-6"></div> <!-- Empty space for balance -->
                </div>
            </div>
            
            <div class="idea-content mt-4">
                <div class="text-sm text-gray-500 mb-4">
                    Posted by <span class="font-medium">${idea.username || 'anonymous'}</span>
                    ${idea.timestamp ? ` • ${formatDate(new Date(idea.timestamp))}` : ''}
                </div>
                
                <div class="mb-4">
                    ${idea.tags && idea.tags.length > 0 ? 
                        idea.tags.map(tag => 
                            `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1">${tag}</span>`
                        ).join('') 
                        : ''}
                </div>
                
                <p class="text-lg text-gray-700 mb-6">${idea.summary}</p>
                
                <div class="idea-details prose max-w-none mb-8">
                    ${idea.details ? formatContent(idea.details) : 'No additional details provided.'}
                </div>
                
                <div class="flex items-center space-x-4 pb-4 border-b border-gray-200">
                    <button id="detail-upvote-btn" class="text-gray-400 hover:text-blue-500 mr-1 flex items-center" data-idea-id="${idea.id}" title="Upvote">
                        <i class="fas fa-arrow-up"></i>
                        <span id="detail-upvote-count" class="font-medium ml-1">0</span>
                    </button>
                    
                    <button id="detail-comment-btn" class="text-gray-500 hover:text-blue-500 flex items-center" title="Comments">
                        <i class="fas fa-comment"></i>
                    </button>
                    
                    <button id="detail-favorite-btn" class="text-gray-500 hover:text-red-500 flex items-center" title="Favorite">
                        <i class="fas fa-heart"></i>
                    </button>
                    
                    <button id="detail-share-btn" class="text-gray-500 hover:text-purple-500 flex items-center" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                
                <div id="comments-section" class="comments-section mt-6">
                    <h3 class="text-xl font-medium mb-4">Comments</h3>
                    <div id="comments-container" class="mb-6">
                        <div class="loading-comments text-center py-4 text-gray-500">
                            <i class="fas fa-spinner fa-spin"></i> Loading comments...
                        </div>
                    </div>
                    
                    <div id="comment-form-container" class="comment-form">
                        <textarea id="comment-input" class="comment-textarea" placeholder="What are your thoughts?"></textarea>
                        <button id="add-comment-btn" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
                            Comment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for the detail view
    setupDetailViewEventListeners(idea);
    
    // Load upvotes and comments
    loadSocialData(idea.id);
    
    // Scroll to top of the page
    window.scrollTo(0, 0);
    
    // Apply sticky header behavior for mobile
    applyStickyHeaderBehavior();
    
    // If focus section is specified, scroll to that section
    if (focusSection === 'comments') {
        setTimeout(() => {
            const commentsSection = document.getElementById('comments-section');
            if (commentsSection) {
                commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }
}

// Load social data (upvotes and comments)
async function loadSocialData(ideaId) {
    if (!ideaId) return;
    
    // Get current user
    const currentUser = getCurrentUser();
    
    // Load upvotes
    try {
        const upvoteCount = await fetchUpvotesCount(ideaId);
        const upvoteCountElement = document.getElementById('detail-upvote-count');
        if (upvoteCountElement) {
            upvoteCountElement.textContent = upvoteCount;
        }
        
        // Check if user has upvoted this idea
        if (currentUser) {
            const { hasUserUpvoted } = await import('./upvote_api.js');
            const isUpvoted = await hasUserUpvoted(currentUser.id, ideaId);
            const upvoteBtn = document.getElementById('detail-upvote-btn');
            
            if (upvoteBtn && isUpvoted) {
                upvoteBtn.classList.remove('text-gray-400');
                upvoteBtn.classList.add('text-blue-500');
            }
        }
        
        // Check if this is a favorite
        if (currentUser) {
            const { isFavorite } = await import('./api.js').then(mod => 
                mod.checkIsFavorite(currentUser.id, ideaId)
            ).catch(() => ({ isFavorite: false }));
            
            const favoriteBtn = document.getElementById('detail-favorite-btn');
            if (favoriteBtn && isFavorite) {
                favoriteBtn.classList.remove('text-gray-500');
                favoriteBtn.classList.add('text-red-500');
            }
        }
    } catch (error) {
        console.error('Error loading upvotes:', error);
    }
    
    // Load comments
    try {
        const comments = await fetchComments(ideaId);
        renderComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
        const commentsContainer = document.getElementById('comments-container');
        if (commentsContainer) {
            commentsContainer.innerHTML = `
                <div class="text-center py-4 text-red-500">
                    <p>Failed to load comments. Please try again later.</p>
                </div>
            `;
        }
    }
    
    // Load comments
    try {
        const comments = await fetchComments(ideaId);
        renderComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
        const commentsContainer = document.getElementById('comments-container');
        if (commentsContainer) {
            commentsContainer.innerHTML = `
                <div class="text-center py-4 text-red-500">
                    <p>Failed to load comments. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Render comments
function renderComments(comments) {
    const commentsContainer = document.getElementById('comments-container');
    if (!commentsContainer) return;
    
    if (!comments || comments.length === 0) {
        commentsContainer.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
        return;
    }
    
    commentsContainer.innerHTML = '';
    
    // Sort comments by timestamp (newest first)
    comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        
        const timestamp = comment.timestamp ? new Date(comment.timestamp) : new Date();
        const timeAgo = formatTimeAgo(timestamp);
        
        commentElement.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.username || 'anonymous'}</span>
                <span class="comment-time">${timeAgo}</span>
            </div>
            <div class="comment-content">${formatContent(comment.content)}</div>
        `;
        
        commentsContainer.appendChild(commentElement);
    });
}

// Set up event listeners for the detail view
function setupDetailViewEventListeners(idea) {
    // Back button
    const backButton = document.getElementById('back-to-list-btn');
    if (backButton) {
        backButton.addEventListener('click', handleBackToList);
    }
    
    // Upvote button
    const upvoteBtn = document.getElementById('detail-upvote-btn');
    if (upvoteBtn) {
        upvoteBtn.addEventListener('click', async () => {
            // Get current user from global state
            const currentUser = getCurrentUser();
            
            if (!currentUser) {
                alert('Please log in to upvote ideas.');
                return;
            }
            
            try {
                const countElement = document.getElementById('detail-upvote-count');
                const currentCount = parseInt(countElement.textContent, 10) || 0;
                
                // Optimistic UI update
                const isActive = upvoteBtn.classList.contains('text-blue-500');
                
                if (isActive) {
                    upvoteBtn.classList.remove('text-blue-500');
                    upvoteBtn.classList.add('text-gray-400');
                    countElement.textContent = Math.max(0, currentCount - 1);
                } else {
                    upvoteBtn.classList.remove('text-gray-400');
                    upvoteBtn.classList.add('text-blue-500');
                    countElement.textContent = currentCount + 1;
                }
                
                // Call API
                await toggleUpvote(currentUser.id, idea.id);
            } catch (error) {
                console.error('Error toggling upvote:', error);
                // Revert UI on error
                loadSocialData(idea.id);
            }
        });
    }
    
    // Comment button
    const commentBtn = document.getElementById('detail-comment-btn');
    if (commentBtn) {
        commentBtn.addEventListener('click', () => {
            // Scroll to comments section
            const commentsSection = document.getElementById('comments-section');
            if (commentsSection) {
                commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Focus on comment input
                const commentInput = document.getElementById('comment-input');
                if (commentInput) {
                    setTimeout(() => {
                        commentInput.focus();
                    }, 500);
                }
            }
        });
    }
    
    // Share button
    const shareBtn = document.getElementById('detail-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareUrl = `${window.location.origin}/idea/${idea.id}`;
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    alert('Link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Could not copy link: ', err);
                    prompt('Copy this link:', shareUrl);
                });
        });
    }
    
    // Favorite button
    const favoriteBtn = document.getElementById('detail-favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', async () => {
            // Get current user from global state
            const currentUser = getCurrentUser();
            
            if (!currentUser) {
                alert('Please log in to favorite ideas.');
                return;
            }
            
            // Dispatch global event for favorite toggle
            const event = new CustomEvent('favorite', { 
                detail: { ideaId: idea.id }
            });
            document.dispatchEvent(event);
            
            // Toggle UI
            const isFavorite = favoriteBtn.classList.contains('text-red-500');
            
            if (isFavorite) {
                favoriteBtn.classList.remove('text-red-500');
                favoriteBtn.classList.add('text-gray-500');
            } else {
                favoriteBtn.classList.remove('text-gray-500');
                favoriteBtn.classList.add('text-red-500');
            }
        });
    }
    
    // Add comment button
    const addCommentBtn = document.getElementById('add-comment-btn');
    const commentInput = document.getElementById('comment-input');
    
    if (addCommentBtn && commentInput) {
        addCommentBtn.addEventListener('click', async () => {
            // Get current user from global state
            const currentUser = getCurrentUser();
            
            if (!currentUser) {
                alert('Please log in to add comments.');
                return;
            }
            
            const content = commentInput.value.trim();
            if (!content) {
                alert('Please enter a comment.');
                return;
            }
            
            try {
                // Disable button while submitting
                addCommentBtn.disabled = true;
                addCommentBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Posting...';
                
                // Create comment
                const comment = {
                    idea_id: idea.id,
                    user_id: currentUser.id,
                    username: currentUser.username || currentUser.email,
                    content: content,
                    timestamp: new Date().toISOString()
                };
                
                // Call API
                await addComment(comment);
                
                // Clear input
                commentInput.value = '';
                
                // Reload comments
                const comments = await fetchComments(idea.id);
                renderComments(comments);
            } catch (error) {
                console.error('Error adding comment:', error);
                alert('Failed to add comment. Please try again.');
            } finally {
                // Re-enable button
                addCommentBtn.disabled = false;
                addCommentBtn.innerHTML = 'Comment';
            }
        });
    }
}

// Handle back to list
export function handleBackToList() {
    // Get DOM elements
    const ideasContainer = document.getElementById('ideas-container');
    const detailContainer = document.getElementById('idea-detail-container');
    
    if (!ideasContainer || !detailContainer) return;
    
    // Update URL to remove idea parameter
    const url = new URL(window.location);
    url.searchParams.delete('idea');
    window.history.pushState({}, '', url);
    
    // Show ideas list and hide detail view
    ideasContainer.style.display = 'block';
    detailContainer.style.display = 'none';
    
    // Reset state
    isDetailView = false;
    currentIdeaId = null;
    
    // Restore previous scroll position
    window.scrollTo(0, previousScrollPosition);
}

// Handle URL changes for browser navigation
export function handleUrlNavigation() {
    const url = new URL(window.location);
    const ideaId = url.searchParams.get('idea');
    
    if (ideaId) {
        // If we have an idea ID in the URL, show that idea
        const ideasDatabase = window.ideasDatabase || [];
        const idea = ideasDatabase.find(i => String(i.id) === String(ideaId));
        
        if (idea) {
            showIdeaDetails(idea);
        } else {
            // Idea not found, go back to list
            handleBackToList();
        }
    } else if (isDetailView) {
        // If we're in detail view but no idea ID in URL, go back to list
        handleBackToList();
    }
}

// Helper function to format time ago string
function formatTimeAgo(timestamp) {
    const now = new Date();
    const past = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diffMs = now - past;
    
    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return diffSec + 's ago';
    
    // Convert to minutes
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return diffMin + 'm ago';
    
    // Convert to hours
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return diffHour + 'h ago';
    
    // Convert to days
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return diffDay + 'd ago';
    
    // Convert to months
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return diffMonth + 'mo ago';
    
    // Convert to years
    const diffYear = Math.floor(diffMonth / 12);
    return diffYear + 'y ago';
}

// Format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Format content with markdown support
function formatContent(content) {
    if (!content) return '';
    try {
        // Check if markdown-it is available
        if (window.markdownit) {
            const md = window.markdownit();
            return md.render(content);
        } else {
            // Fallback to simple line break handling
            return content.replace(/\n/g, '<br>');
        }
    } catch (error) {
        console.error('Error formatting content with markdown:', error);
        return content.replace(/\n/g, '<br>');
    }
}

// Apply sticky header behavior for the detail view
function applyStickyHeaderBehavior() {
    // The header is already sticky via CSS position:sticky
    // But we'll add a scroll event to add a shadow when scrolling
    const header = document.querySelector('.detail-header');
    if (!header) return;
    
    const handleScroll = () => {
        if (window.scrollY > 10) {
            header.classList.add('shadow-md');
        } else {
            header.classList.remove('shadow-md');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup the event listener when navigating back
    const backBtn = document.getElementById('back-to-list-btn');
    if (backBtn) {
        const originalClick = backBtn.onclick;
        backBtn.onclick = (e) => {
            window.removeEventListener('scroll', handleScroll);
            if (originalClick) originalClick(e);
        };
    }
}

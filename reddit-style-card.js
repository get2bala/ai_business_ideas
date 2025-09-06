// Create idea card element in Reddit-style
export function createIdeaCardElement(idea, isFavorite, upvoteCount, commentCount, activeTags, showIdeaDetails) {
    const card = document.createElement('div');
    card.className = 'idea-card bg-white border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors';
    card.dataset.ideaId = idea.id;
    
    // Format tags for display - limited to 3 tags initially
    const displayTags = idea.tags?.slice(0, 3) || [];
    const remainingTagsCount = idea.tags ? Math.max(0, idea.tags.length - 3) : 0;
    
    const tagsHtml = displayTags.map(tag => {
        return `<span class="tag inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1 cursor-pointer hover:bg-blue-200">${tag}</span>`;
    }).join('');
    
    const moreTagsHtml = remainingTagsCount > 0 ? 
        `<span class="more-tags text-xs text-gray-500 cursor-pointer">+${remainingTagsCount} more</span>` : '';
    
    // Calculate a timestamp display
    const timestamp = idea.timestamp || new Date().toISOString();
    const timeAgo = formatCardTimeAgo(timestamp);
    
    // Get user info or placeholder
    const username = idea.username || 'anonymous';
    
    // Render card content in Reddit-style
    card.innerHTML = `
        <div class="flex">
            <!-- Right side - content -->
            <div class="flex-1">
                <div class="flex items-center text-xs text-gray-500 mb-1">
                    <span class="mr-1">Posted by u/${username}</span>
                    <span class="mr-1">•</span>
                    <span>${timeAgo}</span>
                </div>
                
                <h3 class="text-lg font-medium mb-2 cursor-pointer hover:text-blue-600 idea-title">${idea.title}</h3>
                
                <p class="text-gray-700 mb-3 line-clamp-3">${idea.summary}</p>
                
                <div class="tags-container mb-3">
                    ${tagsHtml}
                    ${moreTagsHtml}
                </div>
                
                <div class="flex text-xs text-gray-500">
                    <button class="upvote-btn flex items-center mr-4 hover:bg-gray-200 px-2 py-1 rounded social-action-btn" data-idea-id="${idea.id}" title="Upvote">
                        <i class="fas fa-arrow-up"></i>
                        <span class="upvote-count ml-1">${upvoteCount}</span>
                    </button>
                    <button class="comment-btn flex items-center mr-4 hover:bg-gray-200 px-2 py-1 rounded social-action-btn" data-idea-id="${idea.id}" title="Comments">
                        <i class="fas fa-comment"></i>
                    </button>
                    <button class="favorite-btn flex items-center mr-4 hover:bg-gray-200 px-2 py-1 rounded social-action-btn" data-idea-id="${idea.id}" data-favorite="${isFavorite}" title="Favorite">
                        <i class="fas ${isFavorite ? 'fa-heart text-red-500' : 'fa-heart'}"></i>
                    </button>
                    <button class="share-btn flex items-center hover:bg-gray-200 px-2 py-1 rounded social-action-btn" data-idea-id="${idea.id}" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.idea-title').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showIdeaDetails(idea);
    });
    
    // Make the entire card clickable, except for specific interactive elements
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons or tags
        if (!e.target.closest('.social-action-btn') && !e.target.closest('.tag')) {
            showIdeaDetails(idea);
        }
    });
    
    card.querySelector('.upvote-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const event = new CustomEvent('upvote', { 
            detail: { ideaId: idea.id, element: card }
        });
        document.dispatchEvent(event);
    });
    
    card.querySelector('.comment-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showIdeaDetails(idea, 'comments');
    });
    
    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const event = new CustomEvent('favorite', { 
            detail: { ideaId: idea.id, element: card }
        });
        document.dispatchEvent(event);
    });
    
    card.querySelector('.share-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const event = new CustomEvent('share', { 
            detail: { ideaId: idea.id, element: card }
        });
        document.dispatchEvent(event);
    });
    
    // Add tag click handler
    card.querySelectorAll('.tag').forEach(tagElement => {
        tagElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const tagText = e.target.textContent.trim();
            
            const event = new CustomEvent('tag-selected', { 
                detail: { tag: tagText }
            });
            document.dispatchEvent(event);
        });
    });
    
    // More tags handler
    const moreTagsElement = card.querySelector('.more-tags');
    if (moreTagsElement) {
        moreTagsElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const tagsContainer = card.querySelector('.tags-container');
            
            // Show all tags
            const allTagsHtml = idea.tags.map(tag => {
                return `<span class="tag inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1 mb-1 cursor-pointer hover:bg-blue-200">${tag}</span>`;
            }).join('');
            
            tagsContainer.innerHTML = allTagsHtml;
            
            // Re-add tag click handlers
            tagsContainer.querySelectorAll('.tag').forEach(tagElement => {
                tagElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const tagText = e.target.textContent.trim();
                    
                    const event = new CustomEvent('tag-selected', { 
                        detail: { tag: tagText }
                    });
                    document.dispatchEvent(event);
                });
            });
        });
    }
    
    return card;
}

// Helper function to format time ago for cards
function formatCardTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
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

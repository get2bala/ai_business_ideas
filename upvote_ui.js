// upvote_ui.js
// Utility to display and handle upvoting functionality
import { fetchUpvotesCount, hasUserUpvoted, toggleUpvote } from './upvote_api.js';

// Initialize upvote buttons on idea cards
export async function initializeUpvoteButtons(ideas, user) {
    if (!user) return; // Only initialize for authenticated users
    
    try {
        // For each idea card, add upvote button
        const cards = document.querySelectorAll('.card');
        
        for (const card of cards) {
            const ideaId = card.dataset.ideaId;
            if (!ideaId) continue;
            
            // Find the container where we want to place the upvote button (next to favorites)
            const actionsContainer = card.querySelector('.flex-shrink-0');
            if (!actionsContainer) continue;
            
            // Get current upvote count
            const count = await fetchUpvotesCount(ideaId);
            
            // Check if user has already upvoted
            const hasUpvoted = await hasUserUpvoted(user.id, ideaId);
            
            // Create upvote button
            const upvoteBtn = document.createElement('button');
            upvoteBtn.className = `upvote-btn focus:outline-none mr-2 ${hasUpvoted ? 'text-blue-500' : 'text-gray-400'}`;
            upvoteBtn.setAttribute('aria-label', 'upvote');
            upvoteBtn.setAttribute('data-upvoted', hasUpvoted);
            upvoteBtn.setAttribute('data-idea-id', ideaId);
            upvoteBtn.innerHTML = `
                <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                    <span class="upvote-count ml-1">${count}</span>
                </div>
            `;
            
            // Add button to container (before the favorite button)
            actionsContainer.prepend(upvoteBtn);
            
            // Add click event listener
            upvoteBtn.addEventListener('click', handleUpvoteClick);
        }
    } catch (error) {
        console.error('Error initializing upvote buttons:', error);
    }
}

// Handle upvote button click
async function handleUpvoteClick(event) {
    event.stopPropagation(); // Prevent card click (modal opening)
    
    const upvoteBtn = event.currentTarget;
    const ideaId = upvoteBtn.getAttribute('data-idea-id');
    const userId = document.body.dataset.currentUser;
    
    if (!userId) {
        alert('Please log in to upvote ideas.');
        return;
    }
    
    // Get current state
    const isCurrentlyUpvoted = upvoteBtn.getAttribute('data-upvoted') === 'true';
    const countElement = upvoteBtn.querySelector('.upvote-count');
    let currentCount = parseInt(countElement.textContent, 10) || 0;
    
    // Optimistically update UI
    upvoteBtn.setAttribute('data-upvoted', (!isCurrentlyUpvoted).toString());
    if (!isCurrentlyUpvoted) {
        upvoteBtn.classList.remove('text-gray-400');
        upvoteBtn.classList.add('text-blue-500');
        countElement.textContent = currentCount + 1;
    } else {
        upvoteBtn.classList.remove('text-blue-500');
        upvoteBtn.classList.add('text-gray-400');
        countElement.textContent = Math.max(0, currentCount - 1);
    }
    
    // Send to server
    try {
        const result = await toggleUpvote(userId, ideaId);
        
        // If server operation failed, revert UI
        if (!result.success) {
            upvoteBtn.setAttribute('data-upvoted', isCurrentlyUpvoted.toString());
            if (isCurrentlyUpvoted) {
                upvoteBtn.classList.remove('text-gray-400');
                upvoteBtn.classList.add('text-blue-500');
                countElement.textContent = currentCount;
            } else {
                upvoteBtn.classList.remove('text-blue-500');
                upvoteBtn.classList.add('text-gray-400');
                countElement.textContent = currentCount;
            }
        }
    } catch (error) {
        console.error('Error toggling upvote:', error);
        // Revert UI on error
        upvoteBtn.setAttribute('data-upvoted', isCurrentlyUpvoted.toString());
        if (isCurrentlyUpvoted) {
            upvoteBtn.classList.remove('text-gray-400');
            upvoteBtn.classList.add('text-blue-500');
        } else {
            upvoteBtn.classList.remove('text-blue-500');
            upvoteBtn.classList.add('text-gray-400');
        }
        countElement.textContent = currentCount;
    }
}

// Initialize upvote button in idea modal
export async function initializeModalUpvoteButton(ideaId, user) {
    if (!user || !ideaId) return;
    
    try {
        const modalBody = document.getElementById('modal-body');
        if (!modalBody) return;
        
        // Check if there's already an upvote button
        let upvoteSection = modalBody.querySelector('.upvote-section');
        if (!upvoteSection) {
            // Create upvote section
            upvoteSection = document.createElement('div');
            upvoteSection.className = 'upvote-section mt-4 flex items-center';
            
            // Find position to insert (after tags, before comments)
            const tagsDiv = modalBody.querySelector('.flex.flex-wrap.gap-2.mt-4');
            if (tagsDiv) {
                tagsDiv.after(upvoteSection);
            } else {
                // Fallback: insert before comments section
                const commentsSection = modalBody.querySelector('#comments-section');
                if (commentsSection) {
                    commentsSection.before(upvoteSection);
                }
            }
        }
        
        // Get current upvote count and user's upvote status
        const count = await fetchUpvotesCount(ideaId);
        const hasUpvoted = await hasUserUpvoted(user.id, ideaId);
        
        // Create upvote button
        upvoteSection.innerHTML = `
            <button class="upvote-btn focus:outline-none flex items-center ${hasUpvoted ? 'text-blue-500' : 'text-gray-500'}" 
                    data-upvoted="${hasUpvoted}" data-idea-id="${ideaId}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                <span class="upvote-count ml-1">${count}</span>
            </button>
            <span class="ml-2 text-sm text-gray-500">Upvotes</span>
        `;
        
        // Add click event listener
        const upvoteBtn = upvoteSection.querySelector('.upvote-btn');
        upvoteBtn.addEventListener('click', handleUpvoteClick);
    } catch (error) {
        console.error('Error initializing modal upvote button:', error);
    }
}

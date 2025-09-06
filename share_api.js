// share_api.js
// Utility for sharing idea content

// Generate a shareable URL for an idea
export function generateShareUrl(ideaId) {
    // Get the current URL and add the idea ID as a parameter
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?idea=${ideaId}`;
}

// Share idea via navigator.share API if available (mobile devices)
export async function shareIdea(idea) {
    const shareData = {
        title: idea.title,
        text: idea.summary,
        url: generateShareUrl(idea.id)
    };
    
    // Check if the browser supports the Web Share API
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return { success: true };
        } catch (error) {
            console.error('Error sharing idea:', error);
            return { success: false, error };
        }
    } else {
        // Fallback for browsers that don't support the Web Share API
        return { success: false, unsupported: true };
    }
}

// Copy share URL to clipboard
export async function copyShareUrl(ideaId) {
    const shareUrl = generateShareUrl(ideaId);
    
    try {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true, url: shareUrl };
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        
        // Fallback method for copying to clipboard
        try {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return { success: successful, url: shareUrl };
        } catch (fallbackError) {
            console.error('Fallback clipboard copy failed:', fallbackError);
            return { success: false, error: fallbackError, url: shareUrl };
        }
    }
}

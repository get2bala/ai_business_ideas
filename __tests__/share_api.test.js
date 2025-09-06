// __tests__/share_api.test.js
import { generateShareUrl, shareIdea, copyShareUrl } from '../share_api.js';

describe('Share API', () => {
    const originalLocation = global.window.location;
    
    beforeEach(() => {
        // Mock window.location
        delete global.window.location;
        global.window.location = {
            origin: 'https://example.com',
            pathname: '/ideas'
        };
    });
    
    afterEach(() => {
        global.window.location = originalLocation;
    });
    
    test('generateShareUrl creates a valid URL with idea ID', () => {
        const url = generateShareUrl(123);
        expect(url).toBe('https://example.com/ideas?idea=123');
    });
    
    test('shareIdea uses navigator.share when available', async () => {
        // Mock navigator.share
        global.navigator.share = jest.fn().mockResolvedValue(true);
        
        const idea = { id: 123, title: 'Test Idea', summary: 'This is a test' };
        const result = await shareIdea(idea);
        
        expect(navigator.share).toHaveBeenCalledWith({
            title: 'Test Idea',
            text: 'This is a test',
            url: 'https://example.com/ideas?idea=123'
        });
        expect(result.success).toBe(true);
    });
    
    test('shareIdea falls back when navigator.share throws', async () => {
        // Mock navigator.share to throw
        global.navigator.share = jest.fn().mockRejectedValue(new Error('User canceled'));
        
        const idea = { id: 123, title: 'Test Idea', summary: 'This is a test' };
        const result = await shareIdea(idea);
        
        expect(navigator.share).toHaveBeenCalled();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
    
    test('copyShareUrl uses clipboard API when available', async () => {
        // Mock clipboard API
        global.navigator.clipboard = {
            writeText: jest.fn().mockResolvedValue(undefined)
        };
        
        const result = await copyShareUrl(123);
        
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/ideas?idea=123');
        expect(result.success).toBe(true);
    });
});

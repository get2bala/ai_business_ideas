// __tests__/upvote_api.test.js
import { 
    fetchUpvotesCount, 
    fetchUpvotedIdeasForUser, 
    hasUserUpvoted,
    addUpvote,
    removeUpvote,
    toggleUpvote
} from '../upvote_api.js';
import { db } from '../db.js';

jest.mock('../db.js');

describe('Upvote API', () => {
    beforeEach(() => {
        // Reset the mocks before each test
        jest.clearAllMocks();
    });

    test('fetchUpvotesCount returns count of upvotes for an idea', async () => {
        const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];
        db.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
            })
        });

        const result = await fetchUpvotesCount(1);
        expect(result).toBe(3);
        expect(db.from).toHaveBeenCalledWith('upvotes');
    });

    test('fetchUpvotesCount returns 0 when there is an error', async () => {
        db.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
            })
        });

        const result = await fetchUpvotesCount(1);
        expect(result).toBe(0);
    });

    test('fetchUpvotedIdeasForUser returns idea IDs upvoted by user', async () => {
        const mockData = [
            { idea_id: 1, user_id: 'user123' },
            { idea_id: 2, user_id: 'user123' }
        ];
        db.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
            })
        });

        const result = await fetchUpvotedIdeasForUser('user123');
        expect(result).toEqual([1, 2]);
        expect(db.from).toHaveBeenCalledWith('upvotes');
    });

    test('hasUserUpvoted returns true if user upvoted idea', async () => {
        const mockData = [{ id: 1, user_id: 'user123', idea_id: 1 }];
        db.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: mockData, error: null })
                    })
                })
            })
        });

        const result = await hasUserUpvoted('user123', 1);
        expect(result).toBe(true);
    });

    test('hasUserUpvoted returns false if user has not upvoted idea', async () => {
        db.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue({ data: [], error: null })
                    })
                })
            })
        });

        const result = await hasUserUpvoted('user123', 1);
        expect(result).toBe(false);
    });

    test('addUpvote adds upvote and returns success', async () => {
        // Mock hasUserUpvoted to return false (not upvoted yet)
        jest.spyOn(global, 'hasUserUpvoted').mockResolvedValue(false);
        
        const mockData = [{ id: 1, user_id: 'user123', idea_id: 1 }];
        db.from.mockReturnValue({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ data: mockData, error: null })
            })
        });

        const result = await addUpvote('user123', 1);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData[0]);
    });

    test('removeUpvote removes upvote and returns true', async () => {
        db.from.mockReturnValue({
            delete: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            })
        });

        const result = await removeUpvote('user123', 1);
        expect(result).toBe(true);
    });

    test('toggleUpvote adds upvote if not already upvoted', async () => {
        // Mock hasUserUpvoted to return false (not upvoted)
        jest.spyOn(global, 'hasUserUpvoted').mockResolvedValue(false);
        // Mock addUpvote to return success
        jest.spyOn(global, 'addUpvote').mockResolvedValue({ success: true });

        const result = await toggleUpvote('user123', 1);
        expect(result.success).toBe(true);
        expect(result.isUpvoted).toBe(true);
    });

    test('toggleUpvote removes upvote if already upvoted', async () => {
        // Mock hasUserUpvoted to return true (already upvoted)
        jest.spyOn(global, 'hasUserUpvoted').mockResolvedValue(true);
        // Mock removeUpvote to return true (successful removal)
        jest.spyOn(global, 'removeUpvote').mockResolvedValue(true);

        const result = await toggleUpvote('user123', 1);
        expect(result.success).toBe(true);
        expect(result.isUpvoted).toBe(false);
    });
});

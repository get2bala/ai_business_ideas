import { triggerAuthStateChange, createTestUser } from '../test-utils';

describe('test-utils helpers', () => {
    test('createTestUser returns a user object with provided email', () => {
        const u = createTestUser('a@b.com');
        expect(u).toBeDefined();
        expect(u.email).toBe('a@b.com');
        expect(u.id).toBeDefined();
        expect(u.user_metadata).toBeDefined();
    });

    test('triggerAuthStateChange invokes global __authCallback when set', () => {
        const mockCb = jest.fn();
        global.__authCallback = mockCb;
        const user = { id: 'u1' };
        triggerAuthStateChange(user);
        expect(mockCb).toHaveBeenCalledWith('SIGNED_IN', { user });
        triggerAuthStateChange(null);
        expect(mockCb).toHaveBeenCalledWith('SIGNED_OUT', null);
        delete global.__authCallback;
    });
});

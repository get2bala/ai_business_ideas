import { triggerAuthStateChange, createTestUser } from '../test-utils';

describe('moved test-utils (duplicate safe)', () => {
    test('createTestUser basic shape', () => {
        const u = createTestUser('x@y.com');
        expect(u.email).toBe('x@y.com');
        expect(u.user_metadata.full_name).toBe('Test User');
    });

    test('triggerAuthStateChange calls global callback when set', () => {
        const cb = jest.fn();
        global.__authCallback = cb;
        triggerAuthStateChange({ id: 'u' });
        expect(cb).toHaveBeenCalledWith('SIGNED_IN', { user: { id: 'u' } });
        triggerAuthStateChange(null);
        expect(cb).toHaveBeenCalledWith('SIGNED_OUT', null);
        delete global.__authCallback;
    });
});

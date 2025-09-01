import { getCurrentUser, initAuth } from '../auth.js';
import { triggerAuthStateChange, createTestUser } from '../test-utils';

describe('auth module', () => {
  beforeEach(() => {
    // Reset any mocked state
    if (global.__authCallback) {
      delete global.__authCallback;
    }
  });

  test('getCurrentUser initially null and initAuth triggers callback on change', async () => {
    const onAuthChange = jest.fn();
    await initAuth(onAuthChange);
    
    expect(getCurrentUser()).toBe(null);
    
    const testUser = createTestUser();
    triggerAuthStateChange(testUser);
    
    expect(getCurrentUser()).toEqual(testUser);
    expect(onAuthChange).toHaveBeenCalledWith(testUser);
  });
});

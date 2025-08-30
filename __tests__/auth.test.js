import { initAuth, getCurrentUser } from '../auth.js';

describe('auth module', () => {
  test('getCurrentUser initially null and initAuth triggers callback on change', async () => {
    let callbackUser = undefined;
    await initAuth((user) => { callbackUser = user; });
    expect(getCurrentUser()).toBeNull();

    // Trigger auth change using the global helper from jest.setup.js
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    global.__triggerAuth(fakeUser);
    // allow microtask queue to flush
    await new Promise(res => setTimeout(res, 0));
    expect(callbackUser).toEqual(fakeUser);
    expect(getCurrentUser()).toEqual(fakeUser);
  });
});

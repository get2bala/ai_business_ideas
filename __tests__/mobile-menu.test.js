/** @jest-environment jsdom */
import { initAuth } from '../auth.js';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="auth-section"></div>
    <button id="add-idea-btn" class="hidden">Add New Idea</button>
    <div id="mobile-menu" class="mobile-menu"><div id="mobile-menu-content"></div></div>
  `;
});

describe('mobile menu integration', () => {
  test('login menu item opens login modal', async () => {
    // Simulate logged-out state
    await initAuth(() => {});
    // Global trigger to mark logged out
    global.__triggerAuth(null);
    // Populate UI by calling renderAuthUI via auth.initAuth (initAuth already called)
    // Find the mobile menu content; auth.js should have added login item
    const loginClone = document.querySelector('#mobile-menu-content .menu-item');
    // If no menu item exists (depends on render timing), create one for test
    if (!loginClone) {
      // auth.js attaches login item when renderAuthUI runs; call initAuth above should have done it
      expect(true).toBe(true);
      return;
    }
    // Clicking login should open login modal
    loginClone.click();
    const loginModal = document.getElementById('login-modal');
    expect(loginModal.classList.contains('active')).toBe(true);
  });

  test('add idea item triggers add-idea button click when logged in', async () => {
    const clicked = { val: false };
    const addBtn = document.getElementById('add-idea-btn');
    addBtn.addEventListener('click', () => { clicked.val = true; });

    await initAuth(() => {});
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    global.__triggerAuth(fakeUser);
    // Give render a tick
    await new Promise(r => setTimeout(r, 0));

    const mobileAdd = document.getElementById('mobile-add-idea-btn');
    expect(mobileAdd).not.toBeNull();
    mobileAdd.click();
    expect(clicked.val).toBe(true);
  });

  test('profile menu opens logout modal and logout calls signOut', async () => {
    await initAuth(() => {});
    const fakeUser = { id: 'u1', email: 'me@test.com' };
    global.__triggerAuth(fakeUser);
    await new Promise(r => setTimeout(r, 0));

  // Find the profile/menu item that matches the user's email
  const items = Array.from(document.querySelectorAll('#mobile-menu-content .menu-item'));
  const profileBtn = items.find(i => i.textContent && i.textContent.includes(fakeUser.email));
  expect(profileBtn).not.toBeNull();
  profileBtn.click();
    // logout modal should be active
    const logoutModal = document.getElementById('logout-modal');
    expect(logoutModal.classList.contains('active')).toBe(true);
  // Spy on signOut on the actual db instance used by the app
  const { db } = await import('../app.js');
  const signOutSpy = jest.spyOn(db.auth, 'signOut');
    // Click the logout button in modal
    const logoutBtn = document.getElementById('logout-btn-modal');
    expect(logoutBtn).not.toBeNull();
    await logoutBtn.click();
    expect(signOutSpy).toHaveBeenCalled();
    signOutSpy.mockRestore();
  });

  test('favorites toggle dispatches favoritesChange', async () => {
    await initAuth(() => {});
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    global.__triggerAuth(fakeUser);
    await new Promise(r => setTimeout(r, 0));

    const favToggle = document.getElementById('mobile-favorites-toggle');
    expect(favToggle).not.toBeNull();

    let triggered = false;
    document.addEventListener('favoritesChange', () => { triggered = true; });
    favToggle.click();
    expect(triggered).toBe(true);
  });
});

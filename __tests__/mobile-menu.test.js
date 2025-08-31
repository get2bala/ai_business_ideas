/** @jest-environment jsdom */
import { initAuth } from '../auth.js';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="home-content"></div>
    <div id="app-content" style="display: none;"></div>
    <div id="auth-section-desktop"></div>
    <div id="mobile-menu" class="mobile-menu">
        <div id="auth-section-mobile"></div>
    </div>
    <button id="add-idea-btn" class="hidden">Add New Idea</button>
  `;
});

describe('mobile menu integration', () => {
  test('login menu item opens login modal', async () => {
    // Simulate logged-out state
    await initAuth(() => {});
    // Global trigger to mark logged out
    global.__triggerAuth(null);
    
    const loginButton = document.getElementById('login-btn-mobile');
    
    // The button should be rendered by initAuth/renderAuthUI
    expect(loginButton).not.toBeNull();

    // Clicking login should open login modal
    loginButton.click();
    const loginModal = document.getElementById('login-modal');
    expect(loginModal.classList.contains('active')).toBe(true);
  });

  test('profile menu opens logout modal and logout calls signOut', async () => {
    await initAuth(() => {});
    const fakeUser = { id: 'u1', email: 'me@test.com' };
    global.__triggerAuth(fakeUser);
    await new Promise(r => setTimeout(r, 0));

    // Find the profile/menu item
    const profileBtn = document.getElementById('profile-menu-mobile');
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

  test('generate idea menu item dispatches generateAutoIdea event', async () => {
    await initAuth(() => {});
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    global.__triggerAuth(fakeUser);
    await new Promise(r => setTimeout(r, 0));

    const generateBtn = document.getElementById('generate-idea-menu-mobile');
    expect(generateBtn).not.toBeNull();

    let triggered = false;
    document.addEventListener('generateAutoIdea', () => { triggered = true; });
    generateBtn.click();
    expect(triggered).toBe(true);
  });
});

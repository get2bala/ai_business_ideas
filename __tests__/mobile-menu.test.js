/** @jest-environment jsdom */
import { initAuth } from '../auth.js';
import { triggerAuthStateChange, createTestUser } from '../test-utils';
import { db } from '../db.js';

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
  beforeEach(() => {
    // Reset any mocked state
    if (global.__authCallback) {
      delete global.__authCallback;
    }
  });

  test('login menu item opens login modal', async () => {
    await initAuth(() => {});
    triggerAuthStateChange(null); // logged out state
    
    const loginButton = document.getElementById('login-btn-mobile');
    expect(loginButton).not.toBeNull();

    loginButton.click();
    const loginModal = document.getElementById('login-modal');
    expect(loginModal.classList.contains('active')).toBe(true);
  });

  test('profile menu opens logout modal and logout calls signOut', async () => {
    await initAuth(() => {});
    const testUser = createTestUser();
    triggerAuthStateChange(testUser);

    // Find the profile menu item
    const profileBtn = document.getElementById('profile-menu-mobile');
    expect(profileBtn).not.toBeNull();
    profileBtn.click();
    
    // Logout modal should be active
    const logoutModal = document.getElementById('logout-modal');
    expect(logoutModal.classList.contains('active')).toBe(true);
    
    // Spy on signOut
    const signOutSpy = jest.spyOn(db.auth, 'signOut');
    
    // Click the logout button
    const logoutBtn = document.getElementById('logout-btn-modal');
    expect(logoutBtn).not.toBeNull();
    await logoutBtn.click();
    
    expect(signOutSpy).toHaveBeenCalled();
    signOutSpy.mockRestore();
  });

  test('generate idea menu item dispatches generateAutoIdea event', async () => {
    await initAuth(() => {});
    const testUser = createTestUser();
    triggerAuthStateChange(testUser);

    const generateBtn = document.getElementById('generate-idea-menu-mobile');
    expect(generateBtn).not.toBeNull();

    let triggered = false;
    document.addEventListener('generateAutoIdea', () => { triggered = true; });
    generateBtn.click();
    expect(triggered).toBe(true);
  });
});

// auth.js
import { db } from './app.js';

let currentUser = null;

// Modals are created lazily because test harnesses re-create document.body.
function ensureModals() {
    if (typeof document === 'undefined') return;
    let loginModal = document.getElementById('login-modal');
    if (!loginModal) {
        loginModal = document.createElement('div');
        loginModal.id = 'login-modal';
        loginModal.className = 'modal-overlay';
        loginModal.innerHTML = `
            <div class="modal-content relative max-w-xs text-center">
                <button id="login-modal-close" class="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 class="text-2xl font-bold text-slate-800 mb-4">Sign in</h2>
                <form id="login-form" class="space-y-4">
                    <input type="email" id="login-email" placeholder="Email" class="w-full p-2 border rounded" required>
                    <input type="password" id="login-password" placeholder="Password" class="w-full p-2 border rounded" required>
                    <button type="submit" class="bg-slate-800 text-white px-4 py-2 rounded-full w-full">Sign In / Sign Up</button>
                </form>
                <p class="text-xs text-slate-500 mt-4">If you don't have an account, one will be created for you.</p>
            </div>
        `;
        document.body.appendChild(loginModal);

        // Attach close listeners
        const closeBtn = document.getElementById('login-modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => loginModal.classList.remove('active'));
        loginModal.addEventListener('click', (e) => { if (e.target === loginModal) loginModal.classList.remove('active'); });
    }

    let logoutModal = document.getElementById('logout-modal');
    if (!logoutModal) {
        logoutModal = document.createElement('div');
        logoutModal.id = 'logout-modal';
        logoutModal.className = 'modal-overlay';
        logoutModal.innerHTML = `
            <div class="modal-content relative max-w-xs text-center" id="logout-modal-content">
                <!-- Content will be injected dynamically -->
            </div>
        `;
        document.body.appendChild(logoutModal);
        logoutModal.addEventListener('click', (e) => { if (e.target === logoutModal) logoutModal.classList.remove('active'); });
    }

    // Global escape key handler (attach once)
    if (!document._authEscapeHandlerAttached) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const lm = document.getElementById('login-modal');
                const lom = document.getElementById('logout-modal');
                if (lm) lm.classList.remove('active');
                if (lom) lom.classList.remove('active');
            }
        });
        document._authEscapeHandlerAttached = true;
    }

    // Login form submit handler (attach once)
    const loginForm = document.getElementById('login-form');
    if (loginForm && !loginForm._attached) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            let { error } = await db.auth.signInWithPassword({ email, password });
            if (error) {
                let { error: signUpError } = await db.auth.signUp({ email, password });
                if (signUpError) {
                    alert(signUpError.message);
                } else {
                    alert('Check your email for a confirmation link!');
                }
            }
            const lm = document.getElementById('login-modal'); if (lm) lm.classList.remove('active');
        });
        loginForm._attached = true;
    }

}

export async function initAuth(onAuthStateChange) {
    // Listen for changes in auth state (login/logout)
    db.auth.onAuthStateChange((event, session) => {
        currentUser = session ? session.user : null;
        renderAuthUI();
        onAuthStateChange(currentUser); // Notify app.js of the change
    });
}

export function getCurrentUser() {
    return currentUser;
}

function renderAuthUI() {
    // Ensure modals exist and have handlers
    ensureModals();
    // Query DOM nodes at runtime so module import timing doesn't break tests
    const authSection = document.getElementById('auth-section');
    const addIdeaBtn = document.getElementById('add-idea-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuContent = document.getElementById('mobile-menu-content');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    if (currentUser) {
        // Show user icon (avatar) instead of email
        if (authSection) authSection.innerHTML = ``; // clear; we'll append in order
    // Keep the primary #add-idea-btn in the DOM where it was declared (hidden by default).
    // We intentionally do NOT move it into the header/auth section because the
    // mobile menu will provide a dedicated "Add New Idea" entry. This prevents
    // duplicate buttons next to the hamburger menu on smaller screens.
        const avatarBtn = document.createElement('button');
        avatarBtn.id = 'user-avatar-btn';
        avatarBtn.className = 'rounded-full bg-slate-200 hover:bg-slate-300 p-2 focus:outline-none';
        avatarBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        `;
    if (authSection) authSection.appendChild(avatarBtn);
        avatarBtn.addEventListener('click', () => {
                        // Set logout modal content dynamically
            const email = currentUser.email || '';
            const name = currentUser.user_metadata && currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name : '';
                        document.getElementById('logout-modal-content').innerHTML = `
                                <button id="logout-modal-close" class="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <div class="mb-2 text-slate-700 text-base">${email}</div>
                                <div class="flex justify-center mb-2">
                                    <span class="rounded-full bg-slate-200 p-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </span>
                                </div>
                                <div class="mb-4 text-slate-800 font-semibold">${name}</div>
                                <button id="logout-btn-modal" class="bg-red-500 text-white px-4 py-2 rounded-full w-full">Logout</button>
                        `;
                        const logoutModalEl = document.getElementById('logout-modal');
                        if (logoutModalEl) logoutModalEl.classList.add('active');
                        // Attach close and logout listeners
                        const logoutClose = document.getElementById('logout-modal-close');
                        if (logoutClose && logoutModalEl) logoutClose.addEventListener('click', () => { logoutModalEl.classList.remove('active'); });
                        const logoutBtn = document.getElementById('logout-btn-modal');
                        if (logoutBtn && logoutModalEl) logoutBtn.addEventListener('click', async () => {
                            await db.auth.signOut();
                            logoutModalEl.classList.remove('active');
                        });
                });
                // Populate mobile menu content for logged-in user
                if (mobileMenuContent) {
                    mobileMenuContent.innerHTML = '';
                    // Add idea
                    if (addIdeaBtn) {
                        const addBtnClone = addIdeaBtn.cloneNode(true);
                        addBtnClone.id = 'mobile-add-idea-btn';
                        addBtnClone.classList.remove('hidden');
                        addBtnClone.classList.add('menu-item');
                        addBtnClone.addEventListener('click', () => {
                            addIdeaBtn.click();
                            if (mobileMenu) mobileMenu.classList.remove('active');
                        });
                        mobileMenuContent.appendChild(addBtnClone);
                    }
                    // Profile / logout
                    const profileBtn = document.createElement('button');
                    profileBtn.className = 'menu-item';
                    profileBtn.textContent = currentUser.email || 'Profile';
                    profileBtn.addEventListener('click', () => {
                        // Open logout modal (reuse avatar click handler)
                        const avatar = document.getElementById('user-avatar-btn');
                        if (avatar) avatar.click();
                        if (mobileMenu) mobileMenu.classList.remove('active');
                    });
                    mobileMenuContent.appendChild(profileBtn);
                    // Add favorites toggle into mobile menu
                    const favToggle = document.createElement('button');
                    favToggle.className = 'menu-item';
                    // Keep legacy id used by tests and older code. ui.js accepts both IDs.
                    favToggle.id = 'mobile-favorites-toggle';
                    favToggle.textContent = 'Show my favorites';
                    favToggle.dataset.active = 'false';
                    favToggle.addEventListener('click', () => {
                        const active = favToggle.dataset.active === 'true';
                        favToggle.dataset.active = (!active).toString();
                        document.dispatchEvent(new CustomEvent('favoritesChange'));
                        if (mobileMenu) mobileMenu.classList.remove('active');
                    });
                    mobileMenuContent.appendChild(favToggle);
                    // Add Generate Idea entry into mobile menu
                    const genBtn = document.createElement('button');
                    genBtn.className = 'menu-item';
                    genBtn.textContent = 'Generate Idea';
                    genBtn.addEventListener('click', () => {
                        // Dispatch a custom event that ui.js listens for
                        document.dispatchEvent(new CustomEvent('generateAutoIdea'));
                        if (mobileMenu) mobileMenu.classList.remove('active');
                    });
                    mobileMenuContent.appendChild(genBtn);
                }
        } else {
                        if (authSection) authSection.innerHTML = `<button id="login-btn" class="bg-slate-800 text-white px-4 py-2 rounded-full">Login / Sign Up</button>`;
                        if (addIdeaBtn) addIdeaBtn.classList.add('hidden');
                        const loginBtn = document.getElementById('login-btn');
                        if (loginBtn) loginBtn.addEventListener('click', () => { const lm = document.getElementById('login-modal'); if (lm) lm.classList.add('active'); });
                        // Populate mobile menu for logged-out state
                        if (mobileMenuContent) {
                            mobileMenuContent.innerHTML = '';
                            const loginClone = document.createElement('button');
                            loginClone.className = 'menu-item';
                            loginClone.textContent = 'Login / Sign Up';
                            loginClone.addEventListener('click', () => {
                                const lm = document.getElementById('login-modal'); if (lm) lm.classList.add('active');
                                if (mobileMenu) mobileMenu.classList.remove('active');
                            });
                            mobileMenuContent.appendChild(loginClone);
                            // Note: the "Generate Idea" action is intentionally not
                            // exposed in the mobile menu for unauthenticated users.
                            // Users must sign in to access automatic idea generation.
                        }
        }
}

// Mobile menu toggle initialization at runtime
{
    const btn = typeof document !== 'undefined' ? document.getElementById('mobile-menu-btn') : null;
    const menu = typeof document !== 'undefined' ? document.getElementById('mobile-menu') : null;
    if (btn && menu) {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', (!expanded).toString());
            menu.classList.toggle('active');
        });
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menu) return;
            const target = e.target;
            if (menu.contains(target) || btn.contains(target)) return;
            menu.classList.remove('active');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        });
    }
}

// logout helper exposed for possible use
async function handleLogout() {
    await db.auth.signOut();
}
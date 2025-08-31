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
    const authSectionDesktop = document.getElementById('auth-section-desktop');
    const authSectionMobile = document.getElementById('auth-section-mobile');
    const mobileMenu = document.getElementById('mobile-menu');

    const loggedInMenuItems = `
        <a href="#" id="home-menu" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Home</a>
        <a href="#" id="explore-ideas-menu" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Explore Ideas</a>
        <a href="#" id="generate-idea-menu" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Generate Idea</a>
        <a href="#" id="profile-menu" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Profile</a>
        <a href="#" id="logout-menu" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Logout</a>
    `;

    const loggedInMenuItemsMobile = `
        <a href="#" id="home-menu-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Home</a>
        <a href="#" id="explore-ideas-menu-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Explore Ideas</a>
        <a href="#" id="generate-idea-menu-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Generate Idea</a>
        <a href="#" id="profile-menu-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Profile</a>
        <a href="#" id="logout-menu-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Logout</a>
    `;

    if (currentUser) {
        // --- Desktop UI ---
        if (authSectionDesktop) {
            authSectionDesktop.innerHTML = loggedInMenuItems;
            authSectionDesktop.querySelector('#home-menu').addEventListener('click', (e) => {
                e.preventDefault();
                showHome();
            });
            authSectionDesktop.querySelector('#explore-ideas-menu').addEventListener('click', (e) => {
                e.preventDefault();
                showApp();
            });
            authSectionDesktop.querySelector('#generate-idea-menu').addEventListener('click', (e) => {
                e.preventDefault();
                showApp();
                document.dispatchEvent(new CustomEvent('generateAutoIdea'));
            });
            authSectionDesktop.querySelector('#profile-menu').addEventListener('click', (e) => {
                e.preventDefault();
                openLogoutModal();
            });
            authSectionDesktop.querySelector('#logout-menu').addEventListener('click', async (e) => {
                e.preventDefault();
                await db.auth.signOut();
            });
        }

        // --- Mobile UI ---
        if (authSectionMobile) {
            authSectionMobile.innerHTML = loggedInMenuItemsMobile;
            authSectionMobile.querySelector('#home-menu-mobile').addEventListener('click', (e) => {
                e.preventDefault();
                showHome();
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
            authSectionMobile.querySelector('#explore-ideas-menu-mobile').addEventListener('click', (e) => {
                e.preventDefault();
                showApp();
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
            authSectionMobile.querySelector('#generate-idea-menu-mobile').addEventListener('click', (e) => {
                e.preventDefault();
                showApp();
                document.dispatchEvent(new CustomEvent('generateAutoIdea'));
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
            authSectionMobile.querySelector('#profile-menu-mobile').addEventListener('click', (e) => {
                e.preventDefault();
                openLogoutModal();
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
            authSectionMobile.querySelector('#logout-menu-mobile').addEventListener('click', async (e) => {
                e.preventDefault();
                await db.auth.signOut();
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
        }

    } else {
        // --- Desktop UI ---
        if (authSectionDesktop) {
            authSectionDesktop.innerHTML = `
                <a href="#" id="home-menu-loggedout" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <a href="#" id="explore-ideas-menu-loggedout" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Explore Ideas</a>
                <a href="#" id="login-btn-desktop" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 px-3 py-2 rounded-md text-sm font-medium">Login/Sign Up</a>
            `;
            authSectionDesktop.querySelector('#home-menu-loggedout').addEventListener('click', (e) => {
                e.preventDefault();
                showHome();
            });
            authSectionDesktop.querySelector('#explore-ideas-menu-loggedout').addEventListener('click', (e) => {
                e.preventDefault();
                showApp();
            });
            const loginBtnDesktop = document.getElementById('login-btn-desktop');
            if (loginBtnDesktop) loginBtnDesktop.addEventListener('click', (e) => { e.preventDefault(); const lm = document.getElementById('login-modal'); if (lm) lm.classList.add('active'); });
        }

        // --- Mobile UI ---
        if (authSectionMobile) {
            authSectionMobile.innerHTML = `
                <a href="#" id="home-menu-loggedout-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Home</a>
                <a href="#" id="explore-ideas-menu-loggedout-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Explore Ideas</a>
                <a href="#" id="login-btn-mobile" class="text-slate-600 hover:bg-slate-200 hover:text-slate-800 block px-3 py-2 rounded-md text-base font-medium">Login/Sign Up</a>
            `;
            authSectionMobile.querySelector('#home-menu-loggedout-mobile').addEventListener('click', (e) => {
                e.preventDefault();
                showHome();
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
            authSectionMobile.querySelector('#explore-ideas-menu-loggedout-mobile').addEventListener('click', (e) => {
                e.preventDefault();
                showApp();
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
            const loginBtnMobile = document.getElementById('login-btn-mobile');
            if (loginBtnMobile) loginBtnMobile.addEventListener('click', (e) => {
                e.preventDefault();
                const lm = document.getElementById('login-modal'); if (lm) lm.classList.add('active');
                if (mobileMenu) mobileMenu.classList.remove('active');
            });
        }
    }
}

function showHome() {
    const homeContent = document.getElementById('home-content');
    const appContent = document.getElementById('app-content');
    if (homeContent) homeContent.style.display = 'block';
    if (appContent) appContent.style.display = 'none';
}

function showApp() {
    const homeContent = document.getElementById('home-content');
    const appContent = document.getElementById('app-content');
    if (homeContent) homeContent.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
}

function openLogoutModal() {
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
}

// Mobile menu toggle initialization at runtime
{
    const btn = typeof document !== 'undefined' ? document.getElementById('mobile-menu-btn') : null;
    const menu = typeof document !== 'undefined' ? document.getElementById('mobile-menu') : null;
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }
}

// logout helper exposed for possible use
async function handleLogout() {
    await db.auth.signOut();
}
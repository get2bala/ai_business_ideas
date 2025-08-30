// auth.js
import { db } from './app.js';

let currentUser = null;

const authSection = document.getElementById('auth-section');
const addIdeaBtn = document.getElementById('add-idea-btn');

// Create login modal (with email/password fields)
let loginModal = document.createElement('div');
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

// Create logout modal (content will be set dynamically)
let logoutModal = document.createElement('div');
logoutModal.id = 'logout-modal';
logoutModal.className = 'modal-overlay';
logoutModal.innerHTML = `
    <div class="modal-content relative max-w-xs text-center" id="logout-modal-content">
        <!-- Content will be injected dynamically -->
    </div>
`;
document.body.appendChild(logoutModal);

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
        if (currentUser) {
                // Show user icon (avatar) instead of email
                authSection.innerHTML = `
                        <button id="user-avatar-btn" class="rounded-full bg-slate-200 hover:bg-slate-300 p-2 focus:outline-none">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                        </button>
                `;
                if (addIdeaBtn) addIdeaBtn.classList.remove('hidden');
                document.getElementById('user-avatar-btn').addEventListener('click', () => {
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
                        logoutModal.classList.add('active');
                        // Attach close and logout listeners
                        document.getElementById('logout-modal-close').addEventListener('click', () => {
                                logoutModal.classList.remove('active');
                        });
                        document.getElementById('logout-btn-modal').addEventListener('click', async () => {
                                await db.auth.signOut();
                                logoutModal.classList.remove('active');
                        });
                });
        } else {
                authSection.innerHTML = `
                        <button id="login-btn" class="bg-slate-800 text-white px-4 py-2 rounded-full">Login / Sign Up</button>
                `;
                if (addIdeaBtn) addIdeaBtn.classList.add('hidden');
                document.getElementById('login-btn').addEventListener('click', () => {
                        loginModal.classList.add('active');
                });
        }
}

// Login modal close
document.getElementById('login-modal-close').addEventListener('click', () => {
    loginModal.classList.remove('active');
});
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.classList.remove('active');
});
// Logout modal background click and escape key
logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) logoutModal.classList.remove('active');
});
// Escape key closes modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        loginModal.classList.remove('active');
        logoutModal.classList.remove('active');
    }
});
// Login form submit
document.getElementById('login-form').addEventListener('submit', async (e) => {
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
    loginModal.classList.remove('active');
});
async function handleLogout() {
    await db.auth.signOut();
}
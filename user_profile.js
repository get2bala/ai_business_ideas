
import { db } from './db.js';
// Utility to fetch and display user profile data
// Assumes authentication is handled elsewhere and user_id is available

// Helper to get current authenticated user id (Supabase v2)
async function getCurrentUserId() {
  if (db && db.auth && db.auth.getUser) {
    const res = await db.auth.getUser();
    return res.data?.user?.id || null;
  } else if (db && db.auth && db.auth.user) {
    return db.auth.user()?.id || null;
  }
  return null;
}

async function fetchProfile() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await db.from('profiles').select('*').eq('id', userId).single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

async function createProfile(profile) {
  const userId = await getCurrentUserId();
  if (!userId || !profile.display_name) return false;
  const { data, error } = await db.from('profiles').insert([
    { id: userId, display_name: profile.display_name, bio: profile.bio }
  ]).select();
  if (error) {
    console.error('Error creating profile:', error);
    return false;
  }
  return true;
}

function openProfileModal() {
  const modal = document.getElementById('profile-modal');
  const form = document.getElementById('profile-form');
  const info = document.getElementById('profile-info');
  const closeBtn = document.getElementById('profile-modal-close');
  if (!modal || !form || !info || !closeBtn) return;
  // Reset form and info
  form.reset();
  
  // Initially hide both form and info, show loading indicator
  info.innerHTML = '<div class="text-center py-4"><p>Loading profile...</p></div>';
  info.style.display = 'block';
  form.style.display = 'none';
  
  // Fetch and display profile
  fetchProfile().then(profile => {
    if (profile) {
      form.style.display = 'none';
      info.style.display = 'block';
      info.innerHTML = `<h3 class="text-lg font-semibold text-slate-800 mb-2">${profile.display_name}</h3><p class="text-slate-600 mb-2">${profile.bio || ''}</p>`;
    } else {
      form.style.display = 'block';
      info.style.display = 'none';
    }
  });
  // Show modal
  modal.classList.add('active');
  // Close handler
  closeBtn.onclick = () => modal.classList.remove('active');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { modal.classList.remove('active'); document.removeEventListener('keydown', escHandler); }
  });
  // Form submit
  form.onsubmit = async (e) => {
    e.preventDefault();
    const display_name = document.getElementById('display_name').value;
    const bio = document.getElementById('bio').value;
    const ok = await createProfile({ display_name, bio });
    if (ok) {
      form.style.display = 'none';
      info.style.display = 'block';
      info.innerHTML = `<h3 class="text-lg font-semibold text-slate-800 mb-2">${display_name}</h3><p class="text-slate-600 mb-2">${bio || ''}</p>`;
    } else {
      alert('Failed to create profile.');
    }
  };
}

// Attach to window for global access
window.openProfileModal = openProfileModal;

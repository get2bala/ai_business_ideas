/** @jest-environment jsdom */
import { renderIdeas } from '../ui.js';
import * as api from '../api.js';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="ideas-grid"></div>
    <div id="filter-container"></div>
    <div id="idea-modal"></div>
    <div id="modal-body"></div>
  `;
});

describe('ui.renderIdeas', () => {
  test('renders empty message when no ideas', () => {
    renderIdeas([], new Set(), null, () => {});
    const grid = document.getElementById('ideas-grid');
    expect(grid.textContent).toMatch(/No ideas match/i);
  });

  test('renders idea card and open modal on click', () => {
    const ideas = [{ id: 1, title: 'A', summary: 's', tags: ['x'], icon: 'i', user_id: 'u1' }];
    renderIdeas(ideas, new Set(), null, () => {});
    const card = document.querySelector('.card');
    expect(card).not.toBeNull();
  });

  test('shows delete button for owner and calls deleteIdea', async () => {
    const ideas = [{ id: 2, title: 'B', summary: 's', tags: ['x'], icon: 'i', user_id: 'owner' }];
    const onDeleted = jest.fn();
    // Mock deleteIdea to return true
    jest.spyOn(api, 'deleteIdea').mockImplementation(async () => true);

    renderIdeas(ideas, new Set(), { id: 'owner' }, onDeleted);
    const deleteBtn = document.querySelector('.delete-btn');
    expect(deleteBtn).not.toBeNull();

    // Simulate click and confirm dialog
    window.confirm = () => true;
    await deleteBtn.click();
    // onDeleted should have been called at least once
    expect(onDeleted).toHaveBeenCalled();
    api.deleteIdea.mockRestore();
  });

  test('toggles favorite when logged-in user clicks heart', async () => {
    const ideas = [{ id: 42, title: 'FavTest', summary: 's', tags: ['x'], icon: 'i', user_id: 'u1' }];
    const user = { id: 'user123' };
    // Mock backend favorites API
    let state = false;
    jest.spyOn(api, 'fetchFavoritesForUser').mockResolvedValue([]);
    jest.spyOn(api, 'toggleFavorite').mockImplementation(async () => {
      state = !state;
      return state;
    });

    renderIdeas(ideas, new Set(), user, () => {});
    const favBtn = document.querySelector('.fav-btn');
    expect(favBtn).not.toBeNull();
    // Initially should reflect not favorited
    expect(favBtn.dataset.favorited === 'true').toBe(false);
    // Click to favorite
    favBtn.click();
    // wait for async handler to complete
    await new Promise(r => setTimeout(r, 0));
    expect(favBtn.dataset.favorited).toBe('true');
    expect(api.toggleFavorite).toHaveBeenCalledWith(String(user.id), 42);

    // Click again to unfavorite
    favBtn.click();
    await new Promise(r => setTimeout(r, 0));
    expect(favBtn.dataset.favorited).toBe('false');

    api.fetchFavoritesForUser.mockRestore();
    api.toggleFavorite.mockRestore();
  });
});

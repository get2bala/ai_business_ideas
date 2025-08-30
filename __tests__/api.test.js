import * as api from '../api.js';

describe('api module', () => {
  test('fetchIdeas returns array and no console.error on success', async () => {
    const ideas = await api.fetchIdeas();
    expect(Array.isArray(ideas)).toBe(true);
    expect(console._errors.length).toBe(0);
  });

  test('addIdea inserts and returns new idea', async () => {
    const ideaData = { title: 'Test', summary: 's', details: 'd', tags: ['a'], icon: '⭐' };
    const newIdea = await api.addIdea(ideaData, 'user-1');
    expect(newIdea).toHaveProperty('id');
    expect(newIdea.title).toBe('Test');
    expect(console._errors.length).toBe(0);
  });

  test('deleteIdea returns true on success', async () => {
    const ok = await api.deleteIdea(1);
    expect(ok).toBe(true);
    expect(console._errors.length).toBe(0);
  });

  test('fetchIdeas handles db error and logs console.error', async () => {
  // Force the mock client to return errors
  global.__forceDbError = true;
  const { fetchIdeas } = await import('../api.js');
  const res = await fetchIdeas();
  expect(Array.isArray(res)).toBe(true);
  expect(console._errors.length).toBeGreaterThan(0);
  delete global.__forceDbError;
  });
});

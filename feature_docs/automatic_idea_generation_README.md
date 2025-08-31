# Automatic Idea Generation

## Overview
Automatically generate business ideas using AI or algorithmic methods.

## Utility Files Plan
- `auto_idea_generator.js`: Utility to generate ideas (using AI API or local logic).
- `auto_idea_api.js`: API wrapper to fetch/generate ideas.

## Integration Plan
- Import and use `auto_idea_generator.js` in a new UI component or modal.
- Add a button (e.g., "Generate Idea") in the hamburger menu UI, which calls the utility and displays the result.
- Use event listeners or custom events to trigger idea generation and update the UI.
- No changes to existing idea CRUD logic; integrate as an optional, additive feature.

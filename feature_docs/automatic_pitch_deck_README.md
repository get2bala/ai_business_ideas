# Automatic Pitch Deck Creation

## Overview
Generate a pitch deck (slides, PDF, or summary) for any idea automatically.

## Utility Files Plan
- `pitch_deck_generator.js`: Utility to create pitch decks from idea data.
- `pitch_deck_export.js`: Utility to export pitch decks as PDF, PPT, or images.

## Integration Plan
- Add a "Generate Pitch Deck" button to each idea card/modal.
- On click, use the utility to generate and display/download the pitch deck.
- Use event listeners or custom events to trigger pitch deck generation.
- No changes to existing idea or UI logic; feature is additive and optional.

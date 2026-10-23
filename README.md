# Ev@lang Quest V2 — Cozy Adventure

A playful, independent English CEFR practice prototype for Year 9 / 3e. Not an official Ev@lang service or validated CEFR placement test.

## Install on GitHub Pages
Upload `index.html`, `cozy.css`, `cozy.js`, and the `assets/` directory together to the repository root. Enable GitHub Pages from your default branch.

## Features kept from English Quest V2
- Four learning worlds and an interactive village map.
- Mixed practice and adaptive question selection.
- Learning Journal with mistake-based reminders and reviews.
- XP, coins, badges, CEFR practice indicators and local progress.

## Existing progress
The application deliberately preserves the prior `english-quest-cefr-v1` localStorage key, so users updating the app at the **same website origin** keep their progress. Switching GitHub Pages domain or URL origin will not automatically transfer browser storage.

## HD art
Replace `assets/worlds/*.svg` with new artwork and update `ART` in `cozy.js` and the `background-image` reference in `cozy.css`; the SVGs currently provided are placeholders.

The sound exercises currently use browser speech synthesis, not verified human recordings.

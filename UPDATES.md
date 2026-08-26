# Bubble Shooter + Game UI Correction Pass

## Bubble Pop Galaxy
- Replaced the old angle-to-column placement with an actual aim-line collision placement system.
- Pointer release now calculates the shot angle directly from the release event, so React state timing cannot send the bubble to a different place.
- Bubble marches up the aim line and attaches to the first bubble/ceiling it reaches.
- Match detection remains connected-cluster based and now removes floating bubbles that lose ceiling connection.
- Added clear scoring for clusters and dropped bubbles.
- Added a 40-shot limit and visible danger line.
- Expanded desktop layout with a large board plus score, loaded bubble, next bubble, scoring, and shot cards.
- Mobile stacks cards without horizontal overflow.

## Reflex & Aim Lab
- Fixed the theme override that could stop the promised green state from actually looking green.
- Waiting state is now unmistakably red/pink: `WAIT — DON'T CLICK`.
- Ready state is now explicitly bright green with `CLICK NOW!`.
- Added timeout cleanup on unmount/restart.

## Typing Speed Rush
- Replaced low-contrast yellow time text with dark high-contrast text.
- Improved the typing input placeholder.

## Shared game cards
- Added a final contrast safety pass for yellow/amber text on light surfaces.
- Enlarged shared result cards for laptop screens.
- Improved result-card stat blocks, hierarchy, top accent strip, and button sizing.

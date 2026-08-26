# GameVerse Redesign Notes

This build redesigns the actual existing GameVerse project while preserving its game component architecture and existing playable game implementations.

## Visual changes
- Playful editorial / cartoon / comic-book visual system
- Cream paper backgrounds, thick dark outlines, offset shadows and sticker-like controls
- Large bold display typography with italic serif emphasis
- Bright multi-colour palettes across the app
- Decorative clouds, stars, doodles and playful game motifs
- Responsive layouts and reduced-motion support

## Navigation
- HOME
- MOODY
- ALL GAMES
- DISCOVER
- MY SPACE
- ABOUT
- REQUEST

The site uses hash routes so each major navigation item has its own addressable page state without adding a routing dependency.

## Game colour logic
Each game now has a primary identity colour plus a secondary and accent colour. Game screens are no longer intentionally harmonised into a single monochrome accent.

## Functional features retained
- Existing game components and game selection flow
- Local stats and high scores
- Favourites
- Sound setting
- Offline service worker assets
- Existing game logic and controls

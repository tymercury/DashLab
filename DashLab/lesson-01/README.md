# DashLab — After-hours cocktail lab

An English-language cocktail discovery website for DESN31927. Built with HTML, CSS and plain JavaScript so the whole request → JSON → interface flow can be studied without a framework.

## Open the website

The current local preview is http://127.0.0.1:4173/.

To start it again, open a terminal in this folder and run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Keep the terminal running, then visit that address. No installation or build step is needed. The website is local, not publicly deployed.

## Files to explore

- `index.html`: page sections, search form, navigation and the recipe dialog.
- `styles.css`: colours, typography, bottle illustrations and responsive layouts.
- `app.js`: API requests, cards, sorting, saved recipes and ingredient checkboxes.
- `assets/night-bar.png`: original AI-generated pixel-art hero. The exact prompt and tool are documented in `assets/GENERATION.md`.
- `../lesson-01-original/`: a copy of the earlier single-Mojito lesson, preserved before this upgrade.

## What works

- Eight handpicked classic cocktails, loaded from the real API.
- Browse by Gin, Vodka, Light rum, Tequila or Bourbon.
- Search cocktail names, including clear empty results.
- Sort the visible recipes A–Z or Z–A.
- Open the complete recipe, glass, ingredient amounts and English instructions.
- Check ingredients while preparing a recipe. Checks reset when a recipe is reopened.
- Save and remove recipes; saved items persist in localStorage on this browser. No account or cross-device sync.
- Request a random cocktail.
- Accessible native dialog with Escape support, keyboard focus indicators, loading/error/retry states, reduced-motion styling and phone layouts.

## API and data flow

Official documentation: https://www.thecocktaildb.com/api.php

The educational test key `1` is public. It is not a secret credential.

| User action | GET request | What the response supplies |
| --- | --- | --- |
| Search a name | `search.php?s=margarita` | Matching full recipes |
| Pick a base spirit | `filter.php?i=Gin` | IDs, names and image URLs |
| Open a recipe | `lookup.php?i=11000` | Full ingredients, measures, glass and method |
| Surprise me | `random.php` | One full recipe |

The Bruno collection in `../../DashLab API Research/` has these four requests.

`request()` fetches JSON with a 15-second timeout. `lookup()` keeps already-fetched full recipes in memory. `loadHouse()`, `loadSpirit()` and `search()` choose data; `renderCards()` builds the visible cards using DOM elements and textContent. `openRecipe()` fetches details when a filter result only contains a summary. Version counters prevent slower old requests from replacing newer results.

The `drinks` array can be empty or null. Ingredient number 1 pairs with measure number 1, and so on through 15. Blank ingredients are skipped. Missing amounts say “Not specified”; they are not guessed. Strength, calories, taste scores and preparation times are not invented.

### Filter limitation observed on October 8, 2026

The Gin filter returned HTTP 200 but only one record (3-Mile Long Island Iced Tea) in both Bruno and the website. The cause is not established. DashLab merges that response with matching house picks (Negroni and Dry Martini), verifies the ingredient name in their full recipes, removes duplicates and labels the result “API matches + matching house picks.” This is a discovery selection, not a claim to list every matching cocktail.

### Sources and external dependencies

Recipe data and drink photographs come from TheCocktailDB. Detail pages link to the original image source when supplied. The pixel-art scene is decorative and is not a photograph of a recipe. Google Fonts supplies DM Sans and Space Grotesk, with system font fallbacks. Live API data, photos and hosted fonts need an internet connection.

## Design and AI process note

Direction: a welcoming, late-night cyberpunk bar, inspired by the atmosphere the student likes in VA-11 HALL-A, with original artwork and no copied game assets. Deep plum backgrounds, lime actions, lilac accents, monospaced labels and illustrated bottle selectors connect the interface to a small experimental bar. Real cocktail photographs make the recipe choices concrete.

AI assisted the interface design, code, hero art and verification. This version should be reviewed and explained by the student as part of the course process. It does not replace user research, a feature specification, use-case diagram or the project's required process documentation.

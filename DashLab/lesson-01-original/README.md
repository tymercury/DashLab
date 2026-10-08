# DashLab — Lesson 01

A small local learning page that retrieves one cocktail from TheCocktailDB.
This is an API learning exercise, not the finished DashLab website.

## Files

- `index.html`: the page elements and their IDs.
- `styles.css`: the first dark colour palette and responsive layout.
- `app.js`: the GET request and the code that displays the returned fields.

## Try it

Open this folder in VS Code. Serve it with a local static server (for example
VS Code Live Server, if already installed), then click **Load Mojito**.
The API request starts only when the button is clicked.

## Connect it to Bruno

The request uses the public educational test key `1`:

`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=11000`

1. `fetch()` sends the GET request.
2. `response.json()` reads the response as JSON.
3. `data.drinks[0]` selects the first drink.
4. `textContent` puts its name and instructions into the page.
5. A loop pairs each ingredient with its measure and skips empty slots.

Missing measures are displayed as **Not specified**. They are not invented.
The source's English instructions and original measurement units are preserved.
There is no saved sample response: a failed request displays an error.

## A small exercise

After understanding Mojito, change `drinkId` in `app.js` from `11000` to `11007`.
Also change the button label and introductory sentence in `index.html` to
Margarita. Reload the page and click the button to compare the results.
Later, a search box or a bottle selector will choose the ID automatically.

## Process notes

The student first tested search and lookup requests in Bruno. This lesson's
HTML, CSS and JavaScript were then prepared with AI assistance. Read, test and
annotate the code; record which parts you understand and what you change.

Data and photography: https://www.thecocktaildb.com/
API documentation: https://www.thecocktaildb.com/api.php

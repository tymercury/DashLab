// LESSON 01: request JSON, find the drink, and display its fields.
// This is the same public educational endpoint you tested in Bruno.
const drinkId = "11000";
const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`;

// 1. Find the existing HTML elements that we want to update.
const loadButton = document.querySelector("#load-button");
const statusMessage = document.querySelector("#status");
const recipe = document.querySelector("#recipe");
const drinkImage = document.querySelector("#drink-image");
const imageNote = document.querySelector("#image-note");

async function loadDrink() {
  loadButton.disabled = true;
  statusMessage.textContent = "Fetching your recipe…";
  statusMessage.dataset.error = "false";
  recipe.hidden = true;

  // Stop waiting after 15 seconds, so a slow connection gets a useful message.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    // 2. Send a GET request, then read the response as JSON.
    const response = await fetch(apiUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`API returned HTTP ${response.status}.`);
    const data = await response.json();

    // 3. drinks is an array. [0] selects its first item.
    const drink = data.drinks?.[0];
    if (!drink) throw new Error("No recipe was found for this drink ID.");

    // 4. Put individual fields into the page. textContent treats them as text.
    document.querySelector("#drink-name").textContent = drink.strDrink;
    document.querySelector("#drink-category").textContent = drink.strAlcoholic || "Cocktail";
    document.querySelector("#drink-glass").textContent = `Serve in: ${drink.strGlass || "Not specified"}`;
    document.querySelector("#instructions").textContent = drink.strInstructions || "Instructions unavailable.";

    drinkImage.hidden = true;
    imageNote.hidden = true;
    drinkImage.alt = drink.strDrink;
    drinkImage.onload = () => { drinkImage.hidden = false; };
    drinkImage.onerror = () => { imageNote.hidden = false; };
    if (drink.strDrinkThumb) drinkImage.src = drink.strDrinkThumb;
    else imageNote.hidden = false;

    // 5. Pair Ingredient1 with Measure1, Ingredient2 with Measure2, etc.
    const ingredientList = document.querySelector("#ingredients");
    ingredientList.replaceChildren();
    for (let number = 1; number <= 15; number++) {
      const ingredient = drink[`strIngredient${number}`]?.trim();
      const measure = drink[`strMeasure${number}`]?.trim();
      if (!ingredient) continue; // Ignore empty ingredient slots.

      const row = document.createElement("li");
      const name = document.createElement("span");
      const amount = document.createElement("span");
      name.textContent = ingredient;
      amount.textContent = measure || "Not specified";
      amount.className = "measure";
      row.append(name, amount);
      ingredientList.append(row);
    }

    recipe.hidden = false;
    statusMessage.textContent = `${drink.strDrink} is ready to explore.`;
  } catch (error) {
    statusMessage.dataset.error = "true";
    statusMessage.textContent = error.name === "AbortError"
      ? "The request took too long. Please try again."
      : "Couldn't load the recipe. Check your connection and try again.";
    console.error("DashLab request failed:", error);
  } finally {
    clearTimeout(timeout);
    loadButton.disabled = false;
  }
}

// 6. A click starts the request. No request is made until you click.
loadButton.addEventListener("click", loadDrink);

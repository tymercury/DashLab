// DashLab: plain JavaScript, no build tools. See README.md for the data flow.
const API = 'https://www.thecocktaildb.com/api/json/v1/1/';
const HOUSE_IDS = ['11000', '11007', '11003', '11001', '11006', '11004', '11005', '17212'];
const $ = (selector) => document.querySelector(selector);
const cache = new Map();
let saved = readSaved();
let currentList = [];
let mode = 'house';
let listVersion = 0;
let detailVersion = 0;
let currentDrink = null;
let retryAction = () => loadHouse();
let retryDetail = null;
let toastTimer;

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem('dashlab-recipes') || '[]');
    return Array.isArray(value) ? value.filter(d => d && typeof d.idDrink === 'string' && typeof d.strDrink === 'string') : [];
  } catch { return []; }
}
function say(message) {
  $('#toast').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 3200);
}
function ingredients(drink) {
  return Array.from({ length: 15 }, (_, i) => ({ name: drink[`strIngredient${i + 1}`]?.trim(), measure: drink[`strMeasure${i + 1}`]?.trim() })).filter(item => item.name);
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function safeURL(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
}
async function request(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(API + endpoint, { signal: controller.signal });
    if (!response.ok) throw new Error('The recipe service is unavailable. Please try again.');
    const data = await response.json();
    return Array.isArray(data.drinks) ? data.drinks : [];
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The recipe service took too long. Please try again.');
    throw new Error('We couldn’t reach the recipe service. Check your connection and try again.');
  } finally { clearTimeout(timeout); }
}
async function lookup(id) {
  if (cache.get(id)?.strInstructions) return cache.get(id);
  const drinks = await request(`lookup.php?i=${encodeURIComponent(id)}`);
  if (!drinks[0]) throw new Error('This recipe is not available right now.');
  cache.set(id, drinks[0]);
  return drinks[0];
}
function updateSavedUI() {
  $('#saved-count').textContent = saved.length;
  document.querySelectorAll('[data-save-id]').forEach(button => {
    const active = saved.some(d => d.idDrink === button.dataset.saveId);
    const drink = cache.get(button.dataset.saveId) || saved.find(d => d.idDrink === button.dataset.saveId);
    button.setAttribute('aria-pressed', active);
    button.setAttribute('aria-label', `${active ? 'Unsave' : 'Save'} ${drink?.strDrink || 'recipe'}`);
    button.textContent = active ? '♥' : '♡';
  });
  if (currentDrink) {
    const active = saved.some(d => d.idDrink === currentDrink.idDrink);
    $('#save-detail').textContent = active ? '♥ Saved to my recipes' : '♡ Save this recipe';
    $('#save-detail').setAttribute('aria-pressed', active);
  }
}
function toggleSave(drink) {
  const exists = saved.some(d => d.idDrink === drink.idDrink);
  const next = exists ? saved.filter(d => d.idDrink !== drink.idDrink) : [...saved, drink];
  try { localStorage.setItem('dashlab-recipes', JSON.stringify(next)); }
  catch { say('Your browser couldn’t save this recipe. Storage may be unavailable.'); return; }
  saved = next;
  updateSavedUI();
  if (mode === 'saved') showSaved(false);
  say(exists ? 'Recipe removed from your collection.' : 'Recipe saved. Your next pour is waiting.');
}
function setView(next, spirit = '') {
  mode = next;
  $('#browse-view').setAttribute('aria-pressed', next !== 'saved');
  $('#saved-view').setAttribute('aria-pressed', next === 'saved');
  document.querySelectorAll('.spirit').forEach(button => {
    const active = next === 'house' ? button.dataset.spirit === '' : next === 'spirit' && button.dataset.spirit === spirit;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
}
function begin(title) {
  const version = ++listVersion;
  currentList = [];
  $('#sort').disabled = true;
  $('#results-title').textContent = title;
  $('#status').textContent = 'Finding your next mix…';
  $('#status').classList.remove('error');
  $('#empty').hidden = true;
  $('#retry').hidden = true;
  $('#cards').setAttribute('aria-busy', 'true');
  $('#cards').replaceChildren(...Array.from({ length: 4 }, () => { const node = el('div', 'skeleton'); node.setAttribute('aria-hidden', 'true'); return node; }));
  return version;
}
function showError(error, version) {
  if (version !== listVersion) return;
  currentList = [];
  $('#cards').replaceChildren();
  $('#sort').disabled = false;
  $('#cards').setAttribute('aria-busy', 'false');
  $('#status').textContent = error.message;
  $('#status').classList.add('error');
  $('#retry').hidden = false;
}
function finish(drinks, version, caption) {
  if (version !== listVersion) return;
  drinks.forEach(d => { if (!cache.has(d.idDrink) || d.strInstructions) cache.set(d.idDrink, d); });
  currentList = drinks;
  $('#sort').disabled = false;
  $('#cards').setAttribute('aria-busy', 'false');
  $('#status').textContent = caption;
  renderCards();
}
function renderCards() {
  const list = [...currentList];
  if ($('#sort').value !== 'default') list.sort((a, b) => a.strDrink.localeCompare(b.strDrink) * ($('#sort').value === 'za' ? -1 : 1));
  $('#cards').replaceChildren(...list.map(drink => {
    const card = el('article', 'card');
    const photo = el('div', 'card-photo');
    const open = el('button', 'photo-open');
    open.setAttribute('aria-label', `Open ${drink.strDrink} recipe`);
    const img = el('img');
    img.src = safeURL(drink.strDrinkThumb); img.alt = drink.strDrink; img.loading = mode === 'house' ? 'eager' : 'lazy'; img.width = 350; img.height = 280;
    img.addEventListener('error', () => { img.hidden = true; open.textContent = 'Image unavailable · View recipe ↗'; });
    open.append(img); open.onclick = () => openRecipe(drink.idDrink);
    const heart = el('button', 'save-button'); heart.dataset.saveId = drink.idDrink; heart.onclick = () => toggleSave(drink);
    photo.append(open, heart);
    const body = el('div', 'card-body');
    const items = ingredients(drink);
    body.append(el('p', 'card-kicker', drink.strAlcoholic || 'COCKTAIL DISCOVERY'));
    const title = el('button', 'card-title', drink.strDrink); title.onclick = () => openRecipe(drink.idDrink); body.append(title);
    body.append(el('p', 'card-description', items.length ? items.slice(0, 3).map(i => i.name).join(' · ') : 'A new recipe to explore'));
    const foot = el('div', 'card-footer'); foot.append(el('span', '', items.length ? `${items.length} ingredients` : 'Explore the ingredients'));
    const view = el('button', '', 'View recipe ↗'); view.setAttribute('aria-label', `View ${drink.strDrink} recipe`); view.onclick = () => openRecipe(drink.idDrink); foot.append(view); body.append(foot);
    card.append(photo, body); return card;
  }));
  $('#empty').hidden = list.length > 0;
  $('#empty-title').textContent = mode === 'saved' ? 'Your collection starts with a little curiosity.' : 'No cocktails on this shelf yet.';
  $('#empty-message').textContent = mode === 'saved' ? 'Tap the heart on a cocktail to save it here, on this browser.' : 'Try another name, check your spelling, or start with the house picks.';
  updateSavedUI();
}
async function loadHouse() {
  setView('house'); $('#search-input').value = ''; retryAction = loadHouse;
  const version = begin('Tonight’s house picks');
  const results = await Promise.allSettled(HOUSE_IDS.map(lookup));
  const drinks = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (!drinks.length) return showError(new Error('We couldn’t load the house picks. Check your connection and try again.'), version);
  finish(drinks, version, `${drinks.length} classics to get you started. A handpicked selection from TheCocktailDB.${drinks.length < HOUSE_IDS.length ? ' Some recipes couldn’t load.' : ''}`);
  if (version === listVersion && drinks.length < HOUSE_IDS.length) $('#retry').hidden = false;
}
async function loadSpirit(spirit) {
  if (!spirit) return loadHouse();
  setView('spirit', spirit); $('#search-input').value = ''; retryAction = () => loadSpirit(spirit);
  const version = begin(`Start with ${spirit.toLowerCase()}`);
  try {
    // The educational filter currently returns a short list. Include verified house matches.
    const houseBySpirit = { Gin: ['11003', '11005'], Vodka: ['17212'], 'Light rum': ['11000', '11006'], Tequila: ['11007'], Bourbon: ['11001'] };
    const [matches, houseResults] = await Promise.all([
      request(`filter.php?i=${encodeURIComponent(spirit)}`),
      Promise.allSettled((houseBySpirit[spirit] || []).map(lookup))
    ]);
    const houseMatches = houseResults.filter(r => r.status === 'fulfilled').map(r => r.value)
      .filter(d => ingredients(d).some(i => i.name.toLowerCase() === spirit.toLowerCase()));
    const drinks = [...new Map([...matches, ...houseMatches].map(d => [d.idDrink, d])).values()];
    finish(drinks, version, `${drinks.length} ${drinks.length === 1 ? 'recipe' : 'recipes'} with ${spirit} · API matches + matching house picks.`);
  } catch (error) { showError(error, version); }
}
async function search(query) {
  setView('search'); retryAction = () => search(query);
  const version = begin(`Results for “${query}”`);
  try { const drinks = await request(`search.php?s=${encodeURIComponent(query)}`); finish(drinks, version, `${drinks.length} ${drinks.length === 1 ? 'recipe' : 'recipes'} found. Follow a familiar name somewhere new.`); }
  catch (error) { showError(error, version); }
}
function showSaved(scroll = true) {
  setView('saved'); ++listVersion; currentList = [...saved];
  $('#results-title').textContent = 'Your next-pour collection';
  $('#status').textContent = `${saved.length} saved ${saved.length === 1 ? 'recipe' : 'recipes'} · Stored on this browser.`;
  $('#status').classList.remove('error'); $('#retry').hidden = true;
  $('#sort').disabled = false;
  $('#cards').setAttribute('aria-busy', 'false'); renderCards();
  if (scroll) $('#collection').scrollIntoView({ behavior: 'smooth' });
}
function showDetail(drink) {
  currentDrink = drink;
  $('#detail-status').textContent = ''; $('#recipe-content').hidden = false;
  $('#drink-name').textContent = drink.strDrink;
  $('#drink-category').textContent = [drink.strAlcoholic, drink.strCategory].filter(Boolean).join(' / ');
  $('#drink-glass').textContent = drink.strGlass ? `Serve in: ${drink.strGlass}` : 'Glass not specified';
  const img = $('#detail-image'); img.hidden = false; img.alt = drink.strDrink;
  img.onerror = () => { img.hidden = true; }; img.src = safeURL(drink.strDrinkThumb);
  const credit = $('#photo-credit'); credit.replaceChildren(document.createTextNode('Photo via TheCocktailDB. '));
  if (safeURL(drink.strImageSource)) { const link = el('a', '', 'Original image source ↗'); link.href = safeURL(drink.strImageSource); link.target = '_blank'; link.rel = 'noreferrer'; credit.append(link); }
  const items = ingredients(drink);
  $('#ingredients').replaceChildren(...items.map(item => {
    const li = el('li'); const label = el('label'); const check = el('input'); check.type = 'checkbox';
    check.addEventListener('change', () => { $('#check-progress').textContent = `${$('#ingredients').querySelectorAll(':checked').length} / ${items.length} ready`; });
    label.append(check, el('span', 'ingredient-name', item.name), el('span', 'measure', item.measure || 'Not specified')); li.append(label); return li;
  }));
  $('#check-progress').textContent = `0 / ${items.length} ready`;
  if (!items.length) $('#ingredients').append(el('li', 'muted', 'Ingredients not provided.'));
  $('#instructions').textContent = drink.strInstructions || 'Instructions not provided.';
  updateSavedUI();
}
async function openRecipe(id, random = false) {
  const version = ++detailVersion;
  currentDrink = null;
  $('#recipe-content').hidden = true; $('#detail-retry').hidden = true;
  $('#drink-name').textContent = random ? 'A surprise pour' : 'Cocktail recipe';
  $('#detail-status').textContent = random ? 'Finding a surprise pour…' : 'Opening your recipe…';
  if (!$('#recipe-dialog').open) $('#recipe-dialog').showModal();
  retryDetail = () => openRecipe(id, random);
  try {
    const drink = random ? (await request('random.php'))[0] : await lookup(id);
    if (!drink) throw new Error('No recipe was returned. Please try again.');
    cache.set(drink.idDrink, drink);
    if (version === detailVersion && $('#recipe-dialog').open) showDetail(drink);
  } catch (error) {
    if (version !== detailVersion) return;
    $('#detail-status').textContent = error.message; $('#detail-retry').hidden = false;
  }
}
// Bind user actions. Stale async results cannot overwrite a newer view.
$('#search-form').addEventListener('submit', event => { event.preventDefault(); const query = $('#search-input').value.trim(); query ? search(query) : loadHouse(); });
$('#spirits').addEventListener('click', event => { const button = event.target.closest('[data-spirit]'); if (button) loadSpirit(button.dataset.spirit); });
$('#sort').addEventListener('change', renderCards);
$('#saved-nav').onclick = () => showSaved(); $('#saved-view').onclick = () => showSaved(false);
$('#browse-view').onclick = loadHouse; $('#reset-view').onclick = loadHouse;
$('#explore-nav').onclick = () => { if (mode === 'saved') loadHouse(); };
$('#retry').onclick = () => retryAction(); $('#detail-retry').onclick = () => retryDetail?.();
$('#random-hero').onclick = $('#random-bottom').onclick = () => openRecipe(null, true);
$('#save-detail').onclick = () => { if (currentDrink) toggleSave(currentDrink); };
$('#close-dialog').onclick = () => $('#recipe-dialog').close();
$('#recipe-dialog').addEventListener('close', () => { ++detailVersion; currentDrink = null; });
$('#recipe-dialog').addEventListener('click', event => { if (event.target === $('#recipe-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
updateSavedUI();
loadHouse();

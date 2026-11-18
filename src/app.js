import { DEFAULTS, applyFilters, sortEvents, cardHTML, money } from './shared.js';
import { saved as store } from './site.js';

const root = document.getElementById('finder');
if (root) start();

async function start() {
  const form = document.getElementById('filters');
  const results = document.getElementById('results');
  const count = document.getElementById('count');
  const moreBtn = document.getElementById('moreBtn');
  const nearBtn = document.getElementById('nearBtn');
  const nearMsg = document.getElementById('nearMsg');
  const PAGE = 24;
  const BOOL = ['hideStudent', 'beginner', 'ai', 'saved'];
  const NUM = ['minPrize', 'within', 'km'];

  let preset = {};
  try { preset = JSON.parse(document.getElementById('preset').textContent || '{}'); } catch {}
  const base = { ...DEFAULTS, ...preset };
  const state = { ...base };

  // Filters in the page address (so a search can be bookmarked or shared). Location is never put there.
  const params = new URLSearchParams(location.search);
  for (const [k, v] of params) {
    if (!(k in DEFAULTS) || k === 'near') continue;
    state[k] = BOOL.includes(k) ? v === '1' : NUM.includes(k) ? Number(v) || 0 : v.slice(0, 80);
  }

  let saved = store.get();
  let events = [];
  let shown = PAGE;
  let current = [];

  function syncForm() {
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') el.checked = !!state[el.name];
      else el.value = String(state[el.name]);
    }
  }

  function syncUrl() {
    const p = new URLSearchParams();
    for (const k of Object.keys(DEFAULTS)) {
      if (k === 'near') continue;
      if (k === 'km' && !state.near) continue;
      if (state[k] === base[k]) continue;
      p.set(k, BOOL.includes(k) ? (state[k] ? '1' : '0') : String(state[k]));
    }
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  function render() {
    const now = new Date();
    current = sortEvents(applyFilters(events, state, now, saved), state.sort, now);
    const prize = current.reduce((s, e) => s + (e.prizeUsd || 0), 0);
    count.innerHTML = `<b>${current.length.toLocaleString('en-US')}</b> hackathon${current.length === 1 ? '' : 's'}${prize ? ` · <b>${money(prize)}</b> in listed prizes` : ''}`;
    if (!current.length) {
      results.innerHTML = state.saved && !saved.size
        ? '<div class="empty"><b>Your list is empty.</b><p>Tap ☆ Save on any hackathon to keep it here. Then use <b>Download my saved list</b> to put every deadline in your calendar, or see <a href="/calendar/">all calendar options</a>.</p></div>'
        : '<div class="empty"><b>No hackathons match all of that.</b><p>Try a longer deadline, a smaller prize, or fewer filters.</p><p><button type="button" class="btn" data-clear>Clear all filters</button></p></div>';
    } else {
      results.innerHTML = current.slice(0, shown).map((e) => cardHTML(e, now, saved.has(e.id))).join('\n');
    }
    moreBtn.hidden = current.length <= shown;
    if (!moreBtn.hidden) moreBtn.textContent = `Show more (${(current.length - shown).toLocaleString('en-US')} left)`;
    syncChips();
    document.dispatchEvent(new Event('ht:render'));
  }

  // Quick chips mirror the form controls, so phones get one-tap filters.
  const chips = [...document.querySelectorAll('[data-chip]')];
  const chipOn = (c) => { const [k, v] = c.dataset.chip.split('='); return v === undefined ? !!state[k] : String(state[k]) === v; };
  function syncChips() {
    for (const c of chips) c.setAttribute('aria-pressed', String(chipOn(c)));
    const n = countActive();
    const fc = document.getElementById('filterCount');
    if (fc) { fc.textContent = n ? String(n) : ''; fc.hidden = !n; }
  }
  function countActive() {
    let n = 0;
    for (const k of ['mode', 'minPrize', 'within', 'odds', 'source', 'hideStudent', 'beginner', 'ai', 'saved', 'place']) if (state[k] !== DEFAULTS[k]) n++;
    return n + (state.near ? 1 : 0);
  }
  for (const c of chips) c.addEventListener('click', () => {
    const [k, v] = c.dataset.chip.split('=');
    if (v === undefined) state[k] = !state[k];
    else state[k] = chipOn(c) ? DEFAULTS[k] : (typeof DEFAULTS[k] === 'number' ? Number(v) : v);
    shown = PAGE; syncForm(); syncUrl(); render();
  });

  const toggle = document.getElementById('filterToggle');
  const panel = document.getElementById('morePanel');
  if (toggle && panel) toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('open', open);
  });

  // "Download my saved list" is handled in site.js (shared with the /calendar/ page).
  document.addEventListener('ht:saved', () => { saved = store.get(); if (state.saved) render(); else syncChips(); });

  function readForm() {
    for (const el of form.elements) {
      if (!el.name || !(el.name in DEFAULTS)) continue;
      state[el.name] = el.type === 'checkbox' ? el.checked : NUM.includes(el.name) ? Number(el.value) || 0 : el.value;
    }
  }

  let t;
  form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { readForm(); shown = PAGE; syncUrl(); render(); }, 120); });
  form.addEventListener('submit', (ev) => ev.preventDefault());
  results.addEventListener('click', (ev) => { if (ev.target.closest('[data-clear]')) form.reset(); });
  form.addEventListener('reset', (ev) => {
    ev.preventDefault();
    Object.assign(state, base, { near: null });
    nearMsg.hidden = true; nearBtn.textContent = 'Near me'; nearBtn.setAttribute('aria-pressed', 'false');
    shown = PAGE; syncForm(); syncUrl(); render();
  });
  moreBtn.addEventListener('click', () => { shown += PAGE; render(); });

  nearBtn.addEventListener('click', () => {
    if (state.near) {
      state.near = null; nearMsg.hidden = true; nearBtn.textContent = 'Near me'; nearBtn.setAttribute('aria-pressed', 'false');
      shown = PAGE; render(); return;
    }
    nearMsg.hidden = false;
    if (!navigator.geolocation) { nearMsg.textContent = 'Your browser can’t share a location. Type your city in the box instead.'; return; }
    nearMsg.textContent = 'Asking your browser for your location…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.near = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        if (state.mode === 'online') { state.mode = 'any'; syncForm(); }
        nearBtn.textContent = 'Near me ✓'; nearBtn.setAttribute('aria-pressed', 'true');
        shown = PAGE; render();
        nearMsg.textContent = `Showing ${current.length} in-person event${current.length === 1 ? '' : 's'} within ${Math.round(state.km / 1.609)} miles. Only events with a city we can map are included, so also try typing your city. Your location stays on this device.`;
      },
      () => { nearMsg.textContent = 'Location was blocked or unavailable. Type your city in the box instead.'; },
      { maximumAge: 600000, timeout: 10000 }
    );
  });

  syncForm();
  syncChips();
  try {
    const res = await fetch(new URL('../data/events.json', import.meta.url));
    if (!res.ok) throw new Error(res.status);
    events = (await res.json()).events || [];
    render();
  } catch {
    count.insertAdjacentHTML('beforeend', ' <span class="small">(Live filters could not load. Showing the saved top results. Try reloading.)</span>');
  }
}

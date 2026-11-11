import { DEFAULTS, applyFilters, sortEvents, cardHTML, icsFor, money } from './shared.js';

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

  const store = {
    get() { try { return new Set(JSON.parse(localStorage.getItem('ht.saved') || '[]')); } catch { return new Set(); } },
    set(s) { try { localStorage.setItem('ht.saved', JSON.stringify([...s])); return true; } catch { return false; } },
  };
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
        ? '<p class="empty">Your saved list is empty. Press “☆ Save” on any hackathon to keep it here.</p>'
        : '<p class="empty">Nothing matches those filters. Try widening the deadline or prize, or clear the filters.</p>';
    } else {
      results.innerHTML = current.slice(0, shown).map((e) => cardHTML(e, now, saved.has(e.id))).join('\n');
    }
    moreBtn.hidden = current.length <= shown;
    if (!moreBtn.hidden) moreBtn.textContent = `Show more (${(current.length - shown).toLocaleString('en-US')} left)`;
  }

  function readForm() {
    for (const el of form.elements) {
      if (!el.name || !(el.name in DEFAULTS)) continue;
      state[el.name] = el.type === 'checkbox' ? el.checked : NUM.includes(el.name) ? Number(el.value) || 0 : el.value;
    }
  }

  let t;
  form.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { readForm(); shown = PAGE; syncUrl(); render(); }, 120); });
  form.addEventListener('submit', (ev) => ev.preventDefault());
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

  results.addEventListener('click', (ev) => {
    const s = ev.target.closest('[data-save]');
    if (s) {
      const id = s.dataset.save;
      if (saved.has(id)) saved.delete(id); else saved.add(id);
      const ok = store.set(saved);
      const on = saved.has(id);
      s.setAttribute('aria-pressed', String(on));
      s.textContent = on ? '★ Saved' : '☆ Save';
      if (!ok) s.title = 'Saved for this visit only (your browser is blocking storage).';
      if (state.saved) render();
      return;
    }
    const c = ev.target.closest('[data-ics]');
    if (c) {
      const e = events.find((x) => x.id === c.dataset.ics);
      if (!e) return;
      const url = URL.createObjectURL(new Blob([icsFor([e], e.title)], { type: 'text/calendar' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'hackathon-deadline.ics' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  });

  syncForm();
  try {
    const res = await fetch(new URL('../data/events.json', import.meta.url));
    if (!res.ok) throw new Error(res.status);
    events = (await res.json()).events || [];
    render();
  } catch {
    count.insertAdjacentHTML('beforeend', ' <span class="small">(Live filters could not load. Showing the saved top results. Try reloading.)</span>');
  }
}

// Runs on every page: mobile menu, saved stars, calendar downloads, share, compare and live countdowns.
import { icsFor } from './shared.js';
export const saved = {
  get() { try { return new Set(JSON.parse(localStorage.getItem('ht.saved') || '[]')); } catch { return new Set(); } },
  set(s) { try { localStorage.setItem('ht.saved', JSON.stringify([...s])); return true; } catch { return false; } },
};

const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('mainNav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); } });
}

function paintStar(btn, on) {
  btn.setAttribute('aria-pressed', String(on));
  const label = btn.getAttribute('aria-label') || '';
  btn.setAttribute('aria-label', label.replace(/^(Save to|Remove from)/, on ? 'Remove from' : 'Save to'));
  btn.innerHTML = (on ? '★' : '☆') + `<span>${on ? 'Saved' : 'Save'}</span>`;
}
function paintAll() {
  const s = saved.get();
  for (const b of document.querySelectorAll('[data-save]')) paintStar(b, s.has(b.dataset.save));
  const n = document.getElementById('savedCount');
  if (n) { n.textContent = s.size ? String(s.size) : ''; n.hidden = !s.size; }
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-save]');
  if (!b) return;
  const s = saved.get();
  const id = b.dataset.save;
  if (s.has(id)) s.delete(id); else s.add(id);
  const ok = saved.set(s);
  if (!ok) b.title = 'Your browser is blocking storage, so this can’t be kept after you leave.';
  paintAll();
  document.dispatchEvent(new CustomEvent('ht:saved', { detail: { id, on: s.has(id) } }));
});
document.addEventListener('ht:render', paintAll);
paintAll();

// Close any open "Add to calendar" menu when clicking elsewhere.
document.addEventListener('click', (ev) => {
  for (const d of document.querySelectorAll('details.cal[open]')) if (!d.contains(ev.target)) d.removeAttribute('open');
});

// Contact address is assembled here so it never sits in the page source.
for (const el of document.querySelectorAll('[data-mail]')) {
  const addr = ['info', 'eyetoad.com'].join('@');
  const a = document.createElement('a');
  a.href = 'mailto:' + addr; a.textContent = addr;
  el.replaceChildren(a);
}

// Copy-to-clipboard buttons (e.g. the calendar feed link).
for (const b of document.querySelectorAll('[data-copy]')) {
  b.addEventListener('click', async () => {
    const t = document.getElementById(b.dataset.copy)?.textContent || '';
    try { await navigator.clipboard.writeText(t); b.textContent = 'Copied'; }
    catch { const r = document.createRange(); r.selectNodeContents(document.getElementById(b.dataset.copy)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Press Ctrl+C to copy'; }
    setTimeout(() => { b.textContent = 'Copy link'; }, 2500);
  });
}


// ---------- Live countdowns and local times ----------
// [data-left] shows time left (exact when data-end-at is set, else whole days); [data-local] shows a time in the visitor's zone.
function leftText(el) {
  const at = el.dataset.endAt;
  if (at) {
    const ms = Date.parse(at) - Date.now();
    if (ms <= 0) return 'Closed';
    const m = Math.floor(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? `${d}d ${h}h left` : h ? `${h}h ${mm}m left` : `${mm}m left`;
  }
  const end = el.dataset.end;
  if (!end) return el.textContent;
  const d = Math.round((Date.parse(end) - Date.parse(new Date().toISOString().slice(0, 10))) / 864e5);
  return d < 0 ? 'Closed' : d === 0 ? 'Ends today' : d === 1 ? '1 day left' : `${d} days left`;
}
function tick() { for (const el of document.querySelectorAll('[data-left]')) el.textContent = leftText(el); }
tick();
setInterval(tick, 60000);
for (const el of document.querySelectorAll('[data-local]')) {
  try { el.textContent = new Date(el.dataset.local).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) + ' (your time)'; } catch {}
}

// ---------- Calendar file for the saved list ----------
// iPhone/iPad Safari opens a text/calendar data link straight in Calendar; other browsers get a normal file download.
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let allEvents = null;
export async function loadEvents() {
  if (allEvents) return allEvents;
  const res = await fetch(new URL('../data/events.json', import.meta.url));
  if (!res.ok) throw new Error(String(res.status));
  allEvents = (await res.json()).events || [];
  return allEvents;
}
export function openIcs(ics, filename) {
  if (isIOS()) { location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); return; }
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function paintSavedIcs() {
  const n = saved.get().size;
  for (const b of document.querySelectorAll('[data-saved-ics]')) {
    if (b.dataset.always !== undefined) { b.disabled = !n; b.textContent = n ? `Download my saved list (${n}) .ics` : 'Save a hackathon first (☆)'; }
    else b.hidden = !n;
  }
}
document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-saved-ics]');
  if (!b) return;
  const ids = saved.get();
  const msg = document.getElementById(b.dataset.msg || '');
  try {
    const list = (await loadEvents()).filter((e) => ids.has(e.id) && e.end);
    if (!list.length) { if (msg) { msg.hidden = false; msg.textContent = 'None of your saved hackathons has a deadline date yet.'; } return; }
    openIcs(icsFor(list, 'My hackathons'), 'my-hackathons.ics');
    if (msg) { msg.hidden = false; msg.textContent = `${list.length} deadline${list.length === 1 ? '' : 's'} sent to your calendar app. Nothing opened? Check your Downloads folder.`; }
  } catch { if (msg) { msg.hidden = false; msg.textContent = 'Could not load the list right now. Please try again.'; } }
});
document.addEventListener('ht:saved', paintSavedIcs);
document.addEventListener('ht:render', paintSavedIcs);
paintSavedIcs();

// ---------- Share ----------
document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-share]');
  if (!b) return;
  const url = new URL(b.dataset.share, location.origin).href;
  const title = b.dataset.title || document.title;
  const old = b.dataset.label || b.textContent;
  b.dataset.label = old;
  try {
    if (navigator.share) { await navigator.share({ title, url }); return; }
    await navigator.clipboard.writeText(url);
    b.textContent = 'Link copied';
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    b.textContent = 'Copy failed';
  }
  setTimeout(() => { b.textContent = old; }, 2200);
});

// ---------- Quick compare (up to 3) ----------
const cmp = {
  get() { try { return JSON.parse(localStorage.getItem('ht.compare') || '[]').slice(0, 3); } catch { return []; } },
  set(l) { try { localStorage.setItem('ht.compare', JSON.stringify(l.slice(0, 3))); } catch {} },
};
export { cmp };
let bar = null;
function paintCompare() {
  const l = cmp.get();
  for (const c of document.querySelectorAll('[data-compare]')) c.checked = l.includes(c.dataset.compare);
  if (location.pathname.startsWith('/compare/')) return;
  if (!bar && l.length) {
    bar = document.createElement('div');
    bar.className = 'cmp-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Compare hackathons');
    document.body.appendChild(bar);
  }
  if (!bar) return;
  bar.hidden = !l.length;
  bar.innerHTML = `<span><b>${l.length}</b> of 3 picked to compare</span>${l.length >= 2 ? `<a class="btn sm" href="/compare/?ids=${encodeURIComponent(l.join(','))}">Compare side by side</a>` : '<span class="small">Pick one more</span>'}<button type="button" class="link" data-cmp-clear>Clear</button>`;
}
document.addEventListener('change', (ev) => {
  const c = ev.target.closest('[data-compare]');
  if (!c) return;
  let l = cmp.get().filter((x) => x !== c.dataset.compare);
  if (c.checked) {
    if (l.length >= 3) { c.checked = false; c.closest('label')?.setAttribute('title', 'You can compare up to 3. Clear one first.'); return; }
    l.push(c.dataset.compare);
  }
  cmp.set(l); paintCompare();
});
document.addEventListener('click', (ev) => { if (ev.target.closest('[data-cmp-clear]')) { cmp.set([]); if (location.pathname.startsWith('/compare/')) location.assign('/compare/'); else paintCompare(); } });
document.addEventListener('ht:render', paintCompare);
paintCompare();

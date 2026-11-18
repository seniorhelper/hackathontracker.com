// Runs on every page: mobile menu, saved stars, and the contact address.
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

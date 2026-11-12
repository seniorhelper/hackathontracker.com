// Top 50 page: live "days left" and re-sorting. Works without it (the page is fully rendered).
const list = document.getElementById('watchList');
if (list) {
  const today = () => Date.parse(new Date().toISOString().slice(0, 10));
  const daysLeft = (end) => (end ? Math.round((Date.parse(end) - today()) / 864e5) : null);
  const label = (d) => (d == null ? 'Dates TBA' : d < 0 ? 'Closed' : d === 0 ? 'Closes today' : d === 1 ? '1 day left' : `${d} days left`);

  const rows = [...list.querySelectorAll('.w-row')];
  for (const r of rows) {
    const d = daysLeft(r.dataset.end);
    const el = r.querySelector('.left');
    el.textContent = label(d);
    el.classList.toggle('hot', d != null && d >= 0 && d <= 3);
    if (d != null && d < 0) r.classList.add('closed');
  }

  const n = (v) => (v === '' ? null : Number(v));
  const nullLast = (a, b, dir = 1) => (a == null && b == null ? 0 : a == null ? 1 : b == null ? -1 : (a - b) * dir);
  const SORT = {
    prize: (a, b) => n(b.dataset.prize) - n(a.dataset.prize),
    soon: (a, b) => nullLast(daysLeft(a.dataset.end), daysLeft(b.dataset.end)),
    per: (a, b) => nullLast(n(a.dataset.per), n(b.dataset.per), -1),
    quiet: (a, b) => nullLast(n(a.dataset.reg), n(b.dataset.reg)),
  };
  const btns = [...document.querySelectorAll('[data-sort]')];
  for (const b of btns) {
    b.addEventListener('click', () => {
      const sorted = [...rows].sort((x, y) => (x.classList.contains('closed') - y.classList.contains('closed')) || SORT[b.dataset.sort](x, y) || SORT.prize(x, y));
      sorted.forEach((r, i) => { r.querySelector('.w-rank').textContent = i + 1; list.appendChild(r); });
      for (const o of btns) o.setAttribute('aria-pressed', String(o === b));
    });
  }
}

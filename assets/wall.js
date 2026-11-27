// Entry wall: search and filter by hackathon. ?h=<hackathon id> preselects one (links from the Top 50).
const listEl = document.getElementById('wallList');
if (listEl) {
  const q = document.getElementById('wallQ');
  const h = document.getElementById('wallH');
  const count = document.getElementById('wallCount');
  const empty = document.getElementById('wallEmpty');
  const cards = [...listEl.querySelectorAll('.entry')];

  const pre = new URLSearchParams(location.search).get('h');
  if (pre && [...h.options].some((o) => o.value === pre)) h.value = pre;
  else if (pre) h.dataset.none = '1';

  function apply() {
    const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const c of cards) {
      const ok = (!h.value || c.dataset.h === h.value) && !h.dataset.none && terms.every((t) => c.dataset.text.includes(t));
      c.hidden = !ok;
      if (ok) shown++;
    }
    count.innerHTML = `<b>${shown}</b> project${shown === 1 ? '' : 's'}${h.value || terms.length || h.dataset.none ? ' match' + (shown === 1 ? 'es' : '') : ' on the wall'}`;
    empty.hidden = shown > 0;
  }
  q.addEventListener('input', apply);
  h.addEventListener('change', () => { delete h.dataset.none; apply(); });
  apply();
}

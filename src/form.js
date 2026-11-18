// Entry-wall and contact forms. Sends through lead-send.js (our own lead server at clients.eyetoad.com),
// with a honeypot, a short time trap and a real-interaction check, then shows an honest sent / failed state.
const PHONE = '1-800-481-8638';
const MIN_MS = 3000;

for (const form of document.querySelectorAll('form[data-lead]')) {
  const loaded = Date.now();
  let touched = false;
  const arm = (ev) => { if (ev.isTrusted) touched = true; };
  form.addEventListener('keydown', arm);
  form.addEventListener('pointerdown', arm);

  // ?hackathon=Name pre-fills the hackathon box (links from the Top 50 and event pages).
  const pre = new URLSearchParams(location.search).get('hackathon');
  const hk = form.elements.namedItem('hackathon');
  if (pre && hk && !hk.value) hk.value = pre.slice(0, 120);

  const status = form.querySelector('.form-status');
  const btn = form.querySelector('[type=submit]');
  const btnText = btn ? btn.textContent : '';
  const show = (cls, html) => { status.className = 'form-status ' + cls; status.innerHTML = html; status.hidden = false; status.focus?.(); };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); // stops lead-send.js's generic handler; this script sends instead
    if (!touched) { show('bad', 'Please fill in the form by tapping or typing in it, then press the button again.'); return; }
    if (Date.now() - loaded < MIN_MS) { show('bad', 'That was quick. Please check your details and press the button again.'); return; }
    if (typeof window.etaLeadSend !== 'function') { fail(); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    status.hidden = true;
    try {
      await window.etaLeadSend(new FormData(form));
      const done = document.createElement('div');
      done.className = 'form-status ok'; done.setAttribute('role', 'status'); done.tabIndex = -1;
      done.innerHTML = form.dataset.okHtml || '<b>Sent.</b> Thanks, we got it.';
      form.replaceWith(done);
      done.focus();
    } catch { fail(); }
  });

  // On failure nothing typed is lost: the form stays filled in so the visitor can retry or call.
  function fail() {
    if (btn) { btn.disabled = false; btn.textContent = btnText; }
    show('bad', `<b>That did not send.</b> Your details are still filled in below, so you can press the button again in a moment. Or call us at <a href="tel:+18004818638">${PHONE}</a>.`);
  }
}

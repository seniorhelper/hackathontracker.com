// /compare/?ids=a,b,c — up to 3 hackathons side by side. Reads the same events.json as the search.
import { esc, money, fmtDate, whereText, countdown, eventPath, gcalUrl, teamText, oddsWhy, REG_LABEL, dateRange } from './shared.js';
import { loadEvents, cmp } from './site.js';

const box = document.getElementById('compare');
if (box) run();

async function run() {
  const fromUrl = (new URLSearchParams(location.search).get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ids = (fromUrl.length ? fromUrl : cmp.get()).slice(0, 3);
  let events = [];
  try { events = await loadEvents(); } catch { box.innerHTML = '<p>Could not load the listings. Please reload the page.</p>'; return; }
  const list = ids.map((id) => events.find((e) => e.id === id)).filter(Boolean);
  if (list.length < 2) {
    box.innerHTML = `<div class="empty"><b>Pick 2 or 3 hackathons to compare.</b><p>Tick <strong>Compare</strong> on any card in the <a href="/">search</a>, then come back here.</p>${list.length ? `<p class="small">You have picked: ${esc(list[0].title)}</p>` : ''}</div>`;
    return;
  }
  const now = new Date();
  const ODDS = { strong: 'Strong odds', fair: 'Fair odds', crowded: 'Crowded' };
  const ELIG = { everyone: 'Open to everyone', students: 'Students only', 'high-school': 'High school students' };
  const rows = [
    ['Time left', (e) => esc(countdown(e, now).text)],
    ['Deadline', (e) => (e.end ? esc(fmtDate(e.end)) : '')],
    ['Dates', (e) => esc(dateRange(e))],
    ['Prize pool', (e) => (e.prizeUsd ? `<b>${money(e.prizeUsd)}</b>` : esc(e.prizeText || ''))],
    ['Signed up', (e) => (e.registrants != null ? e.registrants.toLocaleString('en-US') : '')],
    ['Prize per entrant', (e) => (e.perReg != null ? `${money(e.perReg)}` : '')],
    ['Odds', (e) => (e.oddsTier ? `<span class="badge odds-${e.oddsTier}" title="${esc(oddsWhy(e))}">${ODDS[e.oddsTier]}</span>` : '')],
    ['Where', (e) => esc(whereText(e))],
    ['Organizer', (e) => esc(e.organizer || '')],
    ['Registration', (e) => (e.regStatus ? REG_LABEL[e.regStatus] : '')],
    ['Who can enter', (e) => esc([ELIG[e.eligibility], e.eligibilityNote, e.inviteOnly ? 'Invite only' : ''].filter(Boolean).join(' · '))],
    ['Team size', (e) => esc(teamText(e))],
    ['Themes', (e) => (e.themes || []).slice(0, 6).map((t) => `<span class="tag">${esc(t)}</span>`).join(' ')],
    ['Listed on', (e) => esc(e.sourceLabel)],
  ];
  const cell = (v) => v || '<span class="small">Not listed</span>';
  box.innerHTML = `<div class="cmp-scroll"><table class="cmp-table"><thead><tr><th scope="col"><span class="sr">Detail</span></th>${list.map((e) => `<th scope="col"><a href="${eventPath(e)}">${esc(e.title)}</a></th>`).join('')}</tr></thead>
<tbody>${rows.map(([k, f]) => `<tr><th scope="row">${k}</th>${list.map((e) => `<td>${cell(f(e))}</td>`).join('')}</tr>`).join('')}
<tr><th scope="row">Links</th>${list.map((e) => { const g = gcalUrl(e); return `<td><a class="btn sm" href="${esc(e.url)}" rel="noopener" target="_blank">Official page ↗</a>${g ? ` <a class="btn sm ghost" href="${esc(g)}" rel="noopener" target="_blank">Google Calendar</a> <a class="btn sm ghost" href="${eventPath(e)}deadline.ics">Apple / Outlook</a>` : ''}</td>`; }).join('')}</tr>
</tbody></table></div>
<p class="small">Tip: “Prize per entrant” is the total cash prize divided by sign-ups. <a href="/methodology/">How the odds work</a>. <button type="button" class="link" data-cmp-clear>Clear my picks</button></p>`;
}

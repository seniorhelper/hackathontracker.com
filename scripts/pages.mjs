// All hand-written page copy lives here so the wording is easy to change in one place.

export const COPY = {
  name: 'Hackathon Tracker',
  homeTitle: 'Hackathon Tracker: Find Hackathons Ranked by Your Odds of Winning',
  homeDesc: 'Search open and upcoming hackathons from many platforms in one place. Filter by prize, deadline, city or online, hide student-only events, and see the prize money per entrant.',
  h1: 'Find a hackathon<br>you can actually win.',
  lede: 'Every open hackathon in one search, ranked by prize money per entrant.',
  llms: ({ SITE, stats, money, posts, PAGES, updatedText }) => `# Hackathon Tracker

> Hackathon Tracker (${SITE}) is a free, independent search engine for open and upcoming hackathons. It merges public listings from several hackathon platforms plus hand-checked organizer pages, removes duplicates and ended events, and ranks events by listed cash prize per person signed up ("prize per entrant"). No account is needed.

Data is rebuilt daily. Last refresh: ${updatedText}. ${stats.total.toLocaleString('en-US')} open or upcoming hackathons, ${money(stats.prizeTotal)} in listed US-dollar prizes. Organizer pages are always the authority on dates, rules and prizes.

## Search and lists
- [Search all hackathons](${SITE}/): filters for online or in person, city or country, minimum prize, deadline window, odds, beginner, AI and student-only events. Query parameters work, for example ${SITE}/?q=ai&mode=online&minPrize=10000
- [Top 50 by prize money](${SITE}/top-50/)
${PAGES.map((p) => `- [${p.h1}](${SITE}/${p.slug}/)`).join('\n')}
- Each hackathon has its own page at ${SITE}/hackathons/<slug>/ with deadline, prize, sign-ups, eligibility and a per-event calendar file at ${SITE}/hackathons/<slug>/deadline.ics

## Calendar and feeds (free, no account)
- [All upcoming deadlines, iCalendar feed](${SITE}/calendar.ics): one all-day event per deadline, refreshed daily. Subscribe with webcal://${SITE.replace(/^https:\/\//, '')}/calendar.ics
- [Prize hackathon deadlines, iCalendar](${SITE}/feeds/deadlines.ics)
- [Newly listed hackathons, RSS](${SITE}/feeds/new.xml)
- [Hackathons with strong odds, RSS](${SITE}/feeds/best-odds.xml)
- [Machine-readable listings, JSON](${SITE}/data/events.json)

## Method
- [How prize per entrant and the odds badges work](${SITE}/methodology/)
- [Sources and data status](${SITE}/sources/)

## Guides
${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}/): ${p.description}`).join('\n')}

## About
- [About](${SITE}/about/) · [Contact](${SITE}/contact/) · [Privacy Policy](${SITE}/privacy/) · [Terms of Use](${SITE}/terms/)
`,
  homeBelow: ({ stats, money, cut }) => `
<h2>Why sort hackathons by odds?</h2>
<p>Most lists sort by date. That tells you when a hackathon ends, not whether it is worth entering. Two events can offer the same prize money while one has a few hundred people signed up and the other has tens of thousands. Your chances are not the same, and no date sort will show you that.</p>
<p>So where a listing gives us both numbers, we divide the cash prize by the number of people signed up and show it on the card as <strong>prize per entrant</strong>. Right now ${stats.withOdds} of the ${stats.total.toLocaleString('en-US')} hackathons here have enough data to score.${cut.strong ? ` The top third offer ${money(cut.strong)} or more per entrant and get a “Strong odds” badge.` : ''} <a href="/methodology/">Here is exactly how the number is worked out</a>, including what it can’t tell you.</p>
<h2>What you can do here</h2>
<ul>
<li><strong>Search everything at once.</strong> Listings are pulled from several hackathon platforms and duplicates are merged, with a link back to the original page.</li>
<li><strong>Filter to what fits you.</strong> Online or in person, a city or country, minimum prize, deadline window, beginner friendly, AI, or hide events that are for students only.</li>
<li><strong>Keep a shortlist.</strong> Hit Save on any card. Your list stays in your browser. There is no account and nothing to sign up for.</li>
<li><strong>Never miss a deadline.</strong> Add any deadline to your calendar in one click, or <a href="/alerts/">subscribe to the feeds</a> to hear about new listings.</li>
</ul>
<h2>Start with one of these</h2>
<ul>
<li><a href="/top-50/">The top 50 hackathons by prize money, live</a></li>
<li><a href="/submissions/">The entry wall: projects builders posted</a></li>
<li><a href="/best-odds/">Hackathons with the best odds right now</a></li>
<li><a href="/open-to-everyone/">Hackathons you can enter without a student ID</a></li>
<li><a href="/online-hackathons/">Online hackathons you can join from anywhere</a></li>
<li><a href="/closing-soon/">Deadlines in the next 7 days</a></li>
<li><a href="/biggest-prizes/">The biggest prize pools open today</a></li>
<li><a href="/beginner-hackathons/">Beginner-friendly hackathons</a></li>
</ul>`,
};

export const PAGES = [
  {
    slug: 'best-odds', hook: 'The most prize money per person signed up.', preset: { odds: 'strong', sort: 'best' },
    title: 'Hackathons With the Best Odds Right Now | Hackathon Tracker',
    description: 'Open hackathons ranked by prize money per person signed up. The top third by odds, refreshed daily, with deadlines and links to enter.',
    h1: 'Hackathons with the best odds right now',
    intro: 'These are the open hackathons with the most prize money for each person signed up. Fewer entrants chasing the same pot is the simplest edge there is.',
    below: `<h2>How to read this list</h2>
<p>“Per entrant” is the total cash prize divided by the number of people signed up today. It is a rough guide, not a promise. Sign-ups keep climbing until the deadline, and at most events plenty of people who sign up never submit anything, which works in your favour.</p>
<p>A good habit: check this page early in a hackathon’s run, save the ones that suit your skills, then look again a week before the deadline to see how crowded each one became. <a href="/methodology/">Full method and limits</a>.</p>`,
  },
  {
    slug: 'online-hackathons', hook: 'Join from anywhere. Most run for weeks.', preset: { mode: 'online' },
    title: 'Online Hackathons Open Now (Virtual, Join From Anywhere) | Hackathon Tracker',
    description: 'Every online and virtual hackathon we track that is open or upcoming, with prize money, sign-up counts and deadlines. Filter by prize, topic or odds.',
    h1: 'Online hackathons open now',
    intro: 'Virtual hackathons you can enter from your couch. Most run for weeks rather than a weekend, which suits anyone with a day job.',
    below: `<h2>Online vs. in person</h2>
<p>Online hackathons usually give you more time and bigger prize pools, but they also draw bigger crowds because anyone in the world can enter. That is where the odds column earns its keep: sort by “Best odds first” or “Fewest competitors” to find the quieter ones.</p>
<p>If meeting people is the main goal, an event in a room still beats a Discord server. Try the <a href="/in-person-hackathons/">in-person list</a> and type your city.</p>`,
  },
  {
    slug: 'in-person-hackathons', hook: 'Real rooms, soonest first.', preset: { mode: 'in-person', sort: 'soon' },
    title: 'In-Person Hackathons Near You | Hackathon Tracker',
    description: 'Upcoming in-person hackathons by date. Type a city or country, or use Near me, to find events you can actually get to.',
    h1: 'In-person hackathons',
    intro: 'Hackathons that happen in a real room, soonest first. Type your city in the box, or tap Near me.',
    below: `<h2>Finding one close to home</h2>
<p>Type a city, state or country in the “City or country” box. The Near me button uses your browser’s location to show events within the distance you choose. Your location stays in your browser and is never sent to us.</p>
<p>Near me only works for events whose city we can place on a map, so if it comes up short, try typing your city or the nearest big one. Many in-person events are run by universities, so check the badge on each card to see whether it is students only.</p>`,
  },
  {
    slug: 'ai-hackathons', hook: 'Agents, LLMs and ML, with the odds side by side.', preset: { ai: true },
    title: 'AI Hackathons Open Now | Hackathon Tracker',
    description: 'Open and upcoming AI hackathons: agents, LLMs, generative AI and machine learning. See prize pools, sign-up counts and odds side by side.',
    h1: 'AI hackathons open now',
    intro: 'Agent, LLM and machine-learning hackathons that are open or coming up. Company-sponsored AI events tend to carry the biggest prizes and the biggest crowds, so check the odds.',
    below: `<h2>Picking an AI hackathon</h2>
<p>Many AI hackathons are run by a company that wants people building on its model or platform. Read the rules for which tools are required, because a great project on the wrong stack is not eligible. Prizes are sometimes paid partly in platform credits rather than cash, so look at the prize breakdown on the official page before you commit.</p>
<p>An event counts as AI here when its title or topic tags mention AI, machine learning, LLMs, agents or a major model by name.</p>`,
  },
  {
    slug: 'beginner-hackathons', hook: 'Tagged beginner friendly by the organizers.', preset: { beginner: true },
    title: 'Beginner-Friendly Hackathons Open Now | Hackathon Tracker',
    description: 'Hackathons tagged beginner friendly by their organizers, open or upcoming. A live list, not a stale roundup, with deadlines and prize details.',
    h1: 'Beginner-friendly hackathons',
    intro: 'Every hackathon here was tagged beginner friendly by the people running it. This list rebuilds itself daily, so nothing on it has already closed.',
    below: `<h2>First hackathon?</h2>
<p>Pick one with a deadline at least two weeks out, a topic you already care about, and rules you can read in five minutes. You do not need a team to start. A small working demo with a clear two-minute video beats an ambitious idea that does not run.</p>
<p>We only show the beginner tag when the organizer set it themselves. Plenty of untagged events welcome first-timers too, so it is worth browsing <a href="/online-hackathons/">online hackathons</a> as well.</p>`,
  },
  {
    slug: 'open-to-everyone', hook: 'Student-only events filtered out.', preset: { hideStudent: true },
    title: 'Hackathons for Adults and Non-Students | Hackathon Tracker',
    description: 'Hackathons with the student-only and high-school-only events filtered out. For working adults, career changers, indie builders and anyone without a student ID.',
    h1: 'Hackathons you can enter without a student ID',
    intro: 'A lot of hackathons are for enrolled students only. This list removes the ones we know are student-only or high-school-only, so you stop clicking into events you cannot enter.',
    below: `<h2>What this filter does and does not do</h2>
<p>We hide events from sources that are for students or high schoolers, and any listing marked that way. What is left is open to the public as far as we can tell, but organizers set their own rules on age, country and employer. Always read the eligibility section on the official page before you start building.</p>
<p>Company-run online hackathons are usually the most open to working adults. Sort by <a href="/best-odds/">best odds</a> to find ones that are not swamped.</p>`,
  },
  {
    slug: 'biggest-prizes', hook: '$10,000 or more, largest pot first.', preset: { sort: 'prize', minPrize: 10000 },
    title: 'Biggest Hackathon Prizes Open Now ($10,000+) | Hackathon Tracker',
    description: 'Open hackathons with $10,000 or more in listed cash prizes, largest first, with the number of people signed up for each.',
    h1: 'The biggest hackathon prizes open now',
    intro: 'Every open hackathon with at least $10,000 in listed prizes, largest pot first. Look at the sign-up count next to each one before you get excited.',
    below: `<h2>Big pot, big crowd</h2>
<p>The headline number is the whole prize pool, usually split across many places and categories. First place is often a fraction of it. Large pools also pull in thousands of entrants, so a mid-sized prize with a small field can be the better bet. Compare the “per entrant” figure across cards to see it.</p>
<p>We only count prizes listed in US dollars. Events that list prizes in other currencies, or as credits and swag, show the organizer’s own wording instead.</p>`,
  },
  {
    slug: 'closing-soon', hook: 'Deadlines landing this week.', preset: { within: 7, sort: 'soon' },
    title: 'Hackathon Deadlines This Week | Hackathon Tracker',
    description: 'Hackathons whose submission or event date falls in the next 7 days, soonest first. Good for a last-minute entry or a final check on your shortlist.',
    h1: 'Hackathons closing in the next 7 days',
    intro: 'Deadlines landing this week, soonest first. Some are worth a sprint, especially the ones where few people have signed up.',
    below: `<h2>Is a last-minute entry worth it?</h2>
<p>Sometimes. If the build is small and the field is thin, a focused few days can place. Check the official page for the exact closing time and time zone, since we show the date only, and leave an hour for the submission form and video upload.</p>`,
  },
];

export function staticPages({ stats, status, money, esc, fmtDate, updatedText, cut, today }) {
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const rows = status.map((s) => ({ ...s, label: cap(s.label) })).map((s) => `<tr><td>${s.homepage ? `<a href="${esc(s.homepage)}" rel="noopener" target="_blank">${esc(s.label)}</a>` : esc(s.label)}</td><td>${s.ok ? (s.note ? 'Using last good copy' : 'Working') : 'Not available today'}</td><td>${s.count.toLocaleString('en-US')}</td></tr>`).join('');
  return [
    {
      path: '/methodology/', title: 'How the Odds Are Calculated | Hackathon Tracker',
      description: 'The exact formula behind prize per entrant and the Strong, Fair and Crowded badges, plus what the number cannot tell you.',
      h1: 'How the odds work',
      html: `<p>We would rather show you a simple number you can check than a clever score you have to trust. Here is all of it.</p>
<h2>Prize per entrant</h2>
<p><strong>Prize per entrant = total listed cash prize ÷ number of people signed up.</strong></p>
<p>A hackathon with $20,000 in prizes and 400 people signed up shows $50 per entrant. One with $20,000 and 8,000 people shows $2.50. Same pot, very different field.</p>
<h2>The badges</h2>
<p>We rank every hackathon that has both numbers, then split the ranking into thirds:</p>
<table><thead><tr><th>Badge</th><th>Meaning</th><th>Today’s cut-off</th></tr></thead><tbody>
<tr><td>Strong odds</td><td>Top third by prize per entrant</td><td>${cut.strong != null ? money(cut.strong) + ' or more' : 'n/a'}</td></tr>
<tr><td>Fair odds</td><td>Middle third</td><td>${cut.fair != null ? money(cut.fair) + ' or more' : 'n/a'}</td></tr>
<tr><td>Crowded</td><td>Bottom third</td><td>below that</td></tr>
<tr><td>Just opened</td><td>Fewer than 10 sign-ups so far, too early to score</td><td></td></tr>
</tbody></table>
<p>The cut-offs move every day because they are relative to what is open. Today ${stats.withOdds} of ${stats.total.toLocaleString('en-US')} listings have both a US-dollar prize and a sign-up count. The rest show no badge, because we will not guess.</p>
<h2>What the number cannot tell you</h2>
<ul>
<li><strong>Sign-ups are not submissions.</strong> Many people who register never submit a project. Real competition is usually smaller than the count suggests.</li>
<li><strong>Sign-ups grow.</strong> A hackathon that looks quiet in week one can be busy by the deadline. Check back before you commit.</li>
<li><strong>The pot is split.</strong> The total is spread across places, tracks and sponsor prizes. Read the breakdown on the official page.</li>
<li><strong>Cash and credits get mixed.</strong> Some organizers count platform credits or products in their headline figure. We use the number as the platform lists it.</li>
<li><strong>It says nothing about quality.</strong> Judging, mentors and the people you would meet do not show up in a division sum.</li>
</ul>
<h2>Other labels</h2>
<p><strong>Students only</strong> and <strong>High school</strong> appear when the source is a student or high-school programme, or the listing says so. <strong>Beginner friendly</strong> appears only when the organizer tagged the event that way. If a card shows no eligibility badge, we do not know, and you should check the rules.</p>
<h2>Where listings come from</h2>
<p>We read public listings from the platforms on the <a href="/sources/">sources page</a>, merge duplicates that appear on more than one site, drop anything that has already ended, and link every card to the original page. The data is rebuilt once a day. If something is wrong, the organizer’s own page is always the authority.</p>`,
    },
    {
      path: '/sources/', title: 'Sources and Data Status | Hackathon Tracker',
      description: 'Which hackathon platforms Hackathon Tracker reads, how many listings each returned in the latest refresh, and when the data was last updated.',
      h1: 'Sources and data status',
      html: `<p>Last refresh: <strong>${esc(updatedText)}</strong>. ${stats.total.toLocaleString('en-US')} open or upcoming hackathons after merging ${stats.merged} duplicates.</p>
<table><thead><tr><th>Source</th><th>Status</th><th>Listings read</th></tr></thead><tbody>${rows}</tbody></table>
<p>Counts are listings read before duplicates and ended events are removed. If a source is unavailable on a given day we keep showing its last good copy for up to a week, then drop it until it is back.</p>
<p>We only read pages that are public and that the site’s robots rules allow, we identify ourselves when we do, and we link every listing back to where it came from. If you run one of these platforms and want something changed, the listing owner’s wishes win.</p>`,
    },
    {
      path: '/alerts/', title: 'Hackathon Calendar: Subscribe to Every Deadline Free | Hackathon Tracker',
      description: 'Subscribe to a free hackathon deadline calendar in Google, Apple or Outlook, download your saved hackathons as an .ics file, or follow the new-listing feeds.',
      h1: 'Every hackathon deadline,<br>in your calendar.',
      lede: 'Subscribe once. It updates itself every day.',
      html: `<div class="subscribe" id="subscribe">
<h2>Subscribe to the deadline calendar</h2>
<p>One all-day event on each hackathon’s deadline day, with the prize, the location and a link to the official page. It stays current on its own.</p>
<p class="ctas"><a class="btn" href="https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2Fhackathontracker.com%2Fcalendar.ics" rel="noopener" target="_blank">Google Calendar</a><a class="btn ghost" href="webcal://hackathontracker.com/calendar.ics">Apple Calendar</a><a class="btn ghost" href="webcal://hackathontracker.com/calendar.ics">Outlook</a><a class="btn ghost" href="/calendar.ics" download>Download .ics</a></p>
<p class="copyrow"><code id="feedUrl">https://hackathontracker.com/calendar.ics</code> <button type="button" class="btn ghost sm" data-copy="feedUrl">Copy link</button></p>
<p class="small">Google Calendar on the web: Other calendars → From URL, then paste the link. Outlook on the web: Add calendar → Subscribe from web. Apple Calendar: File → New Calendar Subscription. Calendar apps check for changes on their own schedule, from every few hours to about a day.</p>
</div>
<h2>Only the hackathons you care about</h2>
<p>Tap the ☆ on any hackathon to save it. Your list lives in this browser, with no account. Then press <strong>Download my list (.ics)</strong> above the results to get one calendar file with every saved deadline, or open your list from <a href="/?saved=1">★ My list</a> in the top bar.</p>
<p>Every hackathon also has its own <strong>Add to calendar</strong> button with a Google Calendar link and an .ics file for Apple Calendar and Outlook.</p>
<h2>Feeds for new listings</h2>
<p>These work in any feed reader, and in tools that turn a feed into an email or chat message.</p>
<ul>
<li><a href="/feeds/new.xml">Newly listed hackathons (RSS)</a></li>
<li><a href="/feeds/best-odds.xml">Hackathons with strong odds (RSS)</a></li>
<li><a href="/feeds/deadlines.ics">Prize hackathons only (calendar)</a></li>
</ul>
<h2>Good to know</h2>
<p>Deadlines show as all-day events because most listings give a date, not a time. The official page has the exact closing time and time zone. Always check it before submission day.</p>`,
    },
    {
      path: '/about/', title: 'About Hackathon Tracker',
      description: 'Hackathon Tracker is an independent search engine for hackathons, built to answer one question: which one is worth entering?',
      h1: 'About Hackathon Tracker',
      html: `<p>Hackathon Tracker exists to answer one question: <strong>which hackathon is worth entering?</strong></p>
<p>Listings are scattered across a dozen platforms, most lists are sorted by date, and none of them tell you how crowded an event is compared with its prize money. So this site pulls the public listings into one search, works out the prize per entrant where the numbers exist, and lets you filter down to the ones that fit you, whether you are a student, a working adult or somewhere in between.</p>
<p>It is free, there is no account, and every listing links straight to the organizer’s page. The site is supported by advertising. We are independent and not affiliated with any platform or organizer listed here.</p>
<p>Want deadlines without checking back? <a href="/alerts/">Subscribe to the calendar</a>. Found a mistake or a hackathon we’re missing? <a href="/contact/">Tell us</a>.</p>
<p>Read <a href="/methodology/">how the odds work</a>, see <a href="/sources/">where the data comes from</a>, or go <a href="/">find a hackathon</a>.</p>`,
    },
    {
      path: '/privacy/', title: 'Privacy Policy | Hackathon Tracker',
      description: 'How Hackathon Tracker handles data: no accounts, your saved list stays in your browser, Google AdSense advertising cookies, and how to opt out.',
      h1: 'Privacy Policy',
      html: `<p class="small">Last updated ${fmtDate(today)}.</p>
<p>This policy explains what information is collected when you use hackathontracker.com (“the site”), how it is used, and the choices you have.</p>
<h2>What we collect</h2>
<ul>
<li><strong>No accounts.</strong> You can search, filter and save hackathons without signing up or giving us your name or email.</li>
<li><strong>Forms.</strong> If you post a project to the entry wall or use the contact form, what you type is emailed to us through FormSubmit, a form-delivery service. We use it only to review your entry or answer you. For entry-wall posts we publish only the project details you chose to share. Your email address is never published. Ask us at any time to remove your entry or delete your message.</li>
<li><strong>Your saved list</strong> is stored in your own browser (local storage) and never sent to us. Clearing your browser data removes it.</li>
<li><strong>Near me</strong> asks your browser for your location only when you press the button. The distance math happens on your device, and your location is never sent to us or put in the page address.</li>
<li><strong>Server logs.</strong> Like any website, our hosting provider may keep standard request logs, such as IP address, browser type and the pages requested, for security and reliability.</li>
</ul>
<h2>Advertising and cookies</h2>
<p>The site shows ads served by Google AdSense, which helps keep it free. Google and its partners are third-party vendors that use cookies, web beacons and similar technologies to serve ads based on your prior visits to this site and other websites.</p>
<ul>
<li>Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet.</li>
<li>You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" rel="noopener" target="_blank">Google Ads Settings</a> (adssettings.google.com).</li>
<li>You can also opt out of some third-party vendors’ use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/" rel="noopener" target="_blank">www.aboutads.info</a> (US) or <a href="https://www.youronlinechoices.eu/" rel="noopener" target="_blank">youronlinechoices.eu</a> (EU).</li>
<li>Learn more in <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">How Google uses information from sites or apps that use its services</a> and <a href="https://policies.google.com/technologies/ads" rel="noopener" target="_blank">How Google uses cookies in advertising</a>.</li>
</ul>
<p>Where the law requires it, for example in the European Economic Area, the UK and Switzerland, you will be asked for consent before personalized ads are shown, and you can change your choice at any time. You can also block or delete cookies in your browser settings. Ads may then be less relevant, but the site still works.</p>
<p>We do not set our own analytics or tracking cookies, and we do not sell personal information.</p>
<h2>Links to other sites</h2>
<p>Hackathon listings link to organizers’ and platforms’ websites. Those sites have their own privacy policies, and we are not responsible for them.</p>
<h2>Children</h2>
<p>The site is a general-audience directory and is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has sent us information, <a href="/contact/">contact us</a> and we will delete it.</p>
<h2>Your rights and choices</h2>
<p>Depending on where you live, you may have the right to access, correct or delete personal information we hold about you, or to object to how it is used. <a href="/contact/">Contact us</a> and we will respond within a reasonable time.</p>
<h2>Changes</h2>
<p>If this policy changes, the updated version will be posted on this page with a new date.</p>`,
    },
    {
      path: '/terms/', title: 'Terms of Use | Hackathon Tracker',
      description: 'The terms for using Hackathon Tracker: listings are provided as-is, always check official rules, entry-wall content and links to other websites.',
      h1: 'Terms of Use',
      html: `<p class="small">Last updated ${fmtDate(today)}.</p>
<p>By using hackathontracker.com (“the site”) you agree to these terms. If you do not agree, please do not use the site.</p>
<h2>Listings are information, not advice</h2>
<p>Hackathon details are gathered from public listings and organizers’ pages and refreshed once a day. They can be incomplete, out of date or wrong. The organizer’s official page and rules are always the authority on dates, eligibility, prizes and judging. Check them before you register, build or submit. Prize-per-entrant figures and odds badges are simple estimates, not predictions or guarantees.</p>
<h2>No affiliation</h2>
<p>The site is independent. We are not affiliated with, endorsed by or responsible for the hackathons, organizers or platforms listed, and we do not run the events. Questions about an event go to its organizer.</p>
<h2>Entry wall and submissions</h2>
<p>When you post a project you confirm that you are on the team that built it, that the links are yours, and that posting does not break your hackathon’s rules. You keep ownership of your project. You give us permission to show the details you submitted on the site. We review entries by hand and may decline or remove any entry. Ask us at any time to take yours down.</p>
<h2>Acceptable use</h2>
<p>Please don’t misuse the site: no attempts to disrupt it, overload it, or submit spam, malware or content you don’t have the right to share. Reasonable automated access that respects robots.txt is welcome.</p>
<h2>Advertising</h2>
<p>The site shows third-party ads, including Google AdSense. Ads are provided by third parties and are not endorsements. See the <a href="/privacy/">Privacy Policy</a> for how advertising cookies work.</p>
<h2>Links</h2>
<p>Links to other websites are provided for convenience. We don’t control those sites and are not responsible for their content or practices.</p>
<h2>No warranty and limits on liability</h2>
<p>The site is provided “as is” and “as available”, without warranties of any kind. To the fullest extent allowed by law, we are not liable for any loss arising from your use of the site or reliance on its listings, including missed deadlines, ineligible entries or prize decisions made by organizers.</p>
<h2>Changes</h2>
<p>We may update these terms. The current version is always on this page.</p>
<p>Questions? <a href="/contact/">Contact us</a>.</p>`,
    },
    {
      path: '/contact/', title: 'Contact Hackathon Tracker',
      description: 'Contact Hackathon Tracker: report a wrong listing, suggest a hackathon we are missing, ask about the entry wall or advertising.',
      h1: 'Contact us',
      lede: 'Wrong listing, missing hackathon, or a question? Send it here.',
      html: `<form class="filters subform" method="POST" action="https://formsubmit.co/info@eyetoad.com" accept-charset="UTF-8">
  <input type="hidden" name="_subject" value="Hackathon Tracker: contact form">
  <input type="hidden" name="_next" value="https://hackathontracker.com/contact/thanks/">
  <input type="hidden" name="_template" value="table">
  <label class="hp" aria-hidden="true">Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>
  <div class="row">
    <label><span>Your name</span><input type="text" name="name" required maxlength="80" placeholder="Your name" autocomplete="name"></label>
    <label><span>Your email</span><input type="email" name="email" required maxlength="120" placeholder="you@example.com" autocomplete="email"></label>
  </div>
  <label class="full"><span>Topic</span><select name="topic"><option>Wrong or outdated listing</option><option>Suggest a hackathon</option><option>Entry wall</option><option>Advertising</option><option>Something else</option></select></label>
  <label class="full"><span>Message</span><textarea name="message" required maxlength="3000" rows="6" placeholder="Include the hackathon name and link if it’s about a listing."></textarea></label>
  <p><button class="btn" type="submit">Send message</button></p>
  <p class="small">We use your email only to reply. See the <a href="/privacy/">Privacy Policy</a>.</p>
</form>
<h2>Prefer email?</h2>
<p>Write to <span data-mail>our inbox (turn on JavaScript to see the address)</span>.</p>
<h2>Suggesting a hackathon</h2>
<p>Send the organizer’s official page. We add events by hand when the dates and prizes can be confirmed there, and the daily refresh keeps them current.</p>`,
    },
  ];
}

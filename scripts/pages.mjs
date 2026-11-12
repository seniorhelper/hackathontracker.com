// All hand-written page copy lives here so the wording is easy to change in one place.

export const COPY = {
  name: 'Hackathon Tracker',
  homeTitle: 'Hackathon Tracker: Find Hackathons Ranked by Your Odds of Winning',
  homeDesc: 'Search open and upcoming hackathons from many platforms in one place. Filter by prize, deadline, city or online, hide student-only events, and see the prize money per entrant.',
  h1: 'Better odds.<br>Better weekends.',
  lede: 'Every open hackathon we can find, in one search. Sorted by how much prize money there is for each person who signed up, so you can skip the pile-ups and enter the ones you can win.',
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
    slug: 'best-odds', preset: { odds: 'strong', sort: 'best' },
    title: 'Hackathons With the Best Odds Right Now | Hackathon Tracker',
    description: 'Open hackathons ranked by prize money per person signed up. The top third by odds, refreshed daily, with deadlines and links to enter.',
    h1: 'Hackathons with the best odds right now',
    intro: 'These are the open hackathons with the most prize money for each person signed up. Fewer entrants chasing the same pot is the simplest edge there is.',
    below: `<h2>How to read this list</h2>
<p>“Per entrant” is the total cash prize divided by the number of people signed up today. It is a rough guide, not a promise. Sign-ups keep climbing until the deadline, and at most events plenty of people who sign up never submit anything, which works in your favour.</p>
<p>A good habit: check this page early in a hackathon’s run, save the ones that suit your skills, then look again a week before the deadline to see how crowded each one became. <a href="/methodology/">Full method and limits</a>.</p>`,
  },
  {
    slug: 'online-hackathons', preset: { mode: 'online' },
    title: 'Online Hackathons Open Now (Virtual, Join From Anywhere) | Hackathon Tracker',
    description: 'Every online and virtual hackathon we track that is open or upcoming, with prize money, sign-up counts and deadlines. Filter by prize, topic or odds.',
    h1: 'Online hackathons open now',
    intro: 'Virtual hackathons you can enter from your couch. Most run for weeks rather than a weekend, which suits anyone with a day job.',
    below: `<h2>Online vs. in person</h2>
<p>Online hackathons usually give you more time and bigger prize pools, but they also draw bigger crowds because anyone in the world can enter. That is where the odds column earns its keep: sort by “Best odds first” or “Fewest competitors” to find the quieter ones.</p>
<p>If meeting people is the main goal, an event in a room still beats a Discord server. Try the <a href="/in-person-hackathons/">in-person list</a> and type your city.</p>`,
  },
  {
    slug: 'in-person-hackathons', preset: { mode: 'in-person', sort: 'soon' },
    title: 'In-Person Hackathons Near You | Hackathon Tracker',
    description: 'Upcoming in-person hackathons by date. Type a city or country, or use Near me, to find events you can actually get to.',
    h1: 'In-person hackathons',
    intro: 'Hackathons that happen in a real room, soonest first. Type your city in the box, or tap Near me.',
    below: `<h2>Finding one close to home</h2>
<p>Type a city, state or country in the “City or country” box. The Near me button uses your browser’s location to show events within the distance you choose. Your location stays in your browser and is never sent to us.</p>
<p>Near me only works for events whose city we can place on a map, so if it comes up short, try typing your city or the nearest big one. Many in-person events are run by universities, so check the badge on each card to see whether it is students only.</p>`,
  },
  {
    slug: 'ai-hackathons', preset: { ai: true },
    title: 'AI Hackathons Open Now | Hackathon Tracker',
    description: 'Open and upcoming AI hackathons: agents, LLMs, generative AI and machine learning. See prize pools, sign-up counts and odds side by side.',
    h1: 'AI hackathons open now',
    intro: 'Agent, LLM and machine-learning hackathons that are open or coming up. Company-sponsored AI events tend to carry the biggest prizes and the biggest crowds, so check the odds.',
    below: `<h2>Picking an AI hackathon</h2>
<p>Many AI hackathons are run by a company that wants people building on its model or platform. Read the rules for which tools are required, because a great project on the wrong stack is not eligible. Prizes are sometimes paid partly in platform credits rather than cash, so look at the prize breakdown on the official page before you commit.</p>
<p>An event counts as AI here when its title or topic tags mention AI, machine learning, LLMs, agents or a major model by name.</p>`,
  },
  {
    slug: 'beginner-hackathons', preset: { beginner: true },
    title: 'Beginner-Friendly Hackathons Open Now | Hackathon Tracker',
    description: 'Hackathons tagged beginner friendly by their organizers, open or upcoming. A live list, not a stale roundup, with deadlines and prize details.',
    h1: 'Beginner-friendly hackathons',
    intro: 'Every hackathon here was tagged beginner friendly by the people running it. This list rebuilds itself daily, so nothing on it has already closed.',
    below: `<h2>First hackathon?</h2>
<p>Pick one with a deadline at least two weeks out, a topic you already care about, and rules you can read in five minutes. You do not need a team to start. A small working demo with a clear two-minute video beats an ambitious idea that does not run.</p>
<p>We only show the beginner tag when the organizer set it themselves. Plenty of untagged events welcome first-timers too, so it is worth browsing <a href="/online-hackathons/">online hackathons</a> as well.</p>`,
  },
  {
    slug: 'open-to-everyone', preset: { hideStudent: true },
    title: 'Hackathons for Adults and Non-Students | Hackathon Tracker',
    description: 'Hackathons with the student-only and high-school-only events filtered out. For working adults, career changers, indie builders and anyone without a student ID.',
    h1: 'Hackathons you can enter without a student ID',
    intro: 'A lot of hackathons are for enrolled students only. This list removes the ones we know are student-only or high-school-only, so you stop clicking into events you cannot enter.',
    below: `<h2>What this filter does and does not do</h2>
<p>We hide events from sources that are for students or high schoolers, and any listing marked that way. What is left is open to the public as far as we can tell, but organizers set their own rules on age, country and employer. Always read the eligibility section on the official page before you start building.</p>
<p>Company-run online hackathons are usually the most open to working adults. Sort by <a href="/best-odds/">best odds</a> to find ones that are not swamped.</p>`,
  },
  {
    slug: 'biggest-prizes', preset: { sort: 'prize', minPrize: 10000 },
    title: 'Biggest Hackathon Prizes Open Now ($10,000+) | Hackathon Tracker',
    description: 'Open hackathons with $10,000 or more in listed cash prizes, largest first, with the number of people signed up for each.',
    h1: 'The biggest hackathon prizes open now',
    intro: 'Every open hackathon with at least $10,000 in listed prizes, largest pot first. Look at the sign-up count next to each one before you get excited.',
    below: `<h2>Big pot, big crowd</h2>
<p>The headline number is the whole prize pool, usually split across many places and categories. First place is often a fraction of it. Large pools also pull in thousands of entrants, so a mid-sized prize with a small field can be the better bet. Compare the “per entrant” figure across cards to see it.</p>
<p>We only count prizes listed in US dollars. Events that list prizes in other currencies, or as credits and swag, show the organizer’s own wording instead.</p>`,
  },
  {
    slug: 'closing-soon', preset: { within: 7, sort: 'soon' },
    title: 'Hackathon Deadlines This Week | Hackathon Tracker',
    description: 'Hackathons whose submission or event date falls in the next 7 days, soonest first. Good for a last-minute entry or a final check on your shortlist.',
    h1: 'Hackathons closing in the next 7 days',
    intro: 'Deadlines landing this week, soonest first. Some are worth a sprint, especially the ones where few people have signed up.',
    below: `<h2>Is a last-minute entry worth it?</h2>
<p>Sometimes. If the build is small and the field is thin, a focused few days can place. Check the official page for the exact closing time and time zone, since we show the date only, and leave an hour for the submission form and video upload.</p>`,
  },
];

export function staticPages({ stats, status, money, esc, fmtDate, updatedText, cut }) {
  const rows = status.map((s) => `<tr><td>${s.homepage ? `<a href="${esc(s.homepage)}" rel="noopener" target="_blank">${esc(s.label)}</a>` : esc(s.label)}</td><td>${s.ok ? (s.note ? 'Using last good copy' : 'Working') : 'Not available today'}</td><td>${s.count.toLocaleString('en-US')}</td></tr>`).join('');
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
      path: '/alerts/', title: 'Free Hackathon Alerts and Calendar Feeds | Hackathon Tracker',
      description: 'Get new hackathons and deadlines without an account: a feed of new listings, a feed of the best odds, and a deadline calendar you can subscribe to.',
      h1: 'Alerts and calendar',
      html: `<p>No account, no email address, no cost. Pick whichever of these fits how you already work.</p>
<h2>Deadline calendar</h2>
<p>Subscribe once and every prize hackathon’s deadline shows up in your calendar and stays current.</p>
<p><a class="btn" href="/feeds/deadlines.ics">Download the deadline calendar</a></p>
<p>To subscribe so it keeps updating: in Google Calendar choose “Other calendars → From URL”, in Apple Calendar “File → New Calendar Subscription”, and paste <code>https://hackathontracker.com/feeds/deadlines.ics</code>.</p>
<h2>New-listing feeds</h2>
<p>These work in any feed reader, and in tools that turn a feed into an email or a chat message.</p>
<ul>
<li><a href="/feeds/new.xml">Newly listed hackathons</a></li>
<li><a href="/feeds/best-odds.xml">Hackathons with strong odds</a></li>
</ul>
<h2>Your own shortlist</h2>
<p>Press Save on any card and tick “My saved list” in the filters to see just those. Use “Add deadline to calendar” on a card to drop a single deadline into your calendar. Your list lives in this browser only.</p>`,
    },
    {
      path: '/about/', title: 'About Hackathon Tracker',
      description: 'Hackathon Tracker is an independent search engine for hackathons, built to answer one question: which one is worth entering?',
      h1: 'About Hackathon Tracker',
      html: `<p>Hackathon Tracker exists to answer one question: <strong>which hackathon is worth entering?</strong></p>
<p>Listings are scattered across a dozen platforms, most lists are sorted by date, and none of them tell you how crowded an event is compared with its prize money. So this site pulls the public listings into one search, works out the prize per entrant where the numbers exist, and lets you filter down to the ones that fit you, whether you are a student, a working adult or somewhere in between.</p>
<p>It is free, there is no account, and every listing links straight to the organizer’s page. We are independent and not affiliated with any platform or organizer listed here.</p>
<p>Read <a href="/methodology/">how the odds work</a>, see <a href="/sources/">where the data comes from</a>, or go <a href="/">find a hackathon</a>.</p>`,
    },
    {
      path: '/privacy/', title: 'Privacy | Hackathon Tracker',
      description: 'Hackathon Tracker has no accounts, sets no cookies and runs no trackers. Your saved list and your location stay in your browser.',
      h1: 'Privacy',
      html: `<p>Short version: we don't collect anything about you unless you post a project to the entry wall.</p>
<ul>
<li><strong>No accounts.</strong> There is nothing to sign up for to search or save hackathons.</li>
<li><strong>The entry wall form</strong> is the only place you give us anything. When you post a project, what you type is emailed to us for review through FormSubmit, a form-delivery service. We publish only the project details you chose to share (name, links, pitch, tags and the name you gave). Your email address is never published and is used only to contact you about your entry. Ask us anytime to remove your entry.</li>
<li><strong>No cookies, analytics or ad trackers</strong> are set by this site.</li>
<li><strong>Your saved list</strong> is stored in your own browser. Clearing your browser data removes it.</li>
<li><strong>Near me</strong> asks your browser for your location only when you press the button. The distance sums happen on your device and your location is never sent to us or put in the page address.</li>
<li><strong>Links</strong> to hackathon pages go to other websites, which have their own privacy policies.</li>
</ul>
<p>The site is served by a hosting provider that, like any web host, may keep standard server logs such as IP addresses. If this page changes, the change will be posted here.</p>`,
    },
  ];
}

# CrimeStat — Crime Tracker App Project Spec (draft v0, Nov 24, 2026)

## Name & domain
- Working name: CrimeStat
- Domain: crimestat.net — purchased and owned by Chris on GoDaddy, Nov 24, 2026 (order 4230336856), $16.36 incl. tax for 1 year; auto-renews 11/25/2027 at $24.99 + tax

## Concept
A consumer crime-map app positioned to beat LexisNexis Community Crime Map and NeighborhoodScout:
free/cheap, faster, clearer, more granular, and mobile-first.

## Core feature
Interactive map with a layer system. Each crime type is its own toggleable overlay
(on/off, color + icon per type), plus date-range filter and heatmap vs. pin view.

## Platforms
- Ships as both a website and a mobile app (iOS + Android), with the same feature set on both, like Chris's other recent projects.

## Website layout
- Top-left hamburger menu (three bars) containing: "Sign up for alerts" and "Settings" (plus standard nav).
- Persistent bottom tab across every page: "Download our app" (links to iOS/Android).
- Build status: in progress (Chris approved a 15-point CrimeStat cap, up to 90% weekly usage, on Nov 24, 2026).

## Design principle (added Nov 24, 2026 11:40 PM, applies to every feature)
- Keep the interface clean and uncluttered: no bulky, ugly or congested layouts.
- Every feature must be easy to understand at a glance. Clarity beats density.
- Use progressive disclosure: the default view shows only the essentials, and advanced options (layer lists, time presets, route-safe settings, alert radius, score details, near-miss form) sit behind a tap, drawer or menu.
- The map stays the hero of the screen. Overlays, panels and banners stay small, collapsible and out of its way.
- This applies to route-safe mode, safety scores, near-miss reports, saved-location alerts, and anything added later.

## Map behavior
- On open: geolocate the user (with permission), snap to the nearest street address, and center the map there. Fallback if location is denied: address/ZIP search box.
- Default view: crimes within a 5-mile radius of the user; user can zoom/pan out to see wider areas.
- Layer control: pick any single crime type (or several) to filter the map.
- Default layers on startup (updated Nov 24, 2026 11:36 PM): when the map first opens, before the user toggles anything, 16 layers load switched on: Burglary — residential, Burglary — business, Theft, Motor vehicle theft, Arson, Weapons violations, Home invasion, Assault, Rape / sexual assault (area totals only, no pins, as before), Battery, Robbery, Vandalism, Kidnapping, Fraud, Drug offenses, and Missing persons (pinned at the last-seen location; see placement rule below). The other 3 (Domestic violence, Stalking, Shots fired) start off until the user turns them on. Spec-only for now; goes live with the next build.
- Time window: default last 6 months; presets 6 months, 1 year, up to 5 years.

## Crime-type layers (19)
1. Burglary — residential (home break-ins)
2. Burglary — business (commercial break-ins)
3. Theft
4. Home invasion
5. Assault
6. Rape / sexual assault
7. Battery
8. Robbery
9. Vandalism
10. Arson
11. Motor vehicle theft
12. Kidnapping
13. Fraud
14. Drug offenses
15. Weapons violations
16. Domestic violence
17. Stalking
18. Shots fired
19. Missing persons

Burglary is split (Nov 24, 2026) into two layers, each with its own toggle, color and icon: residential (house icon) and business (storefront icon). Classification uses the NIBRS 220 location type: residence/home goes to residential, and commercial/retail/office goes to business.

## Open questions / to research
- Data sources: city/county open-data portals, FBI Crime Data Explorer (NIBRS), police CAD feeds, gunshot-detection feeds; licensing and coverage per area.
- Missing persons pin placement (Nov 24, 2026 11:37 PM): this OVERRIDES the area-totals-only privacy rule for missing persons. Missing persons get individual pins so people can help narrow down the search area. Each missing-persons pin marks where the person was LAST SEEN, never their home address or any other location. Use the last-seen location exactly as the source (e.g. NamUs) publishes it; if only a city/county is given, place the pin at that city/county, not a guessed street address. Spec-only for now; goes live with the next build.
- Missing persons pin expiration (Nov 24, 2026 11:38 PM): pins fade out gradually over time and then disappear. Default fade window is 30 days from the last-seen date for unresolved cases: the pin gets steadily more transparent across the 30 days and is removed at day 30, unless the source updates the case, in which case the window restarts from that update. If the source marks the case resolved, located or found, the pin is removed promptly, on the next data refresh, with no fade. Spec-only for now; goes live with the next build.
- Privacy: sensitive types (rape, domestic violence, stalking; missing persons only as above) usually published only at block/area level or not at all — must aggregate, never show victim addresses.
- Differentiators vs. LexisNexis/NeighborhoodScout: alerts for a saved address, trend charts, safety score, free tier.
- Stack/hosting TBD (default: web on Vercel like other projects; mobile likely via Expo/React Native sharing code with the site).

## App icon
- A bandit mask: the classic black eye mask with two eye holes (like a cartoon burglar's), simple and bold so it reads at small icon sizes.

## Local news section
- Placed lower on the page, below the map. Shows the newest local news for the user's area (city/county from their location), focused on crime and public safety, newest first.
- Each item: headline, outlet name, time ago, thumbnail if provided, short snippet; tapping opens the original article in a new tab (link out, no copying full articles).
- Sources (to confirm): GDELT news API (free, open) filtered by location + keywords; local outlets' and police departments' RSS feeds; Google News RSS search as a fallback only if its terms allow. Paid option later: NewsAPI or similar.
- Refresh every ~15 min server-side and cache; dedupe the same story from multiple outlets.

## Planned features (added Nov 24, 2026)
1. Anonymous tip line: people report what they see (type, location, time, optional photo). No account or contact info required; strip photo location data; moderation queue; clear notice that tips are not 911 and that emergencies should call 911; option to forward to the local police non-emergency/tip line.
2. Predictive hotspot forecasting: flag areas where incidents are clustering (e.g., rising counts vs. baseline over recent weeks, space-time clustering) before they spike; show as "trend alerts" with plain-language confidence, never as predictions about individuals.
3. Community layer: neighborhood watch groups (verified accounts) post their own sightings as a separate, clearly labeled "Community reports — unverified" layer, with moderation and report/flag tools.

## Domain hookup
- Add crimestat.net (+ www) as a custom domain on the Vercel project; add the DNS records Vercel shows at GoDaddy.
- Note: Vercel team hit the free plan's 100 deploys/day cap on Nov 24, 2026; first deploy may wait until ~11 PM PT Nov 25 unless the plan is upgraded (Chris's call).

## Logo (FINAL, locked Nov 24, 2026 11:23 PM)
File: brand/crimestat-logo.png (source: brand/crimestat-logo-v10-shaded-question.jpg). A gray question mark with its stem and round dot, wearing a black bandit mask across the top curve with white eye holes and a knot on the right. There's soft darker shading above the mask like a brow and a thin shadow under it along the cheeks. The gap inside the hook is filled with darker gray so the top reads as a head. No nose, mouth or neck. Plain white background, no red, no text. Used for the logo, app icon, favicon and all branding. No further changes unless Chris asks. Other versions are archived in brand/.

## Spokane data status (Nov 24, 2026)
- Spokane Police Department's public incident feed has been stale since about Sept 30 / October 2026, when SPD paused its public dashboard for a records-management-system (RMS) switch. Spokane data in CrimeStat is stale as of October 2026, pending the new RMS's public feed.
- Spokane data covers May 1, 2026 through the feed's last update (about Sept 30 / October 2026), stale pending the new RMS's public feed. The exact range is recorded in data/spokane/README.md.
- The default 6-month window (from Nov 24, 2026, back to about May 24, 2026) covers June through October. May 1–23 records show only with the 1-year preset or wider, and that window slides forward each day.
- Spokane records are real public data, not demo data. They are labeled "Spokane Police Department public data, as of <date>" with source and as-of date shown, and kept separate from the demo set. Files are in data/spokane/.
- Newport is about 45 miles from Spokane, outside the default 5-mile radius, so Spokane pins appear only when the map is centered on Spokane or zoomed out.

## New features (added Nov 24, 2026 11:39 PM, spec-only; go live with the next build)
1. Neighborhood safety score: a score per area (neighborhood, or grid cell where no neighborhood boundary exists) shown on the map, recalculated as new incidents come in. Built only from official/confirmed incident data, never from near-miss reports. Each score shows its data as-of date and the incidents behind it, and areas with too little data show "not enough data" instead of a score.
2. Near-miss report button: users can report something that almost happened. Near-misses live on their own layer with a distinct look, are clearly labeled "Unverified near-miss — user report, not a confirmed crime," and never mix into crime layers, counts or safety scores. They need moderation and abuse controls (rate limits, a flag/report button, no personal names or exact home addresses in reports).
3. Saved-locations alerts: users save any addresses they choose (home, work, a kid's school, etc.) and get a notification when a new incident is reported within a radius they set around any saved spot. Saved addresses stay private to the user and are never shown on the map or shared. Needs accounts plus an email/push sender, which the current site doesn't have yet.
4. Route-safe mode (added 11:40 PM): user picks two points and the map highlights a route that avoids areas of high recent incident density (confirmed incidents only, recent window, weighted by recency and severity), shown next to the normal shortest route with the extra distance/time. Needs a routing engine (e.g. OSRM/GraphHopper/Valhalla on OpenStreetMap). Must carry a clear disclaimer: it reflects reported data only, isn't a guarantee of safety, and areas with no data aren't proof of safety.

## Public records requests (Nov 24, 2026)
Seven formal FOIA / Washington PRA request drafts are done (records-requests/, INDEX.md plus 01–07: FBI, WASPC, Spokane PD, Spokane County Sheriff, Spokane Valley PD, Newport PD, Pend Oreille Sheriff). None have been sent. They're waiting on Chris's mailing address, email, phone, date and a dollar fee cap.

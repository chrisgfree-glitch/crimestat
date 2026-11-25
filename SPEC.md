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

## Map behavior
- On open: geolocate the user (with permission), snap to the nearest street address, and center the map there. Fallback if location is denied: address/ZIP search box.
- Default view: crimes within a 5-mile radius of the user; user can zoom/pan out to see wider areas.
- Layer control: pick any single crime type (or several) to filter the map.
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
- Privacy: sensitive types (rape, domestic violence, stalking, missing persons) usually published only at block/area level or not at all — must aggregate, never show victim addresses.
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

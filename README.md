# CrimeStat

Interactive crime map at [crimestat.net](https://crimestat.net). First public version.

This site is a mobile-first map with 19 toggleable crime-type layers, a 5-mile default radius, 6-month / 1-year / 5-year time windows, and a heat map or pin view. It ships as a website now; an iPhone and Android app (Expo) is planned.

## Demo data

This first release uses **simulated demo data**, not real police reports. A “Demo data” banner stays on screen, and every popup says the same. Sensitive types (rape / sexual assault, domestic violence, stalking, and missing persons) are drawn only as area totals, never as addresses or pins.

Demo incidents are generated around the map center (your location or a searched address) so the product can be tried anywhere. They should not be used for safety decisions. Real public sources (city open-data portals, FBI Crime Data Explorer) are planned for a later release.

## Stack

- Static site on Vercel
- Leaflet + OpenStreetMap tiles
- Nominatim geocoding via `/api/geocode` (server-side, identified User-Agent, cached)

## Local run

This is a static site plus one Vercel Function. Preview with the Vercel CLI (`vercel dev`) or any static server for the front end (address search needs the API route).

## License

Private project for Christopher Grantham.

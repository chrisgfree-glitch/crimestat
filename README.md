# CrimeStat

Interactive crime map at [crimestat.net](https://crimestat.net) (until DNS is pointed, use the Vercel URL).

This site is a mobile-first map with 19 toggleable crime-type layers, a 5-mile default radius, time-window presets, and a heat map or pin view. An iPhone and Android app (Expo) is planned.

## Current data

Official **City of Spokane Police Department** public records, May 1 to Sep 27, 2026 (as of Sep 27, 2026). The feed has been paused since Spokane’s October 2026 records-system switch.

Sources are the city’s official ArcGIS FeatureServers only (`SPD_Offenses` layer 18 and `SPD_CallsForService` layer 16). Locations are shown at official neighborhood level only for Spokane. Seattle uses official 100-block and MCPP neighborhood locations. Kent is shown as annual agency totals inside the city outline. Auburn pins use official Auburn Police Department coordinates and show the official street addresses published in that public dataset. Rape / sexual assault, domestic violence, and stalking are area totals, never pins. 911/CAD calls are a separate, default-off Spokane layer of unconfirmed calls for service.

Areas without a feed show “No public data feed for this area yet.” There is no demo or simulated crime data on the live site.

The default time window is the **full snapshot**. Six-month, 1-year, and 5-year presets are measured from the as-of date (Sep 27, 2026), not from today, because a rolling 6-month window from late November would cut off early May.

## Stack

- Static site on Vercel
- Leaflet + OpenStreetMap tiles
- Nominatim geocoding via `/api/geocode`

## Local run

Preview with the Vercel CLI (`vercel dev`) or any static server for the front end (address search needs the API route).

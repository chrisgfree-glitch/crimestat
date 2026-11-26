# Washington crime data sources

Research pass on November 25, 2026 (Pacific Time). Public web pages and open-data metadata only. No agency was contacted, no accounts were created, and no API keys were added. None of these feeds were integrated into the live CrimeStat app in this pass.

Any later integration must follow the same privacy rules as the Spokane snapshot: no street addresses (block or neighborhood only); rape / sexual assault, domestic violence, and stalking as area totals never pins; source and as-of date shown per area; no invented or simulated incidents. Areas without a usable feed should keep the existing “No public data feed for this area yet” message.

Times below that came from dataset metadata timestamps are converted to Pacific Time.

---

## Priority group

### Seattle Police Department — best candidate for a later snapshot

- **Feed:** Yes. Official City of Seattle Open Data dataset “SPD Crime Data: 2008-Present” (Socrata id `tazs-3rd5`).
- **URLs:** [Portal](https://data.seattle.gov/Public-Safety/SPD-Crime-Data-2008-Present/tazs-3rd5), SODA API `https://data.seattle.gov/resource/tazs-3rd5.json` (no key required for light use).
- **License / terms:** Dataset license is Public Domain. Seattle’s Open Data Policy (Feb 1, 2016) says portal datasets are made available without a registration or license requirement or restrictions on use, except that a republisher may be required to identify the source and version and describe any modifications.
- **Currency:** Official description says the data is updated once every 24 hours, and that only finalized (UCR-approved) reports are released; online/telephone reports may lag up to two weeks. Metadata `rowsUpdatedAt` was November 25, 2026, 8:08 AM PT. Report numbers in the metadata cache include 2026 cases.
- **Location:** `block_address`, `latitude`, and `longitude` are blurred to the 100-block. `neighborhood` is the Micro-Community Policing Plan (MCPP) area. Also beat, precinct, sector, reporting area, and 2020 census block.
- **Notes:** NIBRS offense codes and categories are included. This is the strongest fit for a CrimeStat-style static snapshot: open license, recent, machine-readable API, and already-blurred locations.

### Kent Police Department

- **Feed:** No dedicated Kent PD open incident dataset was found. Kent has its own police department; it is not listed among King County Sheriff contract cities on the KCSO crime-data page.
- **Caution:** The KCSO offense-reports dataset has a `city` field that can contain “KENT”. That is not Kent PD’s feed and should not be treated as official City of Kent police data without further verification (it may be unincorporated or other KCSO activity).
- **Skipped for integration:** no confirmed Kent PD feed.

### Tacoma Police Department

- **Feed:** Partial. The city publishes a Tacoma Police Crime Dashboard, updated each business day, and an ArcGIS FeatureServer named `TPD_RMS_Crime` at `https://services3.arcgis.com/SCwJH1pD8WSn5T5y/ArcGIS/rest/services`.
- **URLs:** [Accountability page](https://tacoma.gov/government/departments/police/policing-accountability-transparency/), [Tacoma Open Data item](https://tacomaopendata-tacoma.hub.arcgis.com/content/96780b27dfc14aeaad1204f9f73ed5a6), [Tableau dashboard](https://public.tableau.com/app/profile/city.of.tacoma/viz/TacomaPoliceCrimeDashboard/CrimeDashboard-IntroPage) (Tableau “Last Published Date” November 25, 2026).
- **License / terms:** The open-data item lists a Custom License; commercial-reuse terms were not fully reviewed in this pass. The dashboard text says users agree to the listed conditions, that the data is preliminary, and that Tacoma PD does not guarantee accuracy, completeness, or timeliness.
- **Location:** Locations are geo-masked to the nearest 100-block. Some call types and offenses (the page cites child abuse, domestic violence, medical aid, rape, and sexual offenses) are excluded from the public dataset.
- **Status:** Promising if the FeatureServer is queryable without a key and the custom license is acceptable; license still needs a careful read before use.

### Bellevue Police Department

- **Feed:** Mixed. City GIS exposes `Incidents` and `Crime_Cases_By_100_Block` FeatureServers under `https://services1.arcgis.com/EYzEZbDhXZjURPbP/ArcGIS/rest/services`, plus a Police Transparency incidents dashboard (calls for service, not necessarily confirmed cases).
- **URLs:** [Incidents dashboard](https://bpd-data.bellevuewa.gov/pages/incidents-dashboard), [Crime Cases By 100 Block item](https://www.arcgis.com/home/item.html?id=ac94dee7e78d4017b74a155932dd8737).
- **License / terms:** Not fully verified in this pass.
- **Currency:** The “Crime Cases By 100 Block” item listed “Data updated” June 15, 2022. That may mean the layer is stale; currency of the live service was not independently confirmed here. The incidents dashboard is described as calls for service and defaults to a short recent window.
- **Location:** The 100-block crime-cases layer is described as mapped to the 100-block. BPD says the data is preliminary and is not official UCR/NIBRS.
- **Status:** Do not integrate until currency and license are confirmed. Prefer a current offense dataset over 911-call activity.

### Everett Police Department

- **Feed:** Yes. Official “Police Cases” dataset on the City of Everett Open Data portal (Socrata id `szww-y224`).
- **URLs:** [Portal](https://data.everettwa.gov/Safe-Community/Police-Cases/szww-y224), CSV/API via Socrata (`/api/views/szww-y224/...`).
- **License / terms:** No `licenseId` was present in the dataset metadata. Terms were not verified in this pass.
- **Currency:** Metadata `rowsUpdatedAt` was November 25, 2026, 3:16 AM PT. Year counts in the metadata include 9,491 cases in 2026.
- **Location:** `occurredlocationby100block` is “Approximate address of the incident rounded to the 100 block.” Neighborhood, beat, area, precinct, and a point geometry for the approximate location are also present.
- **Notes:** The official description says case reports involving domestic violence, child abuse, or sex offenses involving minors are not reported. Other sensitive types could still appear and would have to be shown only as area totals, never as pins. Strong technical fit after Seattle, pending a license check.

### Vancouver Police Department (Washington)

- **Feed:** No confirmed reusable open incident API or bulk dataset was found. The City of Vancouver Open Data Hub has a Community Crime Map, which appears to be an interactive/vendor map rather than a documented open dump or API.
- **Other:** Agency-level NIBRS totals may be available through the statewide WASPC / Washington NIBRS files (see below), not a city incident map.
- **Skipped for integration:** no confirmed open incident feed.

### King County Sheriff’s Office

- **Feed:** Yes. Official “KCSO Offense Reports: 2020 to Present” (Socrata id `4kmt-kfqf`).
- **URLs:** [Portal](https://data.kingcounty.gov/Law-Enforcement-Safety/KCSO-Offense-Reports-2020-to-Present/4kmt-kfqf), [KCSO crime data page](https://kingcounty.gov/en/dept/sheriff/about-king-county/about-sheriff-office/news-data-reports/crime-stats-data).
- **License / terms:** The dataset metadata does not set a Socrata `licenseId`. King County’s [open data Terms of Use](https://data.kingcounty.gov/terms) grant a limited, revocable license to use, reproduce, redistribute, create derivative works, and make the data available to end users. The terms require the legend “data provided by permission of King County” and compliance with applicable law. Third-party copyrighted material in the data is not licensed. Commercial use is not forbidden by the text reviewed; the license is limited and revocable, and the required attribution must be used.
- **Currency:** Official text says the data updates once every 24 hours and includes only finalized (supervisor-approved) reports. Metadata `rowsUpdatedAt` was November 25, 2026, 5:52 AM PT.
- **Location:** `block_address` is blurred to the 100-block. Also city, ZIP, reporting area, district, and precinct. No point coordinates in the reviewed columns. A patrol-district shapefile is linked from the dataset description.
- **Coverage:** KCSO jurisdiction, including unincorporated King County and contract / partnership cities. The official crime-maps list includes Burien, Carnation, Covington, Kenmore, Maple Valley, Muckleshoot, Newcastle, North Bend, Sammamish, SeaTac, Shoreline, Skykomish + Hwy 2, and Woodinville. This is not a substitute for cities that have their own police department and their own (or no) feed, such as Kent.

### Statewide WASPC / Washington NIBRS / FBI Crime Data Explorer

- **WASPC:** [CJIS Statistics & Reports](https://www.waspc.org/crime-statistics-reports) hosts official *Crime in Washington* style annual statistics. Good for agency-level official counts, not a street-level map.
- **Washington SAC / data.wa.gov:** “Washington State Uniform Crime Reporting - National Incident Based Reporting System,” landing page `https://data.wa.gov/d/xuwr-yzri`. A public Excel file is published at `https://sac.ofm.wa.gov/sites/default/files/nibrs_12_25.xlsx`. Catalog metadata listed the dataset as public and modified November 24, 2026. The spreadsheet is **agency-level annual totals** (county, agency, year, population, offense-category counts and rates), not incident points. No API key is required to download that file.
- **FBI Crime Data Explorer:** [CDE](https://cde.ucr.cjis.gov/latest/webapp) can be used in a browser. The **CDE API requires an API key** (obtained by submitting a name and email). CrimeStat should not add that key in this work. FBI NIBRS master extracts are large annual files and are not a substitute for a local incident map.
- **Status:** Usable later as a cheap statewide, agency-level, annual layer if desired, without an FBI API key, using the Washington SAC spreadsheet. Not sufficient on its own for a neighborhood map.

---

## After the priority group

### Issaquah

- **Feed:** No standalone open incident dataset was found on [Issaquah Open Data](https://open-data-issaquahwa.hub.arcgis.com/datasets). The city points to a crime map / dashboard and to weekly blotters and monthly or annual reports ([Data and Statistics](https://www.issaquahwa.gov/3370/Data-and-Statistics), [Crime Mapping](https://pd21.communitydashboard.info/Issaquah/Mapping/)).
- **Status:** Vendor or interactive map only in this pass; not a confirmed reusable API. Agency-level NIBRS totals may exist via WASPC / Washington NIBRS. **Skipped** for incident integration until an open dump is found.

### Bothell

- **Feed:** Yes, via the city’s own police department. [Bothell Police Transparency](https://police-transparency-4-bothellgov.hub.arcgis.com/) offers incidents, case/offense statistics, arrests, collisions, and infractions, with CSV export. The site says data is updated nightly. Case and incident addresses are anonymized and shown as nearby street intersections, not exact locations. Active investigations, incidents involving juvenile victims, and cases without verified locations are withheld.
- **License / terms:** A City of Bothell interactive-maps disclaimer says that if the data consists of a list of individuals, it is not to be used for a commercial purpose. The specific license on the transparency crime datasets was not fully verified here.
- **Status:** Technically promising (nightly, already generalized locations). Confirm license before any integration.

### Woodinville

- **Police provider:** Verified. The City of Woodinville has partnered with the King County Sheriff’s Office for police services since 1993 ([city police page](https://www.woodinville.gov/220/Police), [KCSO partnership page](https://kingcounty.gov/en/dept/sheriff/courts-jails-legal-system/police-partnership-program/partnerships/woodinville)). Woodinville is also listed on the KCSO crime-maps table.
- **Feed:** No separate Woodinville open incident dataset was found. Incident-level public data, if used, would come from the **KCSO Offense Reports** dataset, filtered to Woodinville, under King County’s terms and 100-block fields.
- **Status:** Depends on the KCSO feed, not a unique city API.

### Mill Creek

- **Feed:** The city publishes a [police blotter and statistics](https://millcreekwa.gov/topics/police-blotter-and-statistics) page (weekly blotters). No open, machine-readable incident dataset was found.
- **Skipped:** no confirmed incident feed.

### Mukilteo

- **Feed:** A Community Crime Map was reported in public listings. No confirmed reusable open API or bulk incident dataset was found in this pass.
- **Skipped:** no confirmed open incident feed.

---

## Southern Washington group

Researched in the same pass. Interactive vendor maps and annual PDFs are noted where found, but they are not the same as an open, reusable incident feed.

| Place | Feed found? | Notes |
| --- | --- | --- |
| Olympia | No reusable open incident API found | Shares a P2C-style online records / daily bulletin portal with nearby cities, not a documented bulk dataset. |
| Lacey | No reusable open incident API found | Same P2C-style pattern as Olympia / Tumwater. |
| Tumwater | No reusable open incident API found | Same as above. |
| Centralia | None found | No public incident dataset identified in this pass. |
| Chehalis | None found | No public incident dataset identified in this pass. |
| Aberdeen | No reusable open incident API found | Public crime-records page appears to use a City Protect / vendor portal. |
| Hoquiam | No reusable open incident API found | Same vendor-portal pattern was indicated with Aberdeen / Grays Harbor. |
| Federal Way | No confirmed open API | City [crime statistics](https://www.federalwaywa.gov/page/crime-statistics) page describes a Community Crime Map with block-rounded locations, updated several times daily. That is an interactive map, not a verified bulk API. |
| Auburn | Yes, pending checks | [Auburn Open Data “Crimes”](https://data.auburnwa.gov/dataset/Crimes/kc27-rkrm) and a GIS `Police/Police` MapServer crimes layer (`https://gis.auburnwa.gov/hosting/rest/services/Police/Police/MapServer/0`) with reported date, case number, address, reporting district, and offense. A third-party catalog lists the license as Public Domain; the official license page was not fully confirmed here. At least one Auburn export shows street-style addresses, so a CrimeStat snapshot would have to generalize to block or district and never publish a street address. Latest record date was not independently verified in this pass. |
| Lakewood | No confirmed open API | City crime-statistics page offers an interactive map and periodic reports. |
| Puyallup | Dashboard only in this pass | An ArcGIS city crime dashboard was found; license, API access, and currency were not fully verified. |
| Longview | No incident-level open portal found | Annual crime reports were indicated; no machine-readable incident feed was found. |
| Vancouver | See priority group | Already covered above; no confirmed open incident API. |

---

## Suggested next integrations (not done in this pass)

1. **Seattle PD `tazs-3rd5`** — public domain, daily, 100-block and MCPP neighborhood, no API key for a static snapshot.
2. **KCSO `4kmt-kfqf`** — daily, 100-block, covers Woodinville and other listed contract cities, with the required King County attribution. Does not replace independent-city PDs.
3. **Everett `szww-y224`** — recent and 100-block / neighborhood, after a license check.
4. **Bothell transparency CSVs** — after a license check.
5. **Statewide SAC NIBRS spreadsheet** — cheap agency-level annual context only, not a map of incidents.

Leave every other listed city on the existing “No public data feed for this area yet” message until a usable, licensed, current feed is confirmed.

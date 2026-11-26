# Washington crime data sources

Research pass on November 25, 2026 (Pacific Time), with later integration notes for Seattle, Kent, and Auburn. Public web pages and open-data metadata only. No agency was contacted, no accounts were created, and no API keys were added.

Default privacy rules match the Spokane snapshot: no street addresses (block or neighborhood only); rape / sexual assault, domestic violence, and stalking as area totals never pins; source and as-of date shown per area; no invented or simulated incidents. Areas without a usable feed should keep the existing “No public data feed for this area yet” message.

Exception, November 25, 2026: Auburn is integrated with official street addresses as published by Auburn Police Department, after an explicit decision to reverse the earlier address-level skip for that city. Sensitive types (rape / sexual assault, domestic violence, and stalking) remain area totals only. Juvenile-related and child-related incident types are held off the map.

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
| Auburn | Yes — live 90-day snapshot | Official Socrata metadata for [Auburn Open Data “Crimes”](https://data.auburnwa.gov/dataset/Crimes/kc27-rkrm) (`https://data.auburnwa.gov/api/views/kc27-rkrm.json`) lists `licenseId: PUBLIC_DOMAIN` and `license.name: Public Domain`, with attribution “City of Auburn.” The SODA row API returns empty objects because the dataset is an ArcGIS-backed view; incident rows, coordinates, and street addresses come from the official GIS layer `https://gis.auburnwa.gov/hosting/rest/services/Police/Police/MapServer/0`. Latest reported date in the November 25 build is November 24, 2026, 1:02 PM Pacific Time. CrimeStat’s Auburn snapshot is August 27 to November 24, 2026, shows official street addresses in pin popups, and uses City of Auburn GIS Political Boundaries (`CITYNAME='AUBURN'`) for the city outline. Public Domain does not forbid reuse and does not require public display; the app still credits the City of Auburn. |
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

---

## Re-check: shoreline cities, extra WA list cities, and vendor maps (November 25, 2026, evening PT)

Public web pages, official open-data metadata, and one-row field samples only. No agency was contacted, no accounts were created, no API keys were added, and **nothing was added to the live CrimeStat map**. LexisNexis Community Crime Map incident data was **not scraped**. Times below that came from dataset or item timestamps are converted to Pacific Time.

### Vendor terms and how the vendor maps work

**LexisNexis Community Crime Map** (view-only vendor map, not a reusable open feed)

- **Product / map:** [Community Crime Map product page](https://lexisnexisrisk.com/en-us/law-enforcement-public-safety/products/community-crime-map), public map [communitycrimemap.com](https://communitycrimemap.com/).
- **What LexisNexis says the source is:** The product page’s “How It Works” step 1 is: “Collect approved crime data directly from participating law enforcement agencies.” It also says crime information is “automatically updated through secure agency data feeds,” that agencies “Control which incidents and data are shared publicly,” and that “Before crime information is published, sensitive details such as personal information and protected address data are removed to maintain privacy while ensuring transparency.” Official city pages add more precise source language (Snohomish County records-management / New World police reports; Federal Way “case report information from Federal Way’s records management system”; Vancouver “submitted by the Vancouver Police Department and other local area law enforcement agencies”).
- **How it presents incidents (from official agency pages, not from scraping the map):** Interactive pins / color-coded icons and heat maps; users can filter by date, crime type, and distance from an address; incident details can include crime type, report number, date and time, and a general location. **Location precision stated by agencies:** Snohomish County / Edmonds / Mukilteo official text (and the November 1, 2016 multi-agency news release still posted by Everett) says, “To protect privacy, the actual incident location is randomly offset on the map display” / “randomly offset on the map.” Federal Way’s official page says the map shows “Location of the incident rounded to the hundred block,” and that data “is automatically updated several times a day.” Marysville says color-coded icons show type and “basic details for up to one year.”
- **Terms on copying, reuse, attribution, and linking:** A Community Crime Map–specific in-app terms page was not retrieved as static text in this pass (the map site is a JavaScript app, and the map itself was not scraped). The product site footer links to LexisNexis Risk Solutions [Terms and Conditions](https://lexisnexisrisk.com/en-us/terms). Those website terms include: “The Content on this Web Site is for your personal use only and not for commercial exploitation.” “The content of the Site cannot be used, posted, sold, transmitted, distributed, modified or transferred for public or commercial purposes, without the prior written permission of LexisNexis Risk Assets Inc.” “You may not use any robot, spider, other automatic software or device, or manual process to monitor or copy our Web Site or the Content without Provider’s prior written permission.” “You may not copy, modify, reproduce, republish, distribute, display, or transmit for commercial, non-profit or public purposes all or any portion of this Web Site, except to the extent permitted above.” On linking: “You may provide links to this Web Site, provided that (a) you do not remove or obscure, by framing or otherwise, any portion of this Web Site, including any advertisements, terms of use, copyright notice, and other notices on this Web Site, (b) you immediately deactivate and discontinue providing links to this Web Site if requested by Provider, and (c) Provider may deactivate any link(s) at its discretion.” These are the Risk Solutions website terms, not a separately captured CCM click-through. **Reuse of Community Crime Map pins or records in CrimeStat is not allowed under the quoted language.** A simple outbound link, if unframed and not requested to be removed, is the only reuse path those terms describe.
- **Cities in this pass confirmed on official agency pages as linking to or participating in Community Crime Map (not confirmed by opening the map):** Everett, Marysville, Lynnwood (city PD page lists “Community Crime Map”; the exact href was not captured because the page blocked automated fetch), Edmonds, Mukilteo, Mountlake Terrace, Federal Way, and Vancouver (WA). Snohomish County’s official page describes a county-wide “LexisNexis Snohomish County Community Crime Map” for “certain calls for service and criminal activity in Snohomish County.” The City of Snohomish (not on the requested list) also links to it. **Not confirmed on a current official city page in this pass:** Mill Creek, Lake Forest Park, Kent, Renton, Bellevue, Lakewood, Puyallup, Issaquah, Shoreline, and Kenmore.

**CrimeMapping.com** (view-only vendor map)

- Official site requests in this pass ([crimemapping.com](https://www.crimemapping.com/) terms/disclaimer URLs) returned an Error500 page, so **current official CrimeMapping.com terms were not retrieved and are not quoted here.**
- None of the cities in this re-check had a current official city page that clearly linked to CrimeMapping.com. (Nearby Kirkland does, but Kirkland was not in this list.) An older Patch item noted Bellevue launching an “online crime map,” but Bellevue’s current official source is its Police Transparency ArcGIS hub, not CrimeMapping.

**CityProtect** (view-only vendor map; used by Renton and Lakewood)

- Official city pages: Renton [Crime Mapping](https://www.rentonwa.gov/City-Services/Public-Safety-Services/Crime-Statistics-and-Mapping/Crime-Mapping); Lakewood [Crime Statistics](https://cityoflakewood.us/police-homepage/crime-statistics/) (“Lakewood Interactive Crime Map” points at a [cityprotect.com](https://cityprotect.com/map/list/incidents) incidents URL). Renton’s page says the PD “partners with CityProtect,” that the map shows “aggregated dots or clusters,” and that users can open an incident icon for details and register for notifications. Location precision and update cadence are **not stated** on the Renton or Lakewood pages reviewed. The CityProtect [terms URL](https://www.cityprotect.com/terms) did not return usable static terms text in this pass (JavaScript app). **Do not copy CityProtect map data into CrimeStat** until official terms are read; treat it as a view-only vendor map.

**NeighborhoodScout** (modeled statistics, not an incident pin feed)

- [About the data](https://www.neighborhoodscout.com/about-the-data): NeighborhoodScout says it processes “9 million+ reported crimes” / “9.4 million crime incidents” from “18,000+ law enforcement agencies” with “full national coverage,” then uses “120+ crime risk models” to produce “nationally comparable” neighborhood crime risk scores (murder, rape, robbery, assault, burglary, theft, motor vehicle theft). This is **modeled neighborhood risk / rates**, not a public incident API. Because it claims seamless U.S. coverage, these Washington cities would generally have a place page, but that is not a reusable CrimeStat source.
- [Terms of Use](https://www.neighborhoodscout.com/legal/terms-of-use): “You may not modify, publish, transmit, display, participate in the transfer or sale, create or attempt to create derivative works, or in any way exploit any of the Site and/or the Content, in whole or in part. No copying, redistribution, retransmission, publication or exploitation (commercial or otherwise) of the Content is permitted without the express written permission of LOCATION, INC or the Content owner.” Also: “You may not make use of any robots, spiders, or similar data mining, data gathering or extraction tools or manual processes to collect, gather or copy any of the Content in an unauthorized manner. You may not engage in the practices of ‘screen scraping,’ ‘database scraping,’…” and “Systematic retrieval of the Content or other data from the Site to create or compile… a collection, compilation, database or directory without the express written permission of LOCATION, INC is strictly prohibited.” “Commercial resale and/or redistribution of any information, products, and/or services from LOCATION, INC, the Site, and/or the Content are strictly prohibited without prior written consent from LOCATION, INC.”

**CrimeReports.com:** Lake Forest Park’s police records page links generically to [www.crimereports.com](https://www.crimereports.com/) as “Online Crime Maps.” No city-specific feed URL, precision, cadence, or terms were confirmed in this pass. Treat as a view-only vendor homepage link only.

**SNO911 / Snohomish County Sheriff open data:** No standalone SNO911 or Snohomish County Sheriff incident FeatureServer or Socrata feed was found in this pass. The closest official machine-readable SNO911-related feed is Everett’s **Police Incidents** dataset, whose attribution is “SNO911 obfuscated by COE IT and EPD” (see Everett below). Snohomish County’s public crime-mapping page points to LexisNexis Community Crime Map, not to a county open-data dump.

---

### Everett

- **Open feed: yes.** Confirmed [Police Cases `szww-y224`](https://data.everettwa.gov/Safe-Community/Police-Cases/szww-y224) (Socrata API `https://data.everettwa.gov/resource/szww-y224.json`). Metadata `rowsUpdatedAt` November 25, 2026, 3:16 AM PT. `occurredlocationby100block` is “Approximate address of the incident rounded to the 100 block,” plus neighborhood, beat, area, precinct, and `geomcoordinate` for the approximate location. Official description still excludes domestic violence, child abuse, or sex offenses involving minors. Dataset metadata still has **no `licenseId`**.
- **Second official feed, newly confirmed in this pass:** [Police Incidents `f6vp-3svh`](https://data.everettwa.gov/Safe-Community/Police-Incidents/f6vp-3svh) (calls for police response, including officer-initiated activity). Attribution: “SNO911 obfuscated by COE IT and EPD.” Metadata `licenseId` is **`PUBLIC_DOMAIN`** (license name “Public Domain”). `rowsUpdatedAt` November 25, 2026, 3:51 AM PT. Addresses “partially obfuscated to the nearest 100 block.” Same sensitive-case exclusions as Police Cases.
- **Portal terms:** [Open Data Terms of Use and Privacy](https://www.everettwa.gov/2464/Open-Data-Terms-of-Use-and-Privacy) exists; the CivicPlus page did not fully render in this pass, so the complete terms are not quoted. A snippet indexed from that official page includes: “The City of Everett reserves the right to discontinue providing any or all of the data feeds at any time and to require the termination of any and all …” For Police Cases, a license check against the full portal terms is still needed before integration. Police Incidents is labeled Public Domain in Socrata metadata, but the same portal terms page may still apply — read the full page before shipping.
- **LexisNexis:** Official Everett FAQ and the still-posted November 1, 2016 news release describe Community Crime Map as the public county map, with data from the shared regional RMS (New World) and randomly offset locations. That is a view-only vendor map; **do not copy it.** The city’s own Socrata feeds are the legal path for pins.

### Marysville

- **Open incident API / bulk dataset: not found** on the [Marysville Open Data](https://marysville-open-data-marysvillewa.hub.arcgis.com/) hub in this pass (hub exists; no crime-incident dataset was confirmed).
- **Official map:** [Community crime mapping](https://marysvillewa.gov/504/Community-crime-mapping). “LexisNexis Community Crime Map… displays specific crime data for Marysville via an interactive map. Data comes from the Snohomish County records management system. Color-coded icons show the type of crime and basic details for up to one year.” View-only; reuse blocked by LexisNexis terms above.

### Lynnwood

- **Open incident feed: not found.**
- **Official map:** The [Lynnwood Police Department](https://www.lynnwoodwa.gov/Government/Departments/Police-Department) page lists “Community Crime Map” in quick links. The exact destination href was not captured (the page returned HTTP 403 to automated fetch). Given the official Snohomish County LexisNexis map and the other Snohomish PDs, this is almost certainly Community Crime Map, but the href itself was not verified in this pass. Treat as a view-only vendor map unless a city open feed appears.

### Edmonds

- **Open incident feed: not found.** Annual reports and a link to the FBI Crime Data Explorer were found; those are not a pin feed.
- **Official map:** [Police Links](https://www.edmondswa.gov/government/departments/police_department/public_information/police_links) and the [annual reports page](https://www.edmondswa.gov/government/departments/police_department/department_info/edmonds_police_annual_reports_) link to Community Crime Map, including `https://www.communitycrimemap.com/?address=Edmonds,WA?zoom=14`. The page says the site is hosted by a third party. A November 10, 2016 *My Edmonds News* article, describing the official announcement, repeats the LexisNexis / randomly offset location language. View-only.

### Shoreline

- **Open feed: yes, via King County Sheriff, not a city PD feed.** Shoreline is a KCSO contract / partnership city on the official [KCSO crime data](https://kingcounty.gov/en/dept/sheriff/about-king-county/about-sheriff-office/news-data-reports/crime-stats-data) list. Exportable incident data: [KCSO Offense Reports: 2020 to Present `4kmt-kfqf`](https://data.kingcounty.gov/Law-Enforcement-Safety/KCSO-Offense-Reports-2020-to-Present/4kmt-kfqf), 100-block `block_address`, updated daily (metadata earlier today 5:52 AM PT; official text says once every 24 hours, supervisor-approved reports). Official dashboard: [Shoreline](https://kingcounty.maps.arcgis.com/apps/dashboards/285f59bb6c61443ebab55ae66019a6e3). Official map text: “All map points and addresses are approximate to protect the privacy of victims.” Data “refreshed every morning.”
- **License:** King County [open data Terms of Use](https://data.kingcounty.gov/terms) (already quoted in the earlier KCSO section): limited, revocable license to use, reproduce, redistribute, and make available to end users, with the required legend **“data provided by permission of King County.”** Commercial use is not forbidden by the text previously reviewed; attribution is required.
- **LexisNexis / CrimeMapping:** no official Shoreline page linking to those vendors was found in this pass. Use the KCSO feed, not a vendor map.

### Kenmore (shoreline-area, KCSO)

- Same as Shoreline: KCSO contract city; official [Kenmore dashboard](https://kingcounty.maps.arcgis.com/apps/dashboards/83d05839356e4ed29e92eff9a7056c6b); same `4kmt-kfqf` export and King County terms. No separate Kenmore PD open incident dataset was found.

### Lake Forest Park (shoreline-area, own PD, King County)

- **Open incident feed: not found.** The city’s [Open Data Portals](https://www.cityoflfp.gov/609/Open-Data-Portals) page is GIS data (Planning, Public Works, Recreation) via [ArcGIS hub](https://city-of-lake-forest-park-open-data-portal-lfp.hub.arcgis.com/), plus King County GIS — not crime incidents. Annual / operational reports exist.
- **Vendor map:** The police public-disclosure page links “Online Crime Maps” to the generic [crimereports.com](https://www.crimereports.com/) homepage. No city-specific CrimeReports or LexisNexis URL, precision, or terms were confirmed. Not a KCSO contract city on the KCSO crime-maps list reviewed.

### Mountlake Terrace (shoreline-area, own PD, Snohomish County)

- **Open incident feed: not found** on the official site (planning/engineering maps only).
- **Official map:** The [Police Department](https://cityofmlt.com/182/Police) navigation includes “Crime Map” pointing at `https://communitycrimemap.com/`. View-only LexisNexis map; no city open dump.

### Mukilteo

- **Open incident feed: still not found** (this updates the earlier “Community Crime Map was reported in public listings” note with a confirmed official page).
- **Official map:** [Community Crime Map](https://mukilteowa.gov/226/Community-Crime-Map). “The crime mapping system is provided by LexisNexis Risk Solutions.” “This is a no-cost program that configures Mukilteo crime data into a viewable map… The Community Crime Map builds on the regional police records system shared by all Snohomish County police agencies by taking data from police reports and putting it on a map.” “To protect privacy, the actual incident location is randomly offset on the map.” View-only.

### Mill Creek (extra-list city; Snohomish County, own PD)

- **Open incident feed: not found.** Official source remains the [police blotter and statistics](https://millcreekwa.gov/topics/police-blotter-and-statistics) page (weekly PDF blotters). The city maps page is zoning/planning maps, not crime.
- **LexisNexis:** no current official Mill Creek page linking to Community Crime Map was found in this pass (the 2016 countywide rollout claimed all Snohomish agencies, but that is historical and is not treated here as current confirmation).

---

### Renton

- **Open incident API / bulk city feed: not found** in this pass.
- **Official map:** [Crime Mapping](https://www.rentonwa.gov/City-Services/Public-Safety-Services/Crime-Statistics-and-Mapping/Crime-Mapping). “The Renton Police Department partners with CityProtect to provide a visual overview of neighborhood crime.” The map shows “aggregated dots or clusters”; clicking an icon shows incident details; users can filter date/day/time/type and register for alerts. View-only vendor map (see CityProtect above). Not confirmed on LexisNexis Community Crime Map or CrimeMapping.com official city pages.

### Kent

- **Open incident / block-level Kent PD feed: still not found** on [kentwa.gov](https://www.kentwa.gov/departments/police-department). No official city page linking to Community Crime Map, CrimeMapping.com, or a confirmed SpotCrime official link was found in this pass (third-party directories mentioning SpotCrime are not official). City-level annual totals remain available via the WASPC / SAC NIBRS workbook already used in the app. KCSO `4kmt-kfqf` rows labeled “KENT” are still not Kent PD data.

### Vancouver (Washington)

- **Live open incident pin feed: not found.** The City of Vancouver Open Data Hub’s crime-related public item is a **document link** to LexisNexis: [Community Crime Map -- LexisNexis](https://www.arcgis.com/home/item.html?id=10bdff4ffbb44f2c96dda764160cd04a) (`https://communitycrimemap.com/map`). Official snippet: “Crime data in this external webmap service is provided by Vancouver Police Department and other local area agencies. This is a data product not produced by the City of Vancouver and is provided as a link only for ease of access.” The item description adds: “Any sale, reproduction or distribution of this information, or products derived therefrom, in any format is expressly prohibited.”
- **Limited official GIS layer, not a pin feed:** [Violent and Property Crime 2021_2024_WFL1](https://services.arcgis.com/oNvpY90qsPDizwkN/arcgis/rest/services/Violent_and_Property_Crime_2021_2024_WFL1/FeatureServer) (53,068 rows in this pass). Official service description: “Shows only crimes reported from 2021-2024; includes only crime types specified in Strategic Plan Performance Measure SPC.PM.1. Does not include fields that indicate personally identifiable or specific location data.” A one-row sample had report date, NIBRS group/code, case status, and `beat_gis` only — **no address or coordinates**. That is beat-level selected offenses through 2024, not a current incident map.
- **Hub GIS terms** (on the CCM document item and other COV GIS items): “COV grants you a limited, non-exclusive license to access the GIS Data solely for your personal use.” “You may not sell, reproduce, or distribute the GIS Data.” Even the 2021–2024 layer should be treated as restricted until counsel/product review; it is also not current and has no pins.

### Bellevue

- **Open feeds exist on the official Police Transparency / ArcGIS stack**, [hub](https://bpd-transparency-cobgis.hub.arcgis.com/) / [crime stats](https://bpd-transparency-cobgis.hub.arcgis.com/pages/crime-stats), org `EYzEZbDhXZjURPbP`, confirmed as City of Bellevue (`SGibson@bellevuewa.gov_cobgis`).
  - **`Crime_Cases_By_100_Block`** FeatureServer: [layer](https://services1.arcgis.com/EYzEZbDhXZjURPbP/ArcGIS/rest/services/Crime_Cases_By_100_Block/FeatureServer). 2,103 rows. Addresses already in 100-block form (sample “300 BLK W LAKE SAMMAMISH PKWY NE”). **Stale:** reported dates in a one-row min/max check run only from November 26, 2021, 10:01 PM PT through March 7, 2022, 4:35 AM PT. Not usable as a current feed.
  - **`Offenses` / layer `Crimes`:** [FeatureServer layer 1](https://services1.arcgis.com/EYzEZbDhXZjURPbP/ArcGIS/rest/services/Offenses/FeatureServer/1). 77,189 rows. Fields include case number, from/report dates, NIBRS code, statute keyword, sector/district, latitude, longitude. One-row min/max on `REPORT_DATE` ran from January 1, 2019, 1:19 AM PT to **November 22, 2026, 4:55 PM PT** (sample case `2026-00062954`, keyword THEFT). Coordinates in the samples were stored to three decimal degrees. The layer description and copyright fields were empty; official blurring policy was not stated on the service.
  - **`Incidents`:** [FeatureServer](https://services1.arcgis.com/EYzEZbDhXZjURPbP/ArcGIS/rest/services/Incidents/FeatureServer). 401,838 rows. This is a **calls-for-service / CAD-style** layer (sample `INC_TYPE` “ASSIST”, `SOURC_DESC` “911”, response-time fields), with a 2026 incident number in the one-row sample. A related public web map item “Incidents” was last modified September 11, 2026, 2:10 PM PT. Date-range queries timed out in this pass; currency of the full layer was not fully bounded.
- **License / terms:** The public Incidents web map item carries this City of Bellevue disclaimer: “The information on this site is a geographic representation derived from the City of Bellevue Geographic Information System. The City of Bellevue does not guarantee that the information on this site is accurate or complete. This data is provided on an ‘as is’ basis… **Any commercial use or sale of this data or portions thereof, is prohibited without express written authorization by the City of Bellevue.**” The FeatureServers themselves had empty `copyrightText`. Do not integrate Bellevue layers into CrimeStat without a written license reading and, given that sentence, likely written authorization. CrimeStat is free and has no ads, but “commercial use” is not defined in the quoted text.
- **LexisNexis / CrimeMapping:** no current official Bellevue page confirming those vendors was found; the current official path is the transparency hub.

### Federal Way

- **Open incident API / bulk feed: not found.**
- **Official map:** [Crime Statistics](https://www.federalwaywa.gov/page/crime-statistics) links to Community Crime Map at `https://www.communitycrimemap.com/?address=33325%208th%20Ave%20S%20Federal%20way%2cWA`. Official text: “Community Crime Map obtains case report information from Federal Way’s records management system.” Available fields: incident type, case report number, date and time reported, and “Location of the incident rounded to the hundred block.” “Data is automatically updated several times a day.” View-only; reuse blocked by LexisNexis terms.

### Lakewood

- **Open incident API / bulk feed: not found.** Official [Crime Statistics](https://cityoflakewood.us/police-homepage/crime-statistics/) page publishes annual and quarterly PDF reports (annual through 2024; quarterly at least through Q1 2025).
- **Official map:** the same page’s “Lakewood Interactive Crime Map” is a **CityProtect** incidents URL, not an open dump. View-only vendor map. No official LexisNexis or CrimeMapping.com link was found.

### Puyallup

- **Official map / dashboard, not a documented public CSV/API in this pass:** [Crime Statistics](https://www.puyallupwa.gov/343/Crime-Statistics) “Community Crime Map” links to the public ArcGIS item [City of Puyallup Crime Dashboard](https://www.arcgis.com/apps/opsdashboard/index.html#/8586ba874d77477196851571e52bc0c4) (item id `8586ba874d77477196851571e52bc0c4`). Official item text: “Dashboard of crimes committed within Puyallup city limits. Data entry by Puyallup PD. Data repository stored by Pierce County. Dashboard created and maintained by City of Puyallup GIS.” The **item** was last modified July 2, 2021, 11:48 AM PT; live data currency inside the dashboard was **not verified** in this pass (no layer date-range check). Location precision was not stated on the city page or item text reviewed.
- **License:** the dashboard item points to [Pierce County GIS Data Terms of Use](https://matterhorn.co.pierce.wa.us/Disclaimer/PierceCountyGISDataTermsofUse.pdf) (PDF dated May 29, 2026). Key lines: “Pierce County makes GIS data… available without charge as a public service on the express condition that users who view, download, transfer or otherwise access or use the Data expressly agree to these Terms of Use.” Data is “AS IS” and “WITH ALL FAULTS.” If a user transfers the data or uses it with an end user “in a format or context revealing Pierce County as the source of the Data,” the user “agree[s] to inform such user(s), by copy of these Terms of Use or otherwise, that Pierce County does not warrant the Data…” “Maps or applications using this Data may not include the Pierce County logo, or any text or other content suggesting they are a direct product of Pierce County.” “Pierce County may require the termination of all display, distribution, or other use of any or all Data for any reason…” Commercial reuse is not expressly forbidden in the PDF text reviewed; the license is conditional and revocable. A reusable FeatureServer behind the dashboard was not isolated in this pass.
- **LexisNexis / CrimeMapping:** the city’s “Community Crime Map” label points at the ArcGIS dashboard above, not at communitycrimemap.com.

### Issaquah

- **Open reusable incident API: still not found** on [Issaquah Open Data](https://open-data-issaquahwa.hub.arcgis.com/datasets) (re-stated from the earlier pass; not re-crawled dataset-by-dataset here).
- **Official interactive map / reports:** [Data and Statistics](https://www.issaquahwa.gov/3370/Data-and-Statistics) links a Community Dashboard and a Crime Map (previously identified as [pd21.communitydashboard.info/Issaquah/Mapping/](https://pd21.communitydashboard.info/Issaquah/Mapping/)), plus weekly blotters and monthly/annual PDFs. This is a vendor / interactive dashboard, not a confirmed open dump. Terms and location precision were not fully re-verified in this evening pass. No official LexisNexis or CrimeMapping.com link was found.

---

### Practical takeaway (not done in this pass)

Best legal, machine-readable next candidates among the cities just re-checked, pending the license caveats already noted:

1. **Everett Police Cases `szww-y224` and/or Police Incidents `f6vp-3svh`** — official, current, 100-block; Incidents is labeled Public Domain in metadata, Cases still needs a full portal-terms read.
2. **KCSO `4kmt-kfqf` for Shoreline and Kenmore** (and other listed contract cities) — daily, 100-block, required King County attribution.
3. **Bellevue `Offenses` / `Crimes` layer** — current into November 22, 2026, but city terms prohibit “commercial use or sale” without written authorization; do not add until that is resolved in writing.
4. **Puyallup dashboard / Pierce County repository** — possible official path, but live currency and a documented export were not confirmed; Pierce County GIS terms would apply.

Do **not** copy LexisNexis Community Crime Map, CityProtect, CrimeMapping.com, CrimeReports, or NeighborhoodScout data into the app. Outbound “see the city’s official crime map” links are the only vendor-map option consistent with the terms quoted above.

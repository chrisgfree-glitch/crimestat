# US open crime-incident feed scan (outside Washington)

**Scan date:** November 25, 2026 (America/Los_Angeles).  
**Scope:** Research only. No app changes and no deploys. This is a lean catalog pass for later US coverage, not an implementation list.

**Universe:** The 50 largest U.S. incorporated places by Census Bureau July 1, 2024 population estimates (file `SUB-IP-EST2024-ANNRNK.xlsx`). Seattle (#18, Washington) is out of scope for this file. Aurora, Colorado (#51) is included so the non-Washington set still has 50 cities. Obvious statewide and county portals are in a separate section.

**Method:** Quick metadata lookups only — Socrata catalog/view APIs, CKAN `package_show` / `datastore_search` with `limit=0`, ArcGIS item/layer metadata, and portal `data.json` catalogs. One-row `max(date)` aggregates were used where a date field was already known. No bulk incident downloads and no vendor-map scrapes (LexisNexis, CrimeMapping, etc.).

**Verdicts used here:**

- **ready** — official incident-level (or official area-unit) open feed, reuse license is clearly public (Public Domain, CC0, PDDL, CC BY, or ODC-BY / ODC-PDDL), and the catalog shows 2026 currency.
- **needs terms check** — a real official feed exists, but the license is missing, points to “see terms,” is share-alike / non-commercial, or has a research-only / informational-only restriction that may block a public map; or location/currency still needs a closer read.
- **no feed** — no official incident-level open feed was found in this pass (aggregates, PDFs, fire/CAD-only, or stale/legacy files are noted).

These verdicts are conservative. A “ready” city can still need CrimeStat privacy work (no street addresses as pins; rape / sexual assault, domestic violence, and stalking as area totals only).

**Counts (50 non-Washington cities):** **8 ready**, **15 needs terms check**, **27 no feed** found in this pass.

Statewide/county portals are counted separately below (none were marked ready as a drop-in national pin source).

---

## Top ready cities by size

Fewer than 15 cities met the strict “ready” bar in this lean pass. The eight that did, in Census size order:

1. **San Antonio, TX** (#7) — SAPD Offenses, CC BY, updated 2026-11-25; location in the datastore is service area / ZIP, not points.
2. **Fort Worth, TX** (#11) — CFW Police Crime Data Points, CC BY 4.0, catalog update 2026-11-23; point layer.
3. **Austin, TX** (#13) — Crime Reports, Public Domain, weekly, latest occurred date 2026-11-21; census block group, not pins.
4. **Columbus, OH** (#15) — Police Incident Reports, CC0; item last modified 2026-08-27 (confirm whether the layer is still moving).
5. **San Francisco, CA** (#17) — Police Department Incident Reports 2018–present, PDDL, points mapped to nearby intersections, latest incident date 2026-11-24.
6. **Washington, DC** (#22) — MPD Crime Incidents (last 30 days and 2026 annual), CC BY 4.0, block-level, item update 2026-11-25.
7. **Boston, MA** (#25) — Crime Incident Reports (Aug 2015–present), ODC-PDDL, resource update 2026-11-25; fields include `STREET`, `Lat`, `Long`.
8. **Kansas City, MO** (#38) — KCPD Crime Data 2026, Public Domain, weekly, latest report date 2026-11-23; an `Address` field is present and was not described as redacted in metadata — coarsen before any public pins.

**Strong next candidates (needs terms check, but the feeds are current and official):** New York, Los Angeles (LAPD NIBRS 100-block), Chicago (block-level, daily), Dallas (daily, ODC-BY plus a “research purposes only” disclaimer), Philadelphia, Oakland (block address), Charlotte (CC BY-NC-SA 4.0), Nashville, Milwaukee (CC BY, daily; location fields not confirmed), Detroit RMS 2026, Las Vegas metro (LVMPD NIBRS layer, no license text on the item).

---

## City findings

Population is the Census July 1, 2024 estimate. Latest dates are as returned by metadata or a one-row max query, in the source’s own timezone representation unless noted.

### 1. New York, NY (8,478,072) — needs terms check

- **Portal / id:** [NYC Open Data](https://data.cityofnewyork.us) — NYPD Complaint Data Current (Year To Date) `5uac-w243`; Historic `qgea-i56i`.
- **Granularity:** `Latitude` / `Longitude` / `Lat_Lon` and precinct fields. The YTD description does not itself say “block midpoint”; confirm in the attached data dictionary before treating as 100-block.
- **Cadence / latest:** Metadata says **quarterly**. YTD `rowsUpdatedAt` 2026-11-05; `max(cmplnt_fr_dt)` = 2026-09-30. Historic is annual and runs through 2025-12-31.
- **License:** `licenseId` is empty on both views. Attribution: Police Department (NYPD). The NYC Open Data terms page did not return usable license text in this pass (JS/shell page).
- **Verdict:** **needs terms check.** The feed is official and current through Q3 2026, but reuse is not stated in the dataset metadata.

### 2. Los Angeles, CA (3,878,704) — needs terms check

- **Portal / id:** [data.lacity.org](https://data.lacity.org) — **LAPD NIBRS Offenses** `k7nn-b2ep` (current). Legacy UCR file “Crime Data from 2020 to 2024” `2nrs-mtv8` ends 2024-12-30 and is no longer the live series (LAPD notice: transition to NIBRS).
- **Granularity:** Official **hundred-block** location plus `hndrdth_lat` / `hndrdth_lon`. Dataset text: “This dataset includes three additional data elements: • The hundred block location of the incident • The latitude of that hundred block • The longitude of that hundred block.”
- **Cadence / latest:** NIBRS view updated 2026-11-24; `max(date_occ)` = 2026-11-14. Refresh rate in custom metadata: “Other - See Description.”
- **License:** NIBRS view has **no `licenseId`**. The legacy 2020–2024 file is **CC0 1.0** (“Creative Commons 1.0 Universal (Public Domain Dedication)”), terms link `http://creativecommons.org/publicdomain/zero/1.0/legalcode`, attribution “Los Angeles Police Department.” Do not assume the NIBRS file inherits CC0 without a check.
- **Verdict:** **needs terms check** (license gap on the current NIBRS file). Technically one of the strongest pin candidates in this scan.

### 3. Chicago, IL (2,721,308) — needs terms check

- **Portal / id:** [data.cityofchicago.org](https://data.cityofchicago.org) — Crimes - 2001 to Present `ijzp-q8t2`.
- **Granularity:** Block. Description: “In order to protect the privacy of crime victims, addresses are shown at the block level.” Fields include `Block`, `Beat`, `District`, `Latitude`, `Longitude`.
- **Cadence / latest:** “Data are updated daily.” “2001 to present, minus the most recent seven days.” `rowsUpdatedAt` 2026-11-25; `max(date)` = 2026-11-17 (consistent with the seven-day lag).
- **License:** `licenseId` **SEE_TERMS_OF_USE** (“See Terms of Use”). The City data-terms page did not yield a reusable quote here (JS-heavy). Attribution: Chicago Police Department.
- **Verdict:** **needs terms check.** Feed quality is high; portal terms must be read in full.

### 4. Houston, TX (2,390,125) — no feed

- **Portal:** [data.houstontx.gov](https://data.houstontx.gov) dataset “Houston Police Department Crime Statistics” (CKAN id `50851cc3-bd84-4aec-b530-f17694b105cf`), license **ODC-BY**, last catalog modification 2023-06-09. Landed on HPD statistics HTML pages (`https://www.houstontx.gov/police/cs/index-2.htm`), not an incident API.
- **Verdict:** **no feed** (no incident-level open dataset found in this pass).

### 5. Phoenix, AZ (1,673,164) — no feed (as a live 2026 series)

- **Portal / id:** [phoenixopendata.com](https://www.phoenixopendata.com) — Crime Data, CKAN id `cc08aace-9ca9-467f-b6c1-f0879ab1a358`.
- **Granularity:** **100-block.** Datastore fields include `100 BLOCK ADDR`, `ZIP`, `PREMISE TYPE`, `GRID`.
- **Cadence / latest:** Package notes: “crime incidents from November 1st, 2015 forward through December 31, 2025.” CSV resource last modified 2026-02-02. This is a closed through-2025 file, not an observed 2026 rolling feed.
- **License:** **ODC-BY** (`http://www.opendefinition.org/licenses/odc-by`).
- **Verdict:** **no feed** for a current rolling snapshot. The 2015–2025 100-block file is openly licensed if a historical layer is wanted later.

### 6. Philadelphia, PA (1,573,916) — needs terms check

- **Portal:** [OpenDataPhilly / data.phila.gov](https://opendataphilly.org) — Crime Incidents. Carto table `incidents_part1_part2` (SQL API under `phl.carto.com`). Landing/visualization: `https://data.phila.gov/visualizations/crime-incidents`.
- **Granularity:** Point geometry is exposed in the catalog CSV query (`ST_Y(the_geom) AS lat`, `ST_X(the_geom) AS lng`). Block-vs-address redaction was not confirmed in this pass.
- **Cadence / latest:** Catalog periodicity `R/P1D` (daily). Row-level max date not queried.
- **License:** Catalog points to `https://metadata.phila.gov/#help/help-faqs/what-are-the-terms-of-use/`. That page did not render usable license text here (JS).
- **Verdict:** **needs terms check.** Official and apparently daily, but terms and point precision need a full read.

### 7. San Antonio, TX (1,526,656) — ready

- **Portal / id:** [data.sanantonio.gov](https://data.sanantonio.gov) — SAPD Offenses, CKAN id `04991fd6-25aa-47ed-946c-4ea204ab3558`, resource `f36bb931-8fb4-481c-83d9-a3589108bb20`.
- **Granularity:** Datastore fields: `Report_ID`, `Report_Date`, `NIBRS_Code_Name`, `Service_Area`, `Zip_Code`, `DateTime`. **No coordinates** in the datastore schema — service area / ZIP only.
- **Cadence / latest:** Resource last modified 2026-11-25T11:30:19.
- **License:** **CC BY** (`http://www.opendefinition.org/licenses/cc-by`).
- **Verdict:** **ready** for area totals, not pins, unless a separate official point layer is found later.

### 8. San Diego, CA (1,404,452) — no feed

- Portal `data.sandiego.gov` did not return a crime-incident dataset in catalog, CKAN, or a clean official ArcGIS item search (results were dominated by other cities). **no feed** found in this pass.

### 9. Dallas, TX (1,326,087) — needs terms check

- **Portal / id:** [dallasopendata.com](https://www.dallasopendata.com) — Police Incidents `qv6i-rri7`.
- **Granularity:** Fields include `Incident Address`, `Beat`, `Reporting Area`, `X Coordinate`, `Location1`. Metadata does not say the address is a 100-block. CrimeStat would need to coarsen if the field is a street address.
- **Cadence / latest:** Custom metadata: “Update Frequency: Daily.” `rowsUpdatedAt` 2026-11-25; `max(date1)` = 2026-11-24. Covers RMS incidents from June 1, 2014 to current.
- **License:** **ODC-BY** (“Open Data Commons Attribution License”), terms `http://opendatacommons.org/licenses/by/1.0/`, attribution Dallas Police Department. Dataset description also says: “This dataset is published by the City of Dallas for **research purposes only**. The authoritative source for crime data is the Crime Analytics Dashboard.”
- **Verdict:** **needs terms check** because of the research-only disclaimer, despite ODC-BY.

### 10. Jacksonville, FL (1,009,833) — no feed

- Listed portals (`opendata.coj.net`, `data.coj.net`) did not respond with a usable catalog in this pass. **no feed** found.

### 11. Fort Worth, TX (1,008,106) — ready

- **Portal:** City ArcGIS Hub / data catalog — **CFW Police Crime Data Points** and **CFW Police Crime Data Table**, plus reporting areas / beats / districts. (Socrata id `k6ic-7kp7` “Crime Data” also appeared in a federated catalog with update 2025-07-13; the live ArcGIS layers are the ones used here.)
- **Granularity:** Official point layer (“Crime Data Points”). Exact block-vs-address was not read from layer fields in this pass — confirm before publishing pins.
- **Cadence / latest:** Points/table items modified 2026-11-23.
- **License:** **CC BY 4.0** (`https://creativecommons.org/licenses/by/4.0`) on the points and table items.
- **Verdict:** **ready**, with a granularity confirm.

### 12. San Jose, CA (997,368) — no feed

- ArcGIS.com had only **Police Calls 2014–2016** (stale). No current incident open feed found. **no feed.**

### 13. Austin, TX (993,588) — ready

- **Portal / id:** [data.austintexas.gov](https://data.austintexas.gov) / datahub — Crime Reports `fdj4-gpfu`. Related: NIBRS Group A Offense Crimes `i7fg-wrk5` (monthly; metadata time range “January 1, 2019 to October 31, 2026”; no `licenseId` on the NIBRS view).
- **Granularity:** Crime Reports fields include `Location Type`, `Council District`, `APD District`, `Census Block Group`. **No lat/lon** in the view columns — census block group / district, not pins.
- **Cadence / latest:** Custom metadata: “Update Frequency: Weekly.” `rowsUpdatedAt` 2026-11-23; `max(occ_date)` = 2026-11-21. “Occurred Date: January 1, 2003 - November 21, 2026.”
- **License:** **Public Domain** (`licenseId` PUBLIC_DOMAIN). Attribution: “City of Austin, Texas - data.austintexas.gov.”
- **Verdict:** **ready** for area totals. Use `fdj4-gpfu` (clear PD). Treat `i7fg-wrk5` as a terms check if needed for NIBRS coding.

### 14. Charlotte, NC (943,476) — needs terms check

- **Portal / id:** [data.charlottenc.gov](https://data.charlottenc.gov) — CMPD Incidents, ArcGIS item `d22200cd879248fcb2258e6840bd6726`, layer `https://gis.charlottenc.gov/arcgis/rest/services/CMPD/CMPDIncidents/MapServer/0`. Also CFS, homicide, and traffic-stop layers.
- **Granularity:** Not fully field-read here. Snippet: includes criminal and non-criminal incident report types.
- **Cadence / latest:** Item modified 2026-11-18.
- **License:** **CC BY-NC-SA 4.0** (`https://creativecommons.org/licenses/by-nc-sa/4.0/`). Non-commercial plus share-alike may or may not fit a free, no-ads public map — needs a legal read.
- **Verdict:** **needs terms check.**

### 15. Columbus, OH (933,263) — ready

- **Portal / id:** [opendata.columbus.gov](https://opendata.columbus.gov) — Police Incident Reports, item `b70656e5b22d4a7db8af9b4289bf8c27`, FeatureServer `https://services1.arcgis.com/9yy6msODkIBzkUXU/arcgis/rest/services/Police_Incident_Reports/FeatureServer`. Related offense and property record layers.
- **Granularity:** Official incident-report layer (points expected; fields not fully listed here). Confirm block vs address.
- **Cadence / latest:** Item last modified 2026-08-27. Live row currency was not queried. Confirm the layer is still updating before a snapshot.
- **License:** “This data is dedicated to the public domain under the Creative Commons Universal License (CC0).” Catalog also lists `https://creativecommons.org/publicdomain/zero/1.0`.
- **Verdict:** **ready**, with a currency confirm.

### 16. Indianapolis, IN (891,484) — no feed

- `data.indy.gov` listed IMPD UCR year files, including “IMPD UCR Current Year,” last modified 2025-03-12, license string “To be added.” These look like UCR tables, not a current incident pin feed. **no feed** (no current incident-level open API found).

### 17. San Francisco, CA (827,526) — ready

- **Portal / id:** [data.sfgov.org](https://data.sfgov.org) — Police Department Incident Reports 2018 to Present **`wg3w-h783`** (the historical 2003–May 2018 file `tmnf-yvry` points here; older id `wg3w-h4m9` is gone).
- **Granularity:** “All incident locations are mapped to nearby **intersections** to ensure anonymity.” Fields: `latitude`, `longitude`, `point`, analysis neighborhood, supervisor district.
- **Cadence / latest:** `rowsUpdatedAt` 2026-11-25; `max(incident_date)` = 2026-11-24.
- **License:** **Open Data Commons Public Domain Dedication and License (PDDL)**, terms `http://opendatacommons.org/licenses/pddl/1.0/`. Attribution: Police Department. Historical file is also PDDL.
- **Verdict:** **ready.**

### 18. Seattle, WA — out of scope

Already on CrimeStat (Washington). Census rank 18, population 780,995. Not counted in the totals above.

### 19. Denver, CO (729,019) — no feed

- `data.denvergov.org` is not a live Socrata catalog in this pass. A targeted ArcGIS search did not return a City and County of Denver crime-incident item (results were other agencies). **no feed** found here; worth a dedicated Denver open-data follow-up.

### 20. Oklahoma City, OK (712,919) — no feed

- Listed portals did not return a usable crime-incident catalog. **no feed** found.

### 21. Nashville, TN (704,963) — needs terms check

- **Portal:** [data.nashville.gov](https://data.nashville.gov) — “Metro Nashville Police Department Incidents,” catalog modified 2026-11-25T11:14:08. Also multi-year Calls for Service layers (2024 CFS modified 2026-10-01).
- **Granularity / license:** Location fields were not pulled. License text on the catalog is: “Metro’s Open Data Executive Order provides the policy and guidance governing the portal and is available [here](https://www.nashville.gov/departments/metro-clerk/legal-resources/executive-orders/mayor-freddie-oconnell/fo018) for review.”
- **Verdict:** **needs terms check** (executive-order terms + granularity).

### 22. Washington, DC (702,250) — ready

- **Portal:** [opendata.dc.gov](https://opendata.dc.gov) / DCGIS — Crime Incidents in the Last 30 Days, item `dc3289eab3d2400ea49c154863312434`, layer `https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/FeatureServer/39`. Annual: Crime Incidents in 2026, item `c92a2cee0111473985c389e7a0805ea5`, FeatureServer layer 41 (item update 2026-11-25). Older annual layers also exist (through 2025 and prior).
- **Granularity:** **Block.** Fields include `BLOCK`, `BLOCK_GROUP`, `CENSUS_TRACT`, `LATITUDE`, `LONGITUDE`, `DISTRICT`, `PSA`. Snippet: geography is “anonymization to the block level.”
- **Cadence / latest:** 30-day item modified 2026-11-25T11:18:45Z. Rolling 30-day plus annual YTD.
- **License:** “This work is licensed under a Creative Commons Attribution 4.0 International License.” Attribution: Metropolitan Police Department.
- **Verdict:** **ready.**

### 23. El Paso, TX (681,723) — no feed

- Listed geoportal/open-data hosts did not return a usable incident catalog. **no feed** found.

### 24. Las Vegas, NV (678,922) — needs terms check

- The city open-data host did not yield a dataset. An official **Las Vegas Metropolitan Police Department** FeatureServer was found: “LVMPD Reported NIBRS Crimes,” `https://services.arcgis.com/jjSk6t82vIntwDbs/arcgis/rest/services/Weekly_Public_Crimes/FeatureServer`, item `c1ec788896ae46e0b896b72cb98e7ae8`. Snippet: “Reported NIBRS crime incidents for the Las Vegas Metropolitan Police Department area, including location, offense classification, and update information.” Related persons/property layers exist. Item last modified 2026-07-21 07:56 PT (layer row currency not queried). **No license text** on the item.
- **Verdict:** **needs terms check** (metro PD layer, not a city-limits-only file; license and live currency need a read). LVMPD also covers unincorporated Clark County.

### 25. Boston, MA (673,458) — ready

- **Portal / id:** [data.boston.gov](https://data.boston.gov) — Crime Incident Reports (August 2015 - To Date) (Source: New System), CKAN id `6220d948-eae2-4e4b-8723-2dc8e67722a3`. Current resource “Crime Incident Reports - 2023 to Present” `b973d8cb-eeb2-4e7e-99da-c92938efc9c0`.
- **Granularity:** Datastore fields include `STREET`, `Lat`, `Long`, `Location`, `DISTRICT`, `REPORTING_AREA`. Confirm whether `STREET` is a named street / intersection or a full address (Boston often withholds house numbers; not verified here).
- **Cadence / latest:** Current resource last modified 2026-11-25T17:07:59. Package notes data is “complete through present,” excluding records under **MGL ch.41 s.98f**.
- **License:** **ODC-PDDL** (`http://www.opendefinition.org/licenses/odc-pddl`).
- **Verdict:** **ready**, with a street-field confirm.

### 26. Detroit, MI (645,705) — needs terms check

- **Portal:** [data.detroitmi.gov](https://data.detroitmi.gov) — RMS Crime Incidents 2026, item `fc701d4b3e14413db2d9f78f0ae0a105`, `https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/RMS_Crime_Incidents_2026/FeatureServer`. Owner `topsoil.integration_detroitmi`. Access information: “Detroit Police Departmet (DPD).” Yearly RMS and CAD layers also exist.
- **Granularity:** `nearest_intersection`, `latitude`, `longitude`, `neighborhood`, `police_precinct`, `census_block_2020_geoid`.
- **Cadence / latest:** Item modified 2026-01-09 — that is early for a late-2026 YTD layer; **live row currency was not queried** and must be checked.
- **License:** None on the item or layer metadata.
- **Verdict:** **needs terms check** (license + currency).

### 27. Louisville, KY (640,796) — no feed

- Louisville Metro / LOJIC hub search did not surface a current crime-incident layer in this pass (unrelated animal-services hits dominated the `data.json` slice). Portal terms page exists (`louisville-metro-opendata-lojic.hub.arcgis.com/pages/terms-of-use-and-license`) if a feed is found later. **no feed** found here.

### 28. Portland, OR (635,749) — no feed

- `gis-pdx.opendata.arcgis.com` search endpoint did not return dataset results in this pass. **no feed** found.

### 29. Memphis, TN (610,919) — no feed

- Memphis Open Data Hub search endpoint did not return dataset results. **no feed** found.

### 30. Baltimore, MD (568,271) — no feed (legacy only)

- Official item “Part 1 Crime Data (Legacy SRS),” owner `baltimore_city`, FeatureServer `https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Part1_Crime_Beta/FeatureServer`. Snippet: “Data is updated weekly. This dataset contains crime data **up to 12/31/2024** under the Summary Reporting System (SRS).” Item modified 2025-01-22. No current 2025–2026 NIBRS successor was identified in this pass. Older CC BY 3.0 incident-report documents from 2022 are not a feed.
- **Verdict:** **no feed** for current incidents (legacy SRS through 2024 only).

### 31. Milwaukee, WI (563,531) — needs terms check

- **Portal:** [data.milwaukee.gov](https://data.milwaukee.gov) — NIBRS Crime Data (Current), CKAN name `wibr`, license **CC BY** (`http://www.opendefinition.org/licenses/cc-by`). Notes: “Update Frequency: Daily. Current year to date.” Resource last modified 2026-11-25T09:51:11. Historical package `wibrarchive` is also CC BY.
- **Granularity:** Datastore field list did not return usable columns in this pass (`datastore_search` only showed `_id`). Location precision is **unconfirmed**.
- **Verdict:** **needs terms check** is slightly wrong on terms (CC BY is clear) — treat as **needs terms check** only in the sense of **granularity / schema confirm** before pins. License itself is ready.

### 32. Albuquerque, NM (560,326) — no feed

- Listed GIS/open-data hosts did not return a usable incident catalog. **no feed** found.

### 33. Tucson, AZ (554,013) — needs terms check

- **Portal:** [gisdata.tucsonaz.gov](https://gisdata.tucsonaz.gov) — yearly `TPDOpenData_ReportedCrimes_YYYY`, including **2026** (modified 2026-09-21). Earlier years 2018–2024 are also published.
- **License / granularity:** Not captured in the `data.json` slice. Latest 2026 item date is September, so currency after that is unverified.
- **Verdict:** **needs terms check** (license, fields, and whether 2026 is still updating).

### 34. Fresno, CA (550,105) — no feed

- No official incident dataset found in this pass. **no feed.**

### 35. Sacramento, CA (535,798) — no feed

- No official city incident dataset found (ArcGIS search returned only unrelated story maps). **no feed.**

### 36. Atlanta, GA (520,070) — no feed

- Open-data host did not return a usable catalog. **no feed** found.

### 37. Mesa, AZ (517,151) — no feed

- `data.mesaaz.gov` Socrata catalog search for crime/police returned 0 datasets. **no feed.**

### 38. Kansas City, MO (516,032) — ready

- **Portal / id:** [data.kcmo.org](https://data.kcmo.org) — **KCPD Crime Data 2026** `f7wj-ckmw`. Prior year files exist (2020–2025 and a 2015–present rollup).
- **Granularity:** Fields include `Beat`, `Address`, `Location`. Metadata does **not** say the address is a 100-block. Confirm and coarsen if needed.
- **Cadence / latest:** Custom metadata: “Update Frequency: weekly.” `rowsUpdatedAt` 2026-11-23; `max(report_date)` = 2026-11-23T06:23:22.
- **License:** **Public Domain** (`licenseId` PUBLIC_DOMAIN). Attribution: KCPD Information Technology. Disclaimer in the description is a no-warranty / hold-harmless statement, not a reuse ban.
- **Verdict:** **ready**, with an address-coarsening confirm.

### 39. Raleigh, NC (499,825) — needs terms check

- Official FeatureServer: “Raleigh Police Department Crime Incidents - Past 90 Days,” owner `OpenData_ral`, item `a1f2d9204a184404b5a4c7e0fdceb6d0`, `https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Raleigh_Police_Incidents_Last_90_Days/FeatureServer`. Snippet: “Detailed spatial data on crime incidents reported to the Raleigh Police Department, including crime types, locations, and times.” Item last modified 2026-06-17 19:40 PT; **live 90-day currency not queried. No license text on the item.**
- **Verdict:** **needs terms check.**

### 40. Colorado Springs, CO (493,554) — no feed

- `data.coloradosprings.gov` Socrata search for crime returned 0 in-domain datasets. **no feed** found.

### 41. Omaha, NE (489,265) — no feed

- City ArcGIS Hub search was not accessible here (401). **no feed** found in this pass.

### 42. Miami, FL (487,014) — no feed

- City portal and Miami-Dade hub search endpoints did not return dataset results. A Miami-Dade county follow-up is still worthwhile (see county section). **no feed** found for the City of Miami in this pass.

### 43. Virginia Beach, VA (454,808) — no feed

- Catalog hits were **Police Calls for Service** (item modified 2025-08-06) and a priority-description table — CAD, and not clearly current. No crime-incident dataset found. **no feed.**

### 44. Long Beach, CA (450,901) — no feed

- No official incident dataset found in this pass. **no feed.**

### 45. Oakland, CA (443,554) — needs terms check

- **Portal / id:** [data.oaklandca.gov](https://data.oaklandca.gov) — CrimeWatch Data `ppgh-7dqv` (full history) and CrimeWatch Maps Past 90-Days `ym6k-rx7a`.
- **Granularity:** **Block address.** Both descriptions: “Be advised that the exact address of each crime has been substituted with the block address to protect the privacy of the victim.” Fields include `Address` / `ADDRESS`, `PoliceBeat`, `Location`.
- **Cadence / latest:** Notes say to allow up to 90 days after month-end for a month to be complete. Full file `rowsUpdatedAt` 2026-11-25; `max(datetime)` = 2026-11-21T23:04:00. 90-day file also updated 2026-11-25.
- **License:** **No `licenseId`** on either view. Attribution: Oakland Police Department.
- **Verdict:** **needs terms check** (clear official block-level feed; reuse terms missing from metadata).

### 46. Minneapolis, MN (428,579) — needs terms check

- **Portal:** [opendata.minneapolismn.gov](https://opendata.minneapolismn.gov) — yearly `Police_Incidents_YYYY` layers, license **CC0 1.0** on the annual files inspected. The `data.json` slice listed years through 2022 (and similar), not a clearly current 2025/2026 layer. A hub search for 2025/2026 did not return parseable results here.
- **Verdict:** **needs terms check** (license on older years is CC0; confirm whether a current-year official layer exists).

### 47. Bakersfield, CA (417,468) — no feed

- No official incident dataset found. **no feed.**

### 48. Tulsa, OK (415,154) — no feed

- City hub search returned 401. **no feed** found in this pass.

### 49. Tampa, FL (414,547) — no feed

- Tampa open-data host did not return a usable incident catalog. **no feed** found.

### 50. Arlington, TX (403,672) — needs terms check

- Official web map “APD Crime Data Map,” owner `Curtis.Spurlock@arlingtontx.gov_arlingtontx`, item `bb86e1a612454d3487d136c339b7ba8c`. Snippet: “Map that shows 1 year of class A crimes in Arlington, TX.” Item modified 2026-03-05. **No service URL and no license text** on the item — not a documented downloadable feed yet.
- **Verdict:** **needs terms check** (official map exists; no clear open layer/license in metadata).

### 51. Aurora, CO (403,130) — no feed

- Included as the Census #51 replacement for Seattle. City open-data hosts did not respond with a catalog here. An ArcGIS.com “Crime and Traffic incidents in Aurora City, Colorado” map is a student/third-party item, not used. **no feed** found.

---

## Statewide and county portals (obvious ones)

These were scanned at catalog level only. None are marked **ready** as a national pin source without a closer terms/schema pass.

| Portal | What was found | License / notes | Lean verdict |
| --- | --- | --- | --- |
| **NY State DCJS** ([data.ny.gov](https://data.ny.gov)) | Index Crimes by County and Agency Beginning 1990, `ca8h-8gjq`; rates `34dd-6g2j`. Updated 2025-11-25. | Agency/county **aggregates**, not incidents. | no incident feed |
| **Colorado** ([data.colorado.gov](https://data.colorado.gov)) | “Crimes in Colorado” `j6g4-gayk`, catalog update 2026-06-03; older rate/offense tables. | Looks like summaries, not a pin feed. Not fully field-read. | needs terms check (likely aggregate) |
| **California OpenJustice / data.ca.gov** | This pass’s CKAN search returned 0 incident datasets. OpenJustice is typically summary/UCR-style. | — | no incident feed found here |
| **Texas DPS / data.texas.gov** | No incident-level dataset in the Socrata catalog search. | — | no incident feed found |
| **Florida FDLE** | No official incident open feed found (unrelated city datasets dominated federated search). | — | no incident feed found |
| **Maryland open data** | Montgomery County “Crime” `icn6-v9z3` (not a state file) is a current local Socrata crime layer, updated 2026-11-25. State UCR was not isolated. | County feed, not Maryland-wide incidents. | county needs its own terms check if used |
| **Illinois / Cook County** ([datacatalog.cookcountyil.gov](https://datacatalog.cookcountyil.gov)) | Domain crime-incident catalog search returned 0. | — | no feed found here |
| **Los Angeles County Sheriff** | “Sheriff Part 1 and 2 Crimes (Year to Date),” `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/PART_I_AND_II_CRIMES-YTD/FeatureServer`. Snippet: YTD through the last day of the prior full month; preliminary. Item modified 2026-06-05 10:15 PT (row currency not queried). | License text begins: “Crime data on this site is for informational purposes only. The data is preliminary, incomplete, and subject to change… The data is provided ‘as is’ and should not be used on its own to duplicate summarized crime counts…” | needs terms check |
| **Miami-Dade County** | Hub search API did not return datasets here. Still a logical follow-up for Miami. | — | not verified |
| **Clark County, NV** | No separate county incident file found beyond the **LVMPD** NIBRS FeatureServer noted under Las Vegas. | License missing on the item. | needs terms check (see Las Vegas) |
| **FBI Crime Data Explorer / national NIBRS** | Not re-fetched. Known to be agency-level summaries, not a public pin feed. | — | not a pin source |

---

## Method limits and where this stopped

- Weekly usage was **91.5%** at the start of this pass, with a hard stop at **95.5%**. Work was kept to catalog/metadata APIs. This file was finished without a second usage check in order to leave headroom.
- Several Hub “search” URLs returned OpenAPI shells instead of results, so **Denver, Portland, Memphis, Atlanta, Omaha, Tulsa, El Paso, and Miami-Dade** may still have official layers that this pass missed. Those are marked **no feed found**, not “proven absent.”
- Terms pages that are CivicPlus / JS-only (NYC, Chicago city terms, Philadelphia metadata FAQ) were **not** fully quoted. Those cities stay in **needs terms check**.
- No LexisNexis, CrimeMapping, or NeighborhoodScout incident data was collected.
- Washington cities are intentionally omitted (already covered or out of scope).

**Suggested next research (when usage allows), in size order:** (1) read NYC / Chicago / Philadelphia portal terms and quote them; (2) confirm whether LAPD NIBRS `k7nn-b2ep` is CC0 like the legacy file; (3) Dallas “research purposes only” vs ODC-BY; (4) Milwaukee and Fort Worth layer fields; (5) Detroit 2026 and LVMPD / Raleigh layer currency + licenses; (6) a dedicated Denver, Houston, San Diego, and Miami-Dade catalog pass.

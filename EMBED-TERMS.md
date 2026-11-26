# Terms and embed check (non-Washington feeds and vendor maps)

**Date:** 25 November 2026, evening PT (America/Los_Angeles).  
**Scope:** Follow-up to `US-SCAN.md`. Terms verdicts for the 15 “needs terms check” cities, plus embed/header/terms checks for NeighborhoodScout, LexisNexis Community Crime Map, CrimeMapping.com, SpotCrime, CityProtect, CrimeGrade, and police ArcGIS dashboards. Light no-feed workarounds were not completed in this pass (map upgrade took priority).

**Method:** curl only (no browser). Socrata view metadata, CKAN `package_show` / `datastore_search?limit=0`, ArcGIS item/layer metadata, one-row `max()` date queries, portal `data.json`, published terms pages, and response headers (`X-Frame-Options`, CSP `frame-ancestors`). No incident-row downloads and no LexisNexis / CrimeMapping / NeighborhoodScout incident data was collected.

**Verdicts (terms):** **CLEARED** — a quoted reuse grant or a standard open license is on the current official feed, with any required disclaimer noted. **BLOCKED** — a quoted clause forbids the public-map reuse CrimeStat would need. **UNCLEAR** — license missing, pages did not yield a reusable grant, or two official statements conflict.

**Verdicts (embed):** **EMBED OK** — headers and any captured terms allow framing, with credit still required. **EMBED BLOCKED** — `X-Frame-Options` / `frame-ancestors 'self'` or a quoted no-framing clause. **LINK ONLY** — do not iframe; a credited outbound link is the safe public option (including cases where terms were not fully captured).

This is research only. It does not authorize adding US-city pins or vendor embeds.

---

## A. The 15 “needs terms check” cities

### 1. New York, NY — **UNCLEAR**

- **Feed:** NYC Open Data, NYPD Complaint Data Current (YTD) `5uac-w243`; Historic `qgea-i56i`. Still no `licenseId` on either view. Attribution: Police Department (NYPD).
- **What was read:** `https://data.cityofnewyork.us/api/views/5uac-w243.json`, historic view JSON, `https://opendata.cityofnewyork.us/overview/` (redirects to `https://www.nyc.gov/opendata/get-started/what-is-open-data-`), and `https://www.nyc.gov/home/terms-of-use.page` (resolves to `https://www.nyc.gov/main/terms-of-use`).
- **Quote:** The open-data overview page, as returned, did not include a dataset reuse license. The nyc.gov Terms of Use govern the City website generally: “PLEASE READ THE FOLLOWING TERMS OF USE (‘TERMS’) CAREFULLY BEFORE USING THIS WEBSITE. BY ACCESSING OR USING NEW YORK CITY'S (‘CITY’) WEBSITE, INCLUDING BUT NOT LIMITED TO ALL SUBPAGES (‘NYC.gov’), YOU UNDERSTAND AND AGREE, WITHOUT LIMITATION OR QUALIFICATION, TO THESE TERMS.” (`https://www.nyc.gov/main/terms-of-use`)
- **Note:** Website TOS is not a clear open-data grant for pin reuse. Leave in needs-check until a portal data license is quoted.

### 2. Los Angeles, CA — **UNCLEAR**

- **Feed:** LAPD NIBRS Offenses `k7nn-b2ep` (current). View JSON still has **no `licenseId`**. Attribution: Los Angeles Police Department.
- **Legacy file** “Crime Data from 2020 to 2024” `2nrs-mtv8` remains **CC0 1.0** (“Creative Commons 1.0 Universal (Public Domain Dedication)”), terms `http://creativecommons.org/publicdomain/zero/1.0/legalcode`, but that series ends 2024-12-30.
- **Quote (legacy only):** license name “Creative Commons 1.0 Universal (Public Domain Dedication)”. The current NIBRS view does not carry that license field.
- **Note:** Do not treat `k7nn-b2ep` as CC0 by inheritance.

### 3. Chicago, IL — **CLEARED** (with required disclaimer; City may revoke display)

- **Feed:** Crimes - 2001 to Present `ijzp-q8t2`. `licenseId` is **SEE_TERMS_OF_USE** (“See Terms of Use”). Attribution: Chicago Police Department.
- **What was read:** Live `https://www.chicago.gov/city/en/narr/foia/data_disclaimer.html` returned **403** in this pass. Quote is from the Wayback Machine capture dated 31 October 2025, `https://web.archive.org/web/20251031121701/https://www.chicago.gov/city/en/narr/foia/data_disclaimer.html`, titled “Data Terms of Use.”
- **Quotes:**
  - “The City of Chicago (‘City’) voluntarily provides the data on this website as a service to the public. The City makes no warranty, representation, or guaranty as to the content, accuracy, timeliness, or completeness of any of the data provided at this website. The City makes this data available on an ‘as is’ basis…”
  - “The City may require a user of this data to terminate any and all display, distribution or other use of any or all of the data provided at this website for any reason including, without limitation, violation of these Terms of Use or other terms as defined by City agencies or departments contributing data to this website.”
  - Derivative applications “shall do the following: Include the following disclaimer at the site where the software application, or other secondary or derivative application can be accessed or downloaded: ‘This site provides applications using data that has been modified for use from its original source, www.cityofchicago.org, the official website of the City of Chicago. The City of Chicago makes no claims as to the content, accuracy, timeliness, or completeness of any of the data provided at this site. The data provided at this site is subject to change at any time. It is understood that the data provided at this site is being used at one’s own risk.’” Plus: “Comply with any additional Terms of Use set forth by the City agency or department providing data…”
- **Note:** Reuse is allowed if that disclaimer (and CPD attribution) is shown. The City can later require display to stop. Re-check the live terms page when it is reachable; this verdict relies on the archived copy.

### 4. Philadelphia, PA — **UNCLEAR**

- **Feed:** OpenDataPhilly / data.phila.gov Crime Incidents (Carto `incidents_part1_part2`). Catalog still points to `https://metadata.phila.gov/#help/help-faqs/what-are-the-terms-of-use/`.
- **What was read:** That metadata FAQ URL returned a 2,624-byte JS shell with no usable license text. `https://www.phila.gov/terms-of-use/` is a general city-website TOS: “Please read the following Terms of Use and Disclaimer carefully before using this website… Disclaimer The www.phila.gov Website… is provided on an ‘as is’ and ‘as available’ basis…”
- **Note:** Website TOS is not a dataset reuse license. Point precision (block vs address) also remains unconfirmed.

### 5. Dallas, TX — **UNCLEAR**

- **Feed:** dallasopendata.com Police Incidents `qv6i-rri7`.
- **Quotes (both official, and they conflict):**
  - License in view metadata: **ODC-BY**, “Open Data Commons Attribution License,” terms `http://opendatacommons.org/licenses/by/1.0/`, attribution Dallas Police Department.
  - Dataset description: “This dataset is published by the City of Dallas for research purposes only. The authoritative source for crime data is the Crime Analytics Dashboard.” (view JSON, 25 November 2026)
- **Note:** ODC-BY would normally allow a public attributed map. The “research purposes only” sentence may limit that. Do not ship Dallas pins until the conflict is resolved. If used later, coarsen `Incident Address` unless it is confirmed to be a 100-block.

### 6. Charlotte, NC — **UNCLEAR** (CC BY-NC-SA 4.0)

- **Feed:** CMPD Incidents, ArcGIS item `d22200cd879248fcb2258e6840bd6726`.
- **Quote:** Item `licenseInfo` is exactly `https://creativecommons.org/licenses/by-nc-sa/4.0/`. Access information: Charlotte-Mecklenburg Police.
- **Note:** A free, no-ads CrimeStat map might satisfy non-commercial use, but share-alike would require the CMPD-derived work to be offered under CC BY-NC-SA 4.0. Not cleared until that condition is accepted. Official crime statistics are pointed to `https://charlottenc.gov/CMPD/Safety/Pages/CrimeStats.aspx`. Exclude NIBRS 800-series non-criminal and unfounded cases if this layer is ever used.

### 7. Nashville, TN — **UNCLEAR**

- **Feed:** data.nashville.gov, “Metro Nashville Police Department Incidents,” still current in the catalog (modified 2026-11-25). License text on the catalog points to Executive Order 18: `https://www.nashville.gov/departments/metro-clerk/legal-resources/executive-orders/mayor-freddie-oconnell/fo018`.
- **What was read:** The EO page loaded (HTML, 22,533 bytes). It is an internal Open Data Policy for Metro departments (scope, catalogs, definitions). It defines “Secondary Use” as “any use of Data to produce another set of information, functionality, records, or modification of the Data beyond the original intent of the use of the Data by the owning Department.” It does not, in the captured text, grant a public reuse license (no Creative Commons / “any person may” / “without restriction” clause was found).
- **Note:** Granularity was still not field-read. Leave UNCLEAR.

### 8. Las Vegas, NV (LVMPD) — **UNCLEAR** (license still missing; currency now current)

- **Feed:** LVMPD Reported NIBRS Crimes, item `c1ec788896ae46e0b896b72cb98e7ae8`, `Weekly_Public_Crimes` FeatureServer. No license text on the item or layer.
- **Currency (new this pass):** `max(ReportedOn)` = **22 November 2026, 5:58 AM PT**. The layer is live even though the item modified date is older (21 July 2026, 7:56 AM PT).
- **Note:** Metro PD coverage includes unincorporated Clark County, not city limits only. Location field is named `Location` (precision not confirmed here).

### 9. Detroit, MI — **UNCLEAR**

- **Feed:** RMS Crime Incidents 2026, item `fc701d4b3e14413db2d9f78f0ae0a105`. No license on the item or layer. Access information: “Detroit Police Departmet (DPD).” Fields include `nearest_intersection`, `latitude`, `longitude`.
- **Currency:** Item modified 9 January 2026. A `max(incident_occurred_at)` query returned **null**. Live row currency is still unverified.

### 10. Milwaukee, WI — **CLEARED** (license only; schema still unconfirmed)

- **Feed:** data.milwaukee.gov CKAN package `wibr`, “NIBRS Crime Data (Current).”
- **Quote:** License title “Creative Commons Attribution,” URL `http://www.opendefinition.org/licenses/cc-by`. Notes: “Update Frequency: Daily. Current year to date.” Resource last modified 2026-11-25.
- **Note:** `datastore_search` with the current resource id and `limit=0` still returned only the `_id` field. Location precision remains unconfirmed. The license itself is ready; do not build pins until columns are confirmed.

### 11. Tucson, AZ — **CLEARED** (with required “as is” disclaimer; 2026 currency only verified through September)

- **Feed:** `TPDOpenData_ReportedCrimes_2026`, item `6c9c07f003a34148b3eea8cc4e39d480`, FeatureServer `https://services3.arcgis.com/9coHY2fvuFjG9HQX/arcgis/rest/services/TPDOpenData_ReportedCrimes_2026/FeatureServer`. Catalog `modified` **21 September 2026, 10:59 AM PT**.
- **Quote** (catalog `license` field): “The City of Tucson provides the data for use ‘as is.’ The areas depicted by this feature class are approximate, and are not accurate to surveying or engineering standards. The maps shown here are for illustration purposes only and are not suitable for site-specific decision making. Information found here should not be used for making financial or any other commitments. The City of Tucson provides this information with the understanding that it is not guaranteed to be accurate, correct or complete and conclusions drawn from such information are the responsibility of the user. … the City of Tucson assumes no responsibility for errors or omissions…”
- **Note:** This is a warranty / fitness disclaimer, not a non-commercial or research-only ban. Show the disclaimer and city credit if the layer is used. Confirm whether the 2026 layer is still updating after 21 September 2026, and confirm location precision, before any pin build.

### 12. Raleigh, NC — **UNCLEAR** (no license; 90-day layer is current)

- **Feed:** Raleigh Police Department Crime Incidents - Past 90 Days, item `a1f2d9204a184404b5a4c7e0fdceb6d0`. No license text on the item or layer.
- **Currency (new this pass):** `max(reported_date)` = **24 November 2026, 6:57 PM PT**.
- **Granularity:** Layer description: “Location data is anonymized at the block level to protect privacy while enabling spatial analysis.” Field `reported_block_address`.

### 13. Oakland, CA — **UNCLEAR**

- **Feed:** CrimeWatch Data `ppgh-7dqv` and CrimeWatch Maps Past 90-Days `ym6k-rx7a`. Still **no `licenseId`**. Attribution: Oakland Police Department. Official block-address substitution remains in the dataset description.
- **What was read:** A guessed portal TOS path 404’d. The homepage HTML did not yield a reusable open-data license grant.

### 14. Minneapolis, MN — **CLEARED** (CC0; current-year layer found)

- **Feed:** opendata.minneapolismn.gov `data.json` now lists **Police_Incidents_2026** (item `1e98b5322dd64605ae9947762292a76f`) and **Police_Incidents_Last_2Years** (item `e83a2845d2384759a0a08614fc3fe812`).
- **Quote:** Both carry license `https://creativecommons.org/publicdomain/zero/1.0` (CC0 1.0). `Police_Incidents_2026` catalog `modified` **25 November 2026, 6:56 AM PT**.
- **Note:** This fills the earlier gap (US-SCAN did not see a 2025/2026 layer in its `data.json` slice). Confirm field-level location precision before any pin build. Still research only — not an authorization to start a US-city snapshot.

### 15. Arlington, TX — **UNCLEAR**

- **Feed:** Official web map “APD Crime Data Map,” item `bb86e1a612454d3487d136c339b7ba8c` (modified 5 March 2026). No license text on the item.
- **New this pass:** The web map’s `data` document points at `https://testgis2.arlingtontx.gov/agsexttest2/rest/services/Police/APDCrimeData/MapServer` (and a `Police` MapServer on the same **testgis2** host). That looks like a staging endpoint, not a documented production open feed.
- **Note:** Do not treat the test GIS URL as a cleared pin source.

---

## B. Vendor and dashboard embeds

No vendor incident data was copied. CrimeStat should keep using official agency feeds or credited link-outs only.

### NeighborhoodScout — **EMBED BLOCKED** (LINK ONLY)

- **URLs:** `https://www.neighborhoodscout.com/`, terms `https://www.neighborhoodscout.com/legal/terms-of-use`.
- **Headers:** No `X-Frame-Options` and no CSP `frame-ancestors` on the homepage in this pass. Terms still bar framing.
- **Quotes** (`https://www.neighborhoodscout.com/legal/terms-of-use`):
  - “You may not modify, publish, transmit, display, participate in the transfer or sale, create or attempt to create derivative works, or in any way exploit any of the Site and/or the Content, in whole or in part. No copying, redistribution, retransmission, publication or exploitation (commercial or otherwise) of the Content is permitted without the express written permission of LOCATION, INC or the Content owner.”
  - “You may not frame or utilize framing techniques to enclose any trademark, logo, or other proprietary information (including data, ratings, descriptions, images, text, page layout, or form) of LOCATION, INC and/or its licensors, affiliates, and/or other third parties, without prior express written consent.”
  - Also bars robots, “screen scraping,” and “database scraping.”
- **Use:** Credited link only. Do not iframe, scrape, or republish NeighborhoodScout content.

### LexisNexis Community Crime Map — **LINK ONLY** (product terms not quoted this pass)

- **URLs:** `https://communitycrimemap.com/`, `/terms` (same SPA shell as the homepage, 9,815 bytes; no reusable terms text).
- **Headers:** HTTP 200. No `X-Frame-Options`. CSP has no `frame-ancestors` directive (so the header alone does not block framing).
- **Related:** LexisNexis general online-services terms at `https://www.lexisnexis.com/en-us/terms/general.page` include: “Access or use the Online Services via mechanical, programmatic, robotic, scripted or any other automated means is strictly prohibited without our express prior written permission” and a bar on offering Materials “to any third party for commercial resale or commercial redistribution.” That page is not clearly CCM-specific.
- **Use:** Do not copy CCM incidents. Do not iframe until CCM’s own terms are quoted. A credited outbound link is the safe option.

### CrimeMapping.com — **LINK ONLY** (terms page failed)

- **URLs:** `https://www.crimemapping.com/`; `https://www.crimemapping.com/Home/TermsOfUse` and `/terms` both returned `Error500.html` (606 bytes) in this pass. `/About` loaded a short page without a reuse/framing clause.
- **Headers:** HTTP 200 on the homepage; no `X-Frame-Options` in the response.
- **Use:** No terms quote this pass. Do not iframe or copy incidents until terms are captured. Credited link only.

### SpotCrime — **EMBED BLOCKED** (LINK ONLY)

- **URLs:** `https://spotcrime.com/`, terms `https://spotcrime.com/terms`.
- **Headers:** `X-Frame-Options: SAMEORIGIN` — browsers will not display the site in a cross-origin iframe.
- **Terms:** The `/terms` HTML is an “ACCEPTABLE USE OF WEBSITE” page. A specific no-framing sentence was not captured in the extracted text; the header is enough to block an embed.
- **Use:** Credited link only. Do not scrape or republish SpotCrime content.

### CityProtect — **EMBED BLOCKED** (LINK ONLY)

- **URLs:** `https://cityprotect.com/`, `/terms` and `/terms-of-use` returned the same SPA shell as the homepage (19,321 bytes) with no reusable terms text.
- **Headers:** `Content-Security-Policy: frame-ancestors 'self'` — framing by CrimeStat is blocked.
- **Use:** Credited link only. Do not copy CityProtect incident data.

### CrimeGrade — **LINK ONLY** (headers do not block; terms forbid reuse and competing products)

- **URLs:** `https://crimegrade.org/`, terms `https://crimegrade.org/terms-of-use/` (last updated 10 September 2026). `/terms` 404s and redirects into the marketing site.
- **Headers:** HTTP 200. No `X-Frame-Options` and no `frame-ancestors` in this pass, so a naive iframe might technically load.
- **Quotes:**
  - “You may browse the Site for personal, non-commercial purposes, and you may quote limited portions of the CrimeGrade Data with attribution and a link to the relevant page.”
  - “Except with our prior written permission, you may not: use any automated means, including bots, crawlers, scrapers… to access, collect, extract, copy, index, or monitor the CrimeGrade Data; … reproduce, redistribute, resell, sublicense, or make the CrimeGrade Data available to third parties, whether or not for a fee; create derivative datasets, models, or products from the CrimeGrade Data…; use the CrimeGrade Data to build or improve a product that competes with the Site.”
- **Use:** Do not embed, scrape, or republish CrimeGrade grades. A credited outbound link (and only limited attributed quotation, if ever needed) is the safe option. CrimeStat should not present CrimeGrade scores as its own overlay.

### Police department ArcGIS dashboards — **case by case**

- Headers vary by host. A sample official Esri org portal, `https://bellevuewa.maps.arcgis.com/`, returned CSP `upgrade-insecure-requests` only — no `X-Frame-Options` and no `frame-ancestors` restriction on the org home page.
- Vendor-hosted viewers can still block framing (CityProtect: `frame-ancestors 'self'`; SpotCrime: `SAMEORIGIN`).
- Existing CrimeStat practice stays the right rule: check each dashboard’s headers and any “do not frame” terms. Bellevue’s official map is already an in-sheet embed with visible credit. Federal Way, Spokane Valley, Lakewood, Issaquah, and Bothell stay credited link buttons because framing is barred.
- **Default for a new PD ArcGIS app:** probe `X-Frame-Options` and `frame-ancestors`; if either restricts framing, or terms forbid it, use **LINK ONLY**. If headers allow it and terms do not bar framing, **EMBED OK** with a visible agency credit — never copy the underlying vendor incidents into CrimeStat snapshots.

---

## C. What this changes in US-SCAN (research only)

These are documentation updates, not a build list. The 8-city US pin build remains parked until after the 1 December 2026 usage reset.

| City | US-SCAN verdict | This pass | Practical effect |
| --- | --- | --- | --- |
| Chicago | needs terms check | **CLEARED** with required City disclaimer | Strong official daily block-level candidate once disclaimer copy is on the site |
| Milwaukee | needs terms check (really schema) | **CLEARED** on CC BY; schema still missing | Still not pin-ready until columns are confirmed |
| Tucson | needs terms check | **CLEARED** with “as is” disclaimer | Confirm post-September 2026 currency and precision before any build |
| Minneapolis | needs terms check (no current year found) | **CLEARED** CC0; `Police_Incidents_2026` exists and was modified 25 Nov 2026 | New official current-year candidate; confirm precision |
| Dallas | needs terms check | still **UNCLEAR** (ODC-BY vs “research purposes only”) | Do not build |
| Charlotte | needs terms check | still **UNCLEAR** (CC BY-NC-SA 4.0) | Do not build unless share-alike is accepted |
| NYC, LA NIBRS, Philadelphia, Nashville, Oakland, Arlington | needs terms check | still **UNCLEAR** | License/terms grant still not quoted on the current feed |
| LVMPD, Raleigh | needs terms check | still **UNCLEAR** on license; **currency now current** (22 Nov and 24 Nov 2026 PT) | License still blocking a “ready” verdict |
| Detroit | needs terms check | still **UNCLEAR**; max date query returned null | License and currency both open |

**Ready list is unchanged at 8 cities** until someone formally promotes Minneapolis / Tucson / Chicago after a precision check. This document does not promote them.

---

## D. Not done in this pass

- Light workaround research for the largest no-feed cities (Houston, Phoenix, San Diego, and others in the US-SCAN “no feed” set).
- A live (non-Wayback) capture of Chicago’s data terms page (HTTP 403 from this environment).
- CCM and CrimeMapping product-specific terms pages (SPA shell and Error500).
- Milwaukee and several ArcGIS layers’ field-level location precision, other than Raleigh’s block-address description.


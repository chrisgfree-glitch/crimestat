/* CrimeStat — official Spokane PD snapshot (no demo incidents). */
(() => {
  const MILES5 = 1609.344 * 5;
  const MILES50 = 1609.344 * 50;
  const NEAR_LIST_LIMIT = 50;
  const STORAGE_KEY = "crimestat-ui-v2";
  const OFF_BY_DEFAULT = new Set(["domestic_violence", "stalking", "shots_fired", "calls"]);
  const WINDOW_DAYS = { "30d": 30, "60d": 60, "90d": 90, "6m": 182, "1y": 365, "5y": 365 * 5 };
  const REGION_FALLBACKS = {
    spokane: { lat: 47.6588, lng: -117.426, label: "Spokane, Washington" },
    seattle: { lat: 47.6062, lng: -122.3321, label: "Seattle, Washington" },
    kent: { lat: 47.3900, lng: -122.2135, label: "Kent, Washington" },
    auburn: { lat: 47.3073, lng: -122.2285, label: "Auburn, Washington" },
    everett: { lat: 47.9789, lng: -122.2021, label: "Everett, Washington" },
    shoreline: { lat: 47.7557, lng: -122.3415, label: "Shoreline, Washington" },
    kenmore: { lat: 47.7573, lng: -122.2440, label: "Kenmore, Washington" },
    burien: { lat: 47.46908, lng: -122.3381, label: "Burien, Washington" },
    seatac: { lat: 47.44226, lng: -122.2957, label: "SeaTac, Washington" },
    covington: { lat: 47.36613, lng: -122.10141, label: "Covington, Washington" },
    maplevalley: { lat: 47.36883, lng: -122.03206, label: "Maple Valley, Washington" },
    woodinville: { lat: 47.75009, lng: -122.14355, label: "Woodinville, Washington" },
    sammamish: { lat: 47.60546, lng: -122.03204, label: "Sammamish, Washington" },
    northbend: { lat: 47.4891, lng: -121.76071, label: "North Bend, Washington" },
    newcastle: { lat: 47.5307, lng: -122.16135, label: "Newcastle, Washington" },
    carnation: { lat: 47.63977, lng: -121.89453, label: "Carnation, Washington" },
    skykomish: { lat: 47.71056, lng: -121.35638, label: "Skykomish, Washington" },
    kcsoother: { lat: 47.45601, lng: -121.89378, label: "King County Sheriff other areas, Washington" },
    tacoma: { lat: 47.2529, lng: -122.4443, label: "Tacoma, Washington" },
    yakima: { lat: 46.6021, lng: -120.5059, label: "Yakima, Washington" },
    bellevue: { lat: 47.6101, lng: -122.2015, label: "Bellevue, Washington" },
    federalway: { lat: 47.3223, lng: -122.3126, label: "Federal Way, Washington" },
    spokanevalley: { lat: 47.6733, lng: -117.2394, label: "Spokane Valley, Washington" },
    lakewood: { lat: 47.1718, lng: -122.5185, label: "Lakewood, Washington" },
    issaquah: { lat: 47.5301, lng: -122.0326, label: "Issaquah, Washington" },
    bothell: { lat: 47.7601, lng: -122.2054, label: "Bothell, Washington" },
  };

  const EXTRA_SNAPSHOTS = [
    { id: "everett", name: "Everett", jump: "jumpEverett", settings: "settingsEverett" },
    { id: "shoreline", name: "Shoreline", jump: "jumpShoreline", settings: "settingsShoreline" },
    { id: "kenmore", name: "Kenmore", jump: "jumpKenmore", settings: "settingsKenmore" },
    { id: "burien", name: "Burien", jump: "jumpBurien", settings: "settingsBurien" },
    { id: "seatac", name: "SeaTac", jump: "jumpSeaTac", settings: "settingsSeaTac" },
    { id: "covington", name: "Covington", jump: "jumpCovington", settings: "settingsCovington" },
    { id: "maplevalley", name: "Maple Valley", jump: "jumpMapleValley", settings: "settingsMapleValley" },
    { id: "woodinville", name: "Woodinville", jump: "jumpWoodinville", settings: "settingsWoodinville" },
    { id: "sammamish", name: "Sammamish", jump: "jumpSammamish", settings: "settingsSammamish" },
    { id: "northbend", name: "North Bend", jump: "jumpNorthBend", settings: "settingsNorthBend" },
    { id: "newcastle", name: "Newcastle", jump: "jumpNewcastle", settings: "settingsNewcastle" },
    { id: "carnation", name: "Carnation", jump: "jumpCarnation", settings: "settingsCarnation" },
    { id: "skykomish", name: "Skykomish", jump: "jumpSkykomish", settings: "settingsSkykomish" },
    { id: "kcsoother", name: "King County Sheriff (other)", jump: "jumpKcsoOther", settings: "settingsKcsoOther" },
  ];
  const EXTRA_IDS = EXTRA_SNAPSHOTS.map((c) => c.id);

  const OFFICIAL_MAPS = {
    tacoma: {
      title: "Tacoma",
      mode: "embed",
      openUrl: "https://public.tableau.com/app/profile/city.of.tacoma/viz/TacomaPoliceCrimeDashboard/CrimeDashboard-IntroPage",
      embedUrl: "https://public.tableau.com/views/TacomaPoliceCrimeDashboard/CrimeDashboard-IntroPage?:embed=y&:showVizHome=no",
      credit: "Tacoma Police Department Crime Dashboard, City of Tacoma (Tableau Public). Their dashboard chrome is shown as published. This is the official public view, not CrimeStat pins.",
    },
    yakima: {
      title: "Yakima",
      mode: "embed",
      openUrl: "https://yakima.maps.arcgis.com/apps/webappviewer/index.html?id=b685891fc46a4c3c8cf5eb27d81ba9c8",
      embedUrl: "https://yakima.maps.arcgis.com/apps/webappviewer/index.html?id=b685891fc46a4c3c8cf5eb27d81ba9c8",
      credit: "Yakima Police Department Crime Data Explorer. Copyright City of Yakima. Their map tools stay visible. CrimeStat does not copy this data onto our pins (the official layer is CC BY-ND).",
    },
    bellevue: {
      title: "Bellevue",
      mode: "embed",
      openUrl: "https://bpd-data.bellevuewa.gov/pages/incidents-dashboard",
      embedUrl: "https://bpd-data.bellevuewa.gov/pages/incidents-dashboard",
      credit: "Bellevue Police Department Incidents Dashboard. This is the official page, including their site chrome. It is calls for service, not official UCR/NIBRS, and is not copied onto CrimeStat pins.",
    },
    federalway: {
      title: "Federal Way",
      mode: "link",
      openUrl: "https://www.communitycrimemap.com/?address=33325%208th%20Ave%20S%20Federal%20way%2cWA",
      credit: "Official City of Federal Way Community Crime Map, powered by LexisNexis. LexisNexis terms do not allow framing, so CrimeStat links out instead of embedding.",
      note: "Opens the official LexisNexis Community Crime Map that Federal Way’s crime-statistics page points to.",
    },
    spokanevalley: {
      title: "Spokane Valley",
      mode: "link",
      openUrl: "https://communitycrimemap.com/?address=Spokane,WA&zoom=11",
      credit: "Official Regional Crime Map linked from the City of Spokane Valley, powered by LexisNexis Community Crime Map. LexisNexis terms do not allow framing, so CrimeStat links out instead of embedding.",
      note: "Also covers the Spokane County regional map used by Spokane Valley Police (sheriff contract).",
    },
    lakewood: {
      title: "Lakewood",
      mode: "link",
      openUrl: "https://cityprotect.com/map/list/incidents?pageSize=2000&parentIncidentTypeIds=149,150,148,8,97,104,165,98,100,179,178,180,101,99,103,163,168,166,12,161,14,16,15&zoomLevel=15&latitude=47.16280420168911&longitude=-122.51819156616192&days=1,2,3,4,5,6,7&startHour=0&endHour=24&timezone=%2B00:00&relativeDate=pastMonth",
      credit: "Official Lakewood Interactive Crime Map on CityProtect, linked from the City of Lakewood. CityProtect only allows framing of its own site, so CrimeStat links out.",
      note: "Opens the official CityProtect map from the City of Lakewood crime-statistics page.",
    },
    issaquah: {
      title: "Issaquah",
      mode: "link",
      openUrl: "https://www.issaquahwa.gov/3370/Data-and-Statistics",
      credit: "City of Issaquah Police Data and Statistics. The city’s vendor crime-map page could not be framed here (it restricts embedding to a short allow-list).",
      note: "Opens Issaquah’s official crime-data page.",
    },
    bothell: {
      title: "Bothell",
      mode: "link",
      openUrl: "https://police-transparency-4-bothellgov.hub.arcgis.com/",
      credit: "City of Bothell Police Transparency hub. CrimeStat links to the official site rather than embedding the whole homepage, and has not copied the datasets pending a clear reuse license.",
      note: "Nightly incident and case statistics, with locations generalized to nearby intersections.",
    },
  };

  const LABELS = {
    burglary_residential: "Burglary — residential",
    burglary_business: "Burglary — business",
    theft: "Theft",
    home_invasion: "Home invasion",
    assault: "Assault",
    rape: "Rape / sexual assault",
    battery: "Battery",
    robbery: "Robbery",
    vandalism: "Vandalism",
    arson: "Arson",
    auto_theft: "Motor vehicle theft",
    kidnapping: "Kidnapping",
    fraud: "Fraud",
    drugs: "Drug offenses",
    weapons: "Weapons violations",
    domestic_violence: "Domestic violence",
    stalking: "Stalking",
    shots_fired: "Shots fired",
    missing_persons: "Missing persons",
    calls: "Calls (911/CAD), not confirmed crimes",
  };
  const SENSITIVE = new Set(["rape", "domestic_violence", "stalking"]);
  const LAYER_GROUPS = [
    { id: "persons", heading: "Persons", types: ["assault", "rape", "battery", "robbery", "kidnapping", "domestic_violence", "stalking", "missing_persons"] },
    { id: "property", heading: "Property", types: ["burglary_residential", "burglary_business", "theft", "home_invasion", "vandalism", "arson", "auto_theft", "fraud"] },
    { id: "society", heading: "Society", types: ["drugs", "weapons", "shots_fired"] },
  ];
  const RECORDS_AGENCIES = {
    kent: { name: "Kent Police Department", hash: "kent" },
    renton: { name: "Renton Police Department", hash: "renton" },
    everett: { name: "Everett Police Department", hash: "everett" },
    tacoma: { name: "Tacoma Police Department", hash: "tacoma" },
    vancouver: { name: "Vancouver Police Department", hash: "vancouver" },
    bellevue: { name: "Bellevue Police Department", hash: "bellevue" },
    "federal way": { name: "Federal Way Police Department", hash: "federal-way" },
    marysville: { name: "Marysville Police Department", hash: "marysville" },
    lynnwood: { name: "Lynnwood Police Department", hash: "lynnwood" },
    edmonds: { name: "Edmonds Police Department", hash: "edmonds" },
    shoreline: { name: "King County Sheriff’s Office", hash: "shoreline" },
    lakewood: { name: "Lakewood Police Department", hash: "lakewood" },
    puyallup: { name: "Puyallup Police Department", hash: "puyallup" },
    longview: { name: "Longview Police Department", hash: "longview" },
    olympia: { name: "Olympia Police Department", hash: "olympia" },
    lacey: { name: "Lacey Police Department", hash: "lacey" },
    tumwater: { name: "Tumwater Police Department", hash: "tumwater" },
    bothell: { name: "Bothell Police Department", hash: "bothell" },
    issaquah: { name: "Issaquah Police Department", hash: "issaquah" },
    woodinville: { name: "King County Sheriff’s Office", hash: "woodinville" },
    "mill creek": { name: "Mill Creek Police Department", hash: "mill-creek" },
    mukilteo: { name: "Mukilteo Police Department", hash: "mukilteo" },
  };

  const state = {
    time: "snapshot",
    view: "pins",
    layers: {},
    types: [],
    meta: null,
    neighborhoods: null,
    offenses: null,
    calls: null,
    callsLoading: false,
    regions: [],
    svg: {},
    center: null,
    inCoverage: false,
    visibleKey: "",
    safetyScore: false,
    typeQuery: "",
    days: [0, 1, 2, 3, 4, 5, 6],
    dateFrom: "",
    dateTo: "",
  };

  let map, pinLayer, areaLayer, heatLayer, radiusCircle, userMarker, nbhLayer, callsLayer, scoreLayer;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw) return;
      if (raw.time === "snapshot" || WINDOW_DAYS[raw.time]) state.time = raw.time;
      if (raw.view === "heat" || raw.view === "pins") state.view = raw.view;
      if (raw.layers && typeof raw.layers === "object") state.layers = { ...raw.layers };
      if (typeof raw.safetyScore === "boolean") state.safetyScore = raw.safetyScore;
      if (Array.isArray(raw.days)) {
        const days = raw.days.map(Number).filter((d) => d >= 0 && d <= 6);
        if (days.length) state.days = [...new Set(days)].sort();
      }
      if (typeof raw.dateFrom === "string") state.dateFrom = raw.dateFrom;
      if (typeof raw.dateTo === "string") state.dateTo = raw.dateTo;
    } catch (_) { /* ignore */ }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      time: state.time,
      view: state.view,
      layers: state.layers,
      safetyScore: state.safetyScore,
      days: state.days,
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
    }));
  }

  function parseYmdUtc(iso) {
    const parts = String(iso || "").split("-").map(Number);
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return NaN;
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function regionStartMs(region) {
    return parseYmdUtc(region.meta && region.meta.start);
  }

  function regionAsOfMs(region) {
    return parseYmdUtc(region.meta && region.meta.asOf);
  }

  function inWindow(region, day) {
    if (state.time === "snapshot") return true;
    const start = regionStartMs(region);
    const asOf = regionAsOfMs(region);
    if (!Number.isFinite(start) || !Number.isFinite(asOf)) return false;
    const ms = start + day * 864e5;
    return asOf - ms <= WINDOW_DAYS[state.time] * 864e5;
  }

  function activeDays() {
    return (state.days && state.days.length) ? state.days : [0, 1, 2, 3, 4, 5, 6];
  }

  function inFilters(region, day) {
    if (!inWindow(region, day)) return false;
    const start = regionStartMs(region);
    if (!Number.isFinite(start)) return false;
    const ms = start + day * 864e5;
    const days = activeDays();
    if (days.length < 7 && !days.includes(new Date(ms).getUTCDay())) return false;
    if (state.dateFrom) {
      const from = parseYmdUtc(state.dateFrom);
      if (Number.isFinite(from) && ms < from) return false;
    }
    if (state.dateTo) {
      const to = parseYmdUtc(state.dateTo);
      if (Number.isFinite(to) && ms > to) return false;
    }
    return true;
  }

  function resetCrimeFilters() {
    state.days = [0, 1, 2, 3, 4, 5, 6];
    state.dateFrom = "";
    state.dateTo = "";
    state.typeQuery = "";
    state.safetyScore = false;
  }

  function formatDay(region, day) {
    const dt = new Date(regionStartMs(region) + day * 864e5);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }

  function typeOn(region, type) {
    if (region.meta && region.meta.burglaryUnsplit && type === "burglary_residential") {
      return !!(state.layers.burglary_residential || state.layers.burglary_business);
    }
    if (region.meta && region.meta.burglaryUnsplit && type === "burglary_business") return false;
    return !!state.layers[type];
  }

  function typeLabel(region, type) {
    if (region.meta && region.meta.burglaryUnsplit && (type === "burglary_residential" || type === "burglary_business")) {
      return "Burglary";
    }
    return LABELS[type] || type;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function pinNoteFor(region) {
    if (region.meta && region.meta.showSourceAddress) {
      return "Street address is as published in Auburn Police Department public data.";
    }
    if (region.id === "seattle") {
      return "Location is the official 100-block or MCPP neighborhood, not a street address.";
    }
    if (region.meta && region.meta.locationMode === "100block") {
      return "Location is the official 100-block, not a street address.";
    }
    return PIN_NOTE;
  }

  function applyDefaultLayers() {
    for (const t of state.types) {
      if (typeof state.layers[t] !== "boolean") state.layers[t] = !OFF_BY_DEFAULT.has(t);
    }
    if (typeof state.layers.calls !== "boolean") state.layers.calls = false;
  }

  function regionBounds(region) {
    const b = region && region.meta && region.meta.bbox;
    if (!b) return null;
    return L.latLngBounds([b[1], b[0]], [b[3], b[2]]);
  }

  function coverageBounds() {
    const bounds = state.regions.map(regionBounds).filter(Boolean);
    if (!bounds.length) {
      const b = state.meta && state.meta.bbox;
      if (!b) return null;
      return L.latLngBounds([b[1], b[0]], [b[3], b[2]]);
    }
    let acc = bounds[0];
    for (let i = 1; i < bounds.length; i++) acc = acc.extend(bounds[i]);
    return acc;
  }

  function findRegion(id) {
    return state.regions.find((r) => r.id === id) || null;
  }

  function regionDisplayName(region) {
    if (!region) return "";
    if (region.id === "spokane") return "Spokane";
    if (region.id === "seattle") return "Seattle";
    if (region.id === "kent") return "Kent";
    if (region.id === "auburn") return "Auburn";
    if (region.id === "everett") return "Everett";
    if (region.id === "shoreline") return "Shoreline";
    if (region.id === "kenmore") return "Kenmore";
    const extra = EXTRA_SNAPSHOTS.find((c) => c.id === region.id);
    if (extra) return extra.name;
    return (region.meta && (region.meta.id || region.id)) || region.id;
  }

  function formatAsOf(iso) {
    const ms = parseYmdUtc(iso);
    if (!Number.isFinite(ms)) return iso || "";
    return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }

  function freshnessLine(region) {
    const asOf = formatAsOf(region.meta && region.meta.asOf);
    const cadence = (region.meta && region.meta.cadence) || "not a real-time feed";
    const credit = (region.meta && (region.meta.credit || region.meta.source)) || "";
    const base = asOf ? `Data as of ${asOf} · updated ${cadence}` : `Updated ${cadence}`;
    return credit ? `${base}. ${credit}` : base;
  }

  function syncFreshness() {
    const items = state.regions.map((r) =>
      `<li><strong>${regionDisplayName(r)}</strong>${escapeHtml(freshnessLine(r))}</li>`
    ).join("");
    for (const id of ["dataFreshness", "layersFreshness"]) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = items;
    }
  }

  function radiusBounds(lat, lng, meters) {
    const dLat = meters / 111320;
    const dLng = meters / (111320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    return L.latLngBounds([lat - dLat, lng - dLng], [lat + dLat, lng + dLng]);
  }

  function regionInView(region) {
    const cov = regionBounds(region);
    if (!cov) return false;
    if (state.center && state.center.radiusMeters) {
      const around = radiusBounds(state.center.lat, state.center.lng, state.center.radiusMeters);
      if (cov.intersects(around) || cov.contains([state.center.lat, state.center.lng])) return true;
    }
    if (map) {
      const mb = map.getBounds();
      if (mb && mb.isValid() && mb.intersects(cov)) return true;
    }
    return false;
  }

  function visibleRegions() {
    return state.regions.filter(regionInView);
  }

  function viewIntersectsCoverage() {
    return visibleRegions().length > 0;
  }

  function updateBanner(regions) {
    const banner = document.getElementById("asOfBanner");
    if (!banner) return;
    if (!regions.length) return;
    banner.textContent = regions.map((r) => {
      const label = r.meta && r.meta.label || "";
      const fresh = freshnessLine(r);
      if (/not a real-time|not real-time|paused/i.test(label)) return `${label} ${fresh}`;
      return `${label} This is public data as of that date, not a real-time feed. ${fresh}`;
    }).join(" ");
    refreshLocPrecision();
  }

  function setLocMessage(text) {
    document.getElementById("locBar").textContent = text;
  }

  function popupHtml(title, body, note) {
    return `<strong>${title}</strong><div>${body}</div>${note ? `<div class="popup-note">${note}</div>` : ""}`;
  }

  const AREA_NOTE = "Shown as a neighborhood total only. Street addresses are not published on CrimeStat.";
  const PIN_NOTE = "Location is the neighborhood only, not a street address. Official data includes no point geometry.";

  function iconFor(type) {
    const svg = state.svg[type];
    return L.divIcon({
      className: "cs-ico",
      html: svg || '<span class="cs-ico-fallback" aria-hidden="true"></span>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12],
    });
  }

  let renderPending = false;

  function render() {
    if (!map) return;
    // Rebuilding markers mid-zoom can throw Leaflet's createIcon error in markercluster.
    if (map._animatingZoom) {
      if (!renderPending) {
        renderPending = true;
        map.once("zoomend", () => {
          renderPending = false;
          render();
        });
      }
      return;
    }
    if (pinLayer) pinLayer.clearLayers();
    if (areaLayer) areaLayer.clearLayers();
    if (callsLayer) callsLayer.clearLayers();
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }

    const regions = visibleRegions();
    const covered = regions.length > 0;
    state.inCoverage = covered;
    state.visibleKey = regions.map((r) => r.id).join(",");
    document.getElementById("emptyState").hidden = covered;
    if (covered) updateBanner(regions);
    if (!covered) {
      updateScoreOverlay([]);
      return;
    }

    const heat = [];

    function badgeMarker(latlng, html, popupTitle, popupBody, popupNote, borderColor, popupOpts) {
      const icon = L.divIcon({
        className: "cs-badge-wrap",
        html: `<div class="nbh-badge" style="border-color:${borderColor}">${html}</div>`,
        iconSize: null,
        iconAnchor: [20, 12],
      });
      return L.marker(latlng, { icon, keyboard: false, zIndexOffset: 200 })
        .bindPopup(popupHtml(popupTitle, popupBody, popupNote), popupOpts || {});
    }

    function centroidOf(feat) {
      const c = feat.properties && feat.properties.c;
      if (c && Number.isFinite(c[1]) && Number.isFinite(c[0])) return [c[1], c[0]];
      const b = L.geoJSON(feat).getBounds();
      return b.getCenter();
    }

    for (const region of regions) {
      if (region.kind === "annual-summary") {
        renderAnnualSummary(region, badgeMarker, centroidOf);
        continue;
      }
      if (!region.offenses || !region.neighborhoods) continue;
      const types = region.meta.types || state.types;
      const features = region.neighborhoods.features || [];
      const nbhArea = new Map();

      for (const row of region.offenses.areas || []) {
        const [t, n, d, c] = row;
        const type = types[t];
        if (!type || !typeOn(region, type) || !inFilters(region, d)) continue;
        if (!nbhArea.has(n)) nbhArea.set(n, {});
        nbhArea.get(n)[type] = (nbhArea.get(n)[type] || 0) + c;
      }

      if (state.layers.calls && region.calls) {
        const callCounts = new Map();
        for (const [n, d, c] of region.calls.cells || []) {
          if (!inFilters(region, d)) continue;
          callCounts.set(n, (callCounts.get(n) || 0) + c);
        }
        for (const feat of features) {
          const id = feat.properties.id;
          const count = callCounts.get(id);
          if (!count) continue;
          const color = "#5d6d7e";
          L.geoJSON(feat, {
            style: { color, weight: 1.4, fillColor: "#ffffff", fillOpacity: 0, dashArray: "5 4" },
            interactive: false,
          }).addTo(callsLayer);
          const svg = state.svg.calls || "";
          badgeMarker(
            centroidOf(feat),
            `${svg}<span class="nbh-n">${count.toLocaleString()}</span>`,
            "Calls (911/CAD), not confirmed crimes",
            `<strong>${count.toLocaleString()}</strong> calls in ${feat.properties.name} during the selected window.`,
            "This is the official calls-for-service feed (911, Crime Check, officer-initiated, dispatch). It is not a confirmed crime layer.",
            color
          ).addTo(callsLayer);
        }
      }

      for (const feat of features) {
        const id = feat.properties.id;
        const bag = nbhArea.get(id);
        if (!bag) continue;
        const typelist = Object.keys(bag);
        const total = typelist.reduce((s, typ) => s + bag[typ], 0);
        const primary = typelist.slice().sort((a, b) => bag[b] - bag[a])[0];
        const icons = typelist.slice(0, 3).map((typ) => state.svg[typ] || "").join("");
        L.geoJSON(feat, {
          style: { color: typeColor(primary), weight: 1.6, fillColor: "#ffffff", fillOpacity: 0 },
          interactive: false,
        }).addTo(areaLayer);
        badgeMarker(
          centroidOf(feat),
          `${icons}<span class="nbh-n">${total.toLocaleString()}</span>`,
          feat.properties.name,
          typelist.map((typ) => `${typeLabel(region, typ)}: ${bag[typ]}`).join("<br>"),
          AREA_NOTE,
          typeColor(primary)
        ).addTo(areaLayer);
      }

      if (state.view === "heat") {
        for (const row of region.offenses.points || []) {
          const [t, n, d, x, y] = row;
          const type = types[t];
          if (!type || !typeOn(region, type) || !inFilters(region, d) || SENSITIVE.has(type)) continue;
          heat.push([y / 10000, x / 10000, 0.6]);
        }
      } else {
        for (const row of region.offenses.points || []) {
          const [t, n, d, x, y, addr] = row;
          const type = types[t];
          if (!type || !typeOn(region, type) || !inFilters(region, d) || SENSITIVE.has(type)) continue;
          const feat = features[n];
          const name = feat ? feat.properties.name : "Unknown neighborhood";
          const label = typeLabel(region, type);
          const showAddr = region.meta && region.meta.showSourceAddress && addr;
          const body = showAddr
            ? `${escapeHtml(addr)}<br>${formatDay(region, d)}`
            : `${escapeHtml(name)}<br>${formatDay(region, d)}`;
          const marker = L.marker([y / 10000, x / 10000], {
            icon: iconFor(type),
            title: label,
            keyboard: false,
          }).bindPopup(popupHtml(
            label,
            body,
            pinNoteFor(region)
          ));
          pinLayer.addLayer(marker);
        }
      }
    }

    if (state.view === "heat" && heat.length) {
      heatLayer = L.heatLayer(heat, { radius: 28, blur: 22, maxZoom: 16, minOpacity: 0.28 });
      heatLayer.addTo(map);
    }
    updateScoreOverlay(regions);
  }

  const SCORE_COLORS = { low: "#86efac", mid: "#fde68a", high: "#fca5a5", thin: "#e5e7eb" };

  function neighborhoodIncidentCount(region, nbhId) {
    const types = region.meta.types || state.types;
    let count = 0;
    for (const row of region.offenses.points || []) {
      const [t, n, d] = row;
      const type = types[t];
      if (!type || !inFilters(region, d) || type === "calls") continue;
      if (n === nbhId) count += 1;
    }
    for (const row of region.offenses.areas || []) {
      const [t, n, d, c] = row;
      const type = types[t];
      if (!type || !inFilters(region, d) || type === "calls") continue;
      if (n === nbhId) count += c;
    }
    return count;
  }

  function scoreColorFor(rank, n) {
    if (n <= 1) return SCORE_COLORS.mid;
    const q = rank / (n - 1);
    if (q <= 0.33) return SCORE_COLORS.low;
    if (q <= 0.66) return SCORE_COLORS.mid;
    return SCORE_COLORS.high;
  }

  function updateScoreOverlay(regions) {
    if (scoreLayer && map) {
      map.removeLayer(scoreLayer);
      scoreLayer = null;
    }
    const legend = document.getElementById("scoreLegend");
    const btn = document.getElementById("scoreBtn");
    if (btn) {
      btn.classList.toggle("is-on", !!state.safetyScore);
      btn.setAttribute("aria-pressed", state.safetyScore ? "true" : "false");
    }
    if (legend) legend.hidden = !state.safetyScore;
    if (!state.safetyScore || !map || !regions || !regions.length) return;

    if (!map.getPane("scorePane")) {
      map.createPane("scorePane");
      map.getPane("scorePane").style.zIndex = 350;
    }
    scoreLayer = L.layerGroup().addTo(map);

    for (const region of regions) {
      if (region.kind === "annual-summary" || !region.offenses || !region.neighborhoods) continue;
      const features = region.neighborhoods.features || [];
      const tallies = features.map((feat) => ({
        feat,
        count: neighborhoodIncidentCount(region, feat.properties.id),
      }));
      const ranked = tallies.filter((row) => row.count >= 3).slice().sort((a, b) => a.count - b.count);
      const asOf = formatAsOf(region.meta && region.meta.asOf);
      const credit = (region.meta && (region.meta.credit || region.meta.source)) || "";
      const city = regionDisplayName(region);

      tallies.forEach((row) => {
        const enough = row.count >= 3;
        const rank = enough ? ranked.findIndex((r) => r === row) : -1;
        const color = enough ? scoreColorFor(rank, ranked.length) : SCORE_COLORS.thin;
        const label = !enough
          ? "Not enough data"
          : rank / Math.max(ranked.length - 1, 1) <= 0.33
            ? "Lower official-incident count"
            : rank / Math.max(ranked.length - 1, 1) <= 0.66
              ? "Typical official-incident count"
              : "Higher official-incident count";
        const body = enough
          ? `<strong>${row.count.toLocaleString()}</strong> official confirmed incidents in ${city} during the selected window.<br>${label}.`
          : `Fewer than 3 official confirmed incidents in this window, so no score is shown.`;
        const note = `Built only from official confirmed incidents, as of ${asOf || "the snapshot date"}. This is not a prediction and does not mean an area is safe or unsafe. Sensitive types are included as area totals, never as addresses. CAD calls are not included.${credit ? " " + credit : ""}`;
        L.geoJSON(row.feat, {
          pane: "scorePane",
          style: { color: "#111827", weight: 1, fillColor: color, fillOpacity: 0.45 },
        }).bindPopup(popupHtml(row.feat.properties.name, body, note)).addTo(scoreLayer);
      });
    }
  }

  const ANNUAL_GROUPS = [
    {
      heading: "Persons",
      totalField: "PrsnTotal",
      fields: [
        ["Murder", "Murder"],
        ["Manslaughter", "Manslaughter"],
        ["Forcible_Sex", "Sex offenses (forcible)"],
        ["Assault", "Assault"],
        ["Non_Forcible_Sex", "Sex offenses (non-forcible)"],
        ["Kidnapping_Abduction", "Kidnapping / abduction"],
        ["Human_Trafficking", "Human trafficking"],
        ["Viol_Of_No_Contact", "No-contact order violations"],
      ],
    },
    {
      heading: "Property",
      totalField: "PrprtyTotal",
      fields: [
        ["Arson", "Arson"],
        ["Bribery", "Bribery"],
        ["Burglary", "Burglary"],
        ["Counterfeiting_Forgery", "Counterfeiting / forgery"],
        ["Destruction_of_Property", "Vandalism / property damage"],
        ["Extortion_Blackmail", "Extortion / blackmail"],
        ["Robbery", "Robbery"],
        ["Theft", "Theft"],
      ],
    },
    {
      heading: "Society",
      totalField: "SctyTotal",
      fields: [
        ["Drug_Violations", "Drug violations"],
        ["Gambling_Violations", "Gambling violations"],
        ["Pornography", "Pornography"],
        ["Prostitution", "Prostitution"],
        ["Weapon_Law_Violation", "Weapon law violations"],
        ["Animal_Cruelty", "Animal cruelty"],
      ],
    },
  ];

  function annualFieldCount(rows, field) {
    const row = (rows || []).find((r) => r.field === field);
    return row && row.count != null ? Number(row.count) : null;
  }

  function renderAnnualSummary(region, badgeMarker, centroidOf) {
    const features = (region.neighborhoods && region.neighborhoods.features) || [];
    const summary = region.summary || {};
    const year = (region.meta && region.meta.year) || summary.latestYear;
    const rows = summary.rows || [];
    if (!features.length || !rows.length) return;
    for (const feat of features) {
      L.geoJSON(feat, {
        style: { color: "#1a5bd6", weight: 2, fillColor: "#1a5bd6", fillOpacity: 0.18 },
        interactive: false,
      }).addTo(areaLayer);
    }
    const fmt = (n) => Number(n).toLocaleString();
    let body = `<div class="cs-annual-card"><div class="cs-annual-total">Total: ${fmt(summary.total)}</div>`;
    for (const group of ANNUAL_GROUPS) {
      const groupTotal = annualFieldCount(rows, group.totalField);
      body += `<div class="cs-annual-group"><h3>${group.heading}${groupTotal != null ? ` <span>${fmt(groupTotal)}</span>` : ""}</h3><ul>`;
      for (const [field, label] of group.fields) {
        const count = annualFieldCount(rows, field);
        if (count == null) continue;
        body += `<li><span>${label}</span><span class="cs-annual-n">${fmt(count)}</span></li>`;
      }
      body += "</ul></div>";
    }
    const prior = summary.priorYear;
    if (prior && prior.year) {
      body += `<p class="cs-annual-prior">${prior.year} from the same official file — Total: ${fmt(prior.total)}; persons: ${fmt(prior.PrsnTotal)}; property: ${fmt(prior.PrprtyTotal)}; society: ${fmt(prior.SctyTotal)}.</p>`;
    }
    const agency = RECORDS_AGENCIES[(region.id || "").toLowerCase()];
    if (agency) {
      body += `<p class="cs-annual-cta">No block-level data published. Help get it: <a href="/records#${agency.hash}">request records from ${escapeHtml(agency.name)}</a>.</p>`;
    }
    body += "</div>";
    const title = (region.meta && (region.meta.cardTitle || region.meta.label)) || "Annual totals";
    badgeMarker(
      centroidOf(features[0]),
      `<span class="nbh-n">${summary.total != null ? fmt(summary.total) : (year || "Totals")}</span>`,
      title,
      body,
      (region.meta && region.meta.cardNote) || "Annual agency totals, not incident-level and not real-time.",
      "#1a5bd6",
      {
        className: "cs-annual-popup",
        maxWidth: 300,
        minWidth: 260,
        autoPan: true,
        keepInView: true,
        autoPanPaddingTopLeft: [56, 12],
        autoPanPaddingBottomRight: [56, 120],
      }
    ).addTo(areaLayer);
  }

  function typeColor(type) {
    const svg = state.svg[type] || "";
    const m = svg.match(/fill="(#[0-9a-fA-F]{3,8})"/);
    return (m && m[1]) || "#374151";
  }

  async function ensureCalls() {
    const spokane = findRegion("spokane");
    if ((spokane && spokane.calls) || state.calls || state.callsLoading) return;
    state.callsLoading = true;
    try {
      const res = await fetch("/data/calls.json");
      const data = await res.json();
      state.calls = data;
      if (spokane) spokane.calls = data;
    } catch (_) {
      state.calls = { cells: [] };
      if (spokane) spokane.calls = { cells: [] };
    } finally {
      state.callsLoading = false;
    }
  }

  const PRECISION_PHRASES = [
    "Auburn pins show official street addresses from Auburn Police Department public data.",
    "Kent is city-level annual totals only.",
    "Other covered cities use neighborhood or 100-block locations, not street addresses.",
    "Neighborhood-level official data only.",
    "City-level annual totals only.",
    "Official 100-block locations only.",
    "Data: City of Everett / SNO911",
    "data provided by permission of King County",
  ];

  function locPrecisionNote() {
    const regions = visibleRegions();
    const notes = [];
    if (regions.some((r) => r.meta && r.meta.showSourceAddress)) {
      notes.push("Auburn pins show official street addresses from Auburn Police Department public data.");
    }
    if (regions.some((r) => r.kind === "annual-summary")) {
      notes.push("Kent is city-level annual totals only.");
    }
    if (regions.some((r) => !(r.meta && r.meta.showSourceAddress) && r.kind !== "annual-summary")) {
      notes.push(notes.length
        ? "Other covered cities use neighborhood or 100-block locations, not street addresses."
        : "Neighborhood-level official data only.");
    }
    const credits = [...new Set(regions.map((r) => (r.meta && (r.meta.credit || r.meta.source)) || "").filter(Boolean))];
    for (const credit of credits) notes.push(credit);
    return notes.join(" ") || "Neighborhood-level official data only.";
  }

  function refreshLocPrecision() {
    const el = document.getElementById("locBar");
    if (!el) return;
    let text = el.textContent || "";
    if (!PRECISION_PHRASES.some((p) => text.includes(p.replace(/\.$/, "")))) return;
    for (const phrase of PRECISION_PHRASES) {
      text = text.split(phrase).join("");
      text = text.split(phrase.replace(/\.$/, "")).join("");
    }
    text = text.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
    const note = locPrecisionNote();
    el.textContent = text ? `${text.replace(/\.$/, "")}. ${note}` : note;
  }

  function clearCenterDecorations() {
    if (radiusCircle) {
      map.removeLayer(radiusCircle);
      radiusCircle = null;
    }
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
  }


  function fitMapBounds(bounds, opts) {
    if (!bounds || !map) return;
    const options = opts || {};
    const listOpen = options.listOpen || (document.getElementById("panel-nearby") && !document.getElementById("panel-nearby").hidden);
    const bottom = listOpen ? 340 : 28;
    map.invalidateSize();
    map.fitBounds(bounds, {
      paddingTopLeft: [28, 28],
      paddingBottomRight: [28, bottom],
      maxZoom: options.maxZoom || 12,
      animate: false,
    });
  }

  function setCenter(lat, lng, label, opts) {
    const options = opts || {};
    const meters = options.radiusMeters != null ? options.radiusMeters : MILES50;
    const showCircle = options.circle !== false && meters > 0;
    state.center = { lat, lng, label, radiusMeters: meters };
    clearCenterDecorations();
    if (showCircle) {
      radiusCircle = L.circle([lat, lng], {
        radius: meters,
        color: "#111827",
        weight: 1.5,
        dashArray: "6 6",
        fillColor: "#3b82f6",
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(map);
    }
    if (options.marker !== false) {
      userMarker = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#2563eb",
        fillOpacity: 1,
      }).addTo(map);
    }
    map.invalidateSize();
    const listOpen = options.openList || (document.getElementById("panel-nearby") && !document.getElementById("panel-nearby").hidden);
    fitMapBounds(radiusCircle ? radiusCircle.getBounds() : options.bounds, {
      maxZoom: options.maxZoom || 12,
      listOpen,
    });
    const covered = viewIntersectsCoverage();
    const radiusNote = meters === MILES50 ? "50-mile radius" : "selected radius";
    if (covered) {
      setLocMessage((label ? `Centered near ${label}` : "Centered here") +
        ` · ${radiusNote} (zoom out to see more). ` + locPrecisionNote());
    } else {
      setLocMessage((label ? `Centered near ${label}. ` : "") +
        "No public data feed for this area yet.");
      updateRecordsCta(label || "");
    }
    render();
    refreshLocPrecision();
    if (options.openList) openNearbyList();
  }

  function showRegion(id) {
    const region = findRegion(id);
    const fallback = REGION_FALLBACKS[id] || {};
    if (!region && !fallback.lat) return;
    const c = region && region.meta && region.meta.center;
    const lng = c ? c[0] : fallback.lng;
    const lat = c ? c[1] : fallback.lat;
    const cov = region ? regionBounds(region) : null;
    // City jump buttons are city-scoped; the 50-mile radius is only for Nearby me / granted location.
    setCenter(lat, lng, fallback.label || (region && region.meta && region.meta.label) || id, {
      radiusMeters: 0,
      circle: false,
      marker: false,
      bounds: cov || undefined,
      maxZoom: 13,
    });
    if (cov) map.fitBounds(cov, { padding: [28, 28], maxZoom: 13, animate: false });
    refreshLocPrecision();
    syncOfficialMapButton(id);
    if (OFFICIAL_MAPS[id]) openOfficialMap(id);
    else closeOfficialMap();
  }

  function closeOfficialMap() {
    const sheet = document.getElementById("officialMapSheet");
    const frame = document.getElementById("officialMapFrame");
    if (sheet) sheet.hidden = true;
    if (frame) frame.removeAttribute("src");
  }

  function syncOfficialMapButton(id) {
    const btn = document.getElementById("officialMapBtn");
    if (!btn) return;
    const spec = id && OFFICIAL_MAPS[id];
    btn.hidden = !spec;
    if (spec) {
      btn.dataset.region = id;
      btn.textContent = spec.mode === "embed" ? "Official map" : "Official map (link)";
    } else {
      delete btn.dataset.region;
    }
  }

  function openOfficialMap(id) {
    const spec = OFFICIAL_MAPS[id];
    const sheet = document.getElementById("officialMapSheet");
    const title = document.getElementById("officialMapTitle");
    const credit = document.getElementById("officialMapCredit");
    const wrap = document.getElementById("officialMapFrameWrap");
    const frame = document.getElementById("officialMapFrame");
    const note = document.getElementById("officialMapLinkNote");
    const open = document.getElementById("officialMapOpen");
    if (!spec || !sheet || !title || !credit || !wrap || !frame || !note || !open) return;
    title.textContent = spec.title;
    credit.textContent = spec.credit || "";
    open.href = spec.openUrl;
    open.textContent = spec.mode === "embed" ? "Open full map" : "Open official map";
    if (spec.mode === "embed" && spec.embedUrl) {
      wrap.hidden = false;
      if (frame.getAttribute("src") !== spec.embedUrl) frame.setAttribute("src", spec.embedUrl);
      note.hidden = !spec.note;
      note.textContent = spec.note || "";
    } else {
      wrap.hidden = true;
      frame.removeAttribute("src");
      note.hidden = false;
      note.textContent = spec.note || "This official map cannot be shown inside CrimeStat, so it opens on the agency’s own site.";
    }
    sheet.hidden = false;
    syncOfficialMapButton(id);
  }

  function showSpokane() {
    showRegion("spokane");
  }

  function formatAddress(result) {
    if (!result) return "";
    const a = result.address || {};
    const line = [a.house_number, a.road].filter(Boolean).join(" ");
    const place = a.city || a.town || a.village || a.hamlet || a.county || "";
    const region = a.state || "";
    const zip = a.postcode || "";
    return [line, place, region, zip].filter(Boolean).join(", ") || result.display_name || "";
  }

  async function reverseGeocode(lat, lng) {
    const url = `/api/geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("lookup failed");
    return res.json();
  }

  async function searchAddress(q) {
    const url = `/api/geocode?q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("lookup failed");
    return res.json();
  }

  async function useCoords(lat, lng, fallbackLabel) {
    setLocMessage("Finding the nearest address…");
    try {
      const data = await reverseGeocode(lat, lng);
      const snappedLat = Number(data.lat);
      const snappedLng = Number(data.lon);
      const label = formatAddress(data);
      if (Number.isFinite(snappedLat) && Number.isFinite(snappedLng)) {
        setCenter(snappedLat, snappedLng, label || fallbackLabel);
        return;
      }
    } catch (_) { /* fall through */ }
    setCenter(lat, lng, fallbackLabel);
  }

  function haversineMeters(lat1, lng1, lat2, lng2) {
    const toR = (d) => (d * Math.PI) / 180;
    const dLat = toR(lat2 - lat1);
    const dLng = toR(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function neighborhoodsByDistance(lat, lng) {
    const feats = state.regions.flatMap((r) => (r.neighborhoods && r.neighborhoods.features) || []);
    return feats.map((feat) => {
      const c = feat.properties && feat.properties.c;
      const clat = c ? c[1] : NaN;
      const clng = c ? c[0] : NaN;
      const meters = Number.isFinite(clat) && Number.isFinite(clng)
        ? haversineMeters(lat, lng, clat, clng)
        : Infinity;
      return { name: feat.properties.name, meters };
    }).sort((a, b) => a.meters - b.meters);
  }

  function formatMiles(meters) {
    const miles = meters / 1609.344;
    if (miles < 0.1) return "under 0.1 mi";
    return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
  }

  function incidentsNear(lat, lng, meters) {
    const out = [];
    for (const region of state.regions) {
      if (region.kind === "annual-summary" || !region.offenses) continue;
      const types = region.meta.types || state.types;
      const features = (region.neighborhoods && region.neighborhoods.features) || [];
      for (const row of region.offenses.points || []) {
        const [t, n, d, x, y, addr] = row;
        const type = types[t];
        if (!type || !typeOn(region, type) || !inFilters(region, d) || SENSITIVE.has(type)) continue;
        const ilat = y / 10000;
        const ilng = x / 10000;
        const dist = haversineMeters(lat, lng, ilat, ilng);
        if (dist > meters) continue;
        const feat = features[n];
        const place = (region.meta && region.meta.showSourceAddress && addr)
          ? addr
          : (feat && feat.properties && feat.properties.name) || regionDisplayName(region);
        out.push({
          regionId: region.id,
          type,
          label: typeLabel(region, type),
          date: formatDay(region, d),
          place,
          lat: ilat,
          lng: ilng,
          dist,
        });
      }
    }
    out.sort((a, b) => a.dist - b.dist);
    return out;
  }

  function openNearbyList(lat, lng, meters) {
    const panel = document.getElementById("panel-nearby");
    const list = document.getElementById("nearbyList");
    const summary = document.getElementById("nearbySummary");
    if (!panel || !list || !summary) return;
    const center = lat != null ? { lat, lng } : state.center;
    const radius = meters || (center && center.radiusMeters) || MILES50;
    if (!center) {
      summary.textContent = "Turn on location or search a place to see nearby incidents.";
      list.innerHTML = "";
      openSheet("nearby");
      return;
    }
    const all = incidentsNear(center.lat, center.lng, radius);
    const shown = all.slice(0, NEAR_LIST_LIMIT);
    if (!all.length) {
      summary.textContent = viewIntersectsCoverage()
        ? "No incidents in the selected types, days, and time window within 50 miles."
        : "No public incident feed within 50 miles. Search a city or use the records guide.";
      list.innerHTML = "";
    } else {
      summary.textContent = all.length > shown.length
        ? `Showing the nearest ${shown.length} of ${all.length.toLocaleString()} incidents within 50 miles.`
        : `${all.length.toLocaleString()} incident${all.length === 1 ? "" : "s"} within 50 miles.`;
      list.innerHTML = shown.map((item, i) => (
        `<li><button type="button" data-near="${i}"><span class="nearby-type">${escapeHtml(item.label)}</span>` +
        `<span class="nearby-meta">${escapeHtml(item.place)} · ${escapeHtml(item.date)} · ${formatMiles(item.dist)}</span></button></li>`
      )).join("");
      list.querySelectorAll("[data-near]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = shown[Number(btn.dataset.near)];
          if (!item) return;
          map.setView([item.lat, item.lng], 16, { animate: false });
          pinLayer.eachLayer((layer) => {
            const ll = layer.getLatLng && layer.getLatLng();
            if (ll && Math.abs(ll.lat - item.lat) < 0.00015 && Math.abs(ll.lng - item.lng) < 0.00015) {
              layer.openPopup();
            }
          });
        });
      });
    }
    openSheet("nearby");
    if (radiusCircle) fitMapBounds(radiusCircle.getBounds(), { maxZoom: 12, listOpen: true });
    window.__csNearby = { count: all.length, shown: shown.length, cities: [...new Set(visibleRegions().map((r) => r.id))] };
  }

  function updateRecordsCta(query) {
    const el = document.getElementById("recordsCta");
    if (!el) return;
    const q = String(query || "").toLowerCase();
    let hit = null;
    for (const [key, agency] of Object.entries(RECORDS_AGENCIES)) {
      if (q.includes(key)) { hit = agency; break; }
    }
    if (hit) {
      el.innerHTML = `No block-level data published. Help get it: <a href="/records#${hit.hash}">request records from ${escapeHtml(hit.name)}</a>.`;
    } else {
      el.innerHTML = `No block-level data published. Help get it: <a href="/records">request records from the local police department</a>.`;
    }
  }

  function showDefaultCoverage() {
    const cov = coverageBounds();
    if (!cov) return;
    const mid = cov.getCenter();
    state.center = { lat: mid.lat, lng: mid.lng, label: null, radiusMeters: 0 };
    clearCenterDecorations();
    map.invalidateSize();
    map.fitBounds(cov, { padding: [28, 28], maxZoom: 9, animate: false });
    setLocMessage("Showing official public data for areas with a feed. Tap Nearby me to center on your location, or search a city.");
    render();
    refreshLocPrecision();
    window.__csDefaultView = true;
  }

  function applyNearby(lat, lng, label) {
    setCenter(lat, lng, label || "you", { radiusMeters: MILES50, openList: true });
    const ranked = neighborhoodsByDistance(lat, lng);
    const nearbyNames = [...new Set(visibleRegions().map(regionDisplayName).filter(Boolean))];
    if (nearbyNames.length) {
      setLocMessage(`Showing official data within 50 miles: ${nearbyNames.join(", ")}. ` + locPrecisionNote());
    } else {
      setLocMessage("No public data feed within 50 miles. Nothing was sent or stored. Search a city, or browse the default map.");
      updateRecordsCta(label || "");
      showDefaultCoverage();
    }
    openNearbyList(lat, lng, MILES50);
  }

  // Nearby me: geolocation stays in the browser. It is not sent to a server or stored.
  // Auto-use on first load only if the browser already granted permission. No prompt on load.
  function locateUser(fromGesture) {
    if (!navigator.geolocation) {
      setLocMessage("This browser can’t share a location. Search an address or ZIP instead.");
      if (fromGesture) showDefaultCoverage();
      return Promise.resolve(false);
    }
    if (fromGesture) setLocMessage("Asking for your location…");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyNearby(pos.coords.latitude, pos.coords.longitude, "you");
          resolve(true);
        },
        (err) => {
          if (fromGesture) {
            if (err && err.code === 1) {
              setLocMessage("Location is off. Search an address or ZIP, or browse the map.");
            } else {
              setLocMessage("Couldn’t get your location. Search an address or ZIP, or browse the map.");
            }
            showDefaultCoverage();
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: fromGesture ? 12000 : 8000, maximumAge: fromGesture ? 0 : 60000 }
      );
    });
  }

  async function tryAutoLocate() {
    try {
      if (!navigator.geolocation) return false;
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state !== "granted") return false;
      } else {
        return false;
      }
      return locateUser(false);
    } catch (_) {
      return false;
    }
  }

  function typeHasData(t) {
    return state.regions.some((region) => {
      if (region.kind === "annual-summary") return false;
      const types = (region.meta && region.meta.types) || state.types;
      const idx = types.indexOf(t);
      if (idx < 0) return false;
      const pts = (region.offenses && region.offenses.points) || [];
      if (pts.some((row) => row[0] === idx)) return true;
      const areas = (region.offenses && region.offenses.areas) || [];
      return areas.some((row) => row[0] === idx);
    });
  }

  function groupState(types) {
    const present = types.filter((t) => state.types.includes(t));
    const on = present.filter((t) => state.layers[t]);
    return { present, all: present.length > 0 && on.length === present.length, some: on.length > 0 && on.length < present.length };
  }

  function buildLayerList() {
    const list = document.getElementById("layerList");
    if (!list) return;
    const items = [];
    const used = new Set();
    function typeRow(t) {
      const svg = state.svg[t] || "";
      const meta = SENSITIVE.has(t) ? '<span class="meta">Area only</span>' : "";
      const empty = typeHasData(t) ? "" : '<span class="meta">None in snapshot</span>';
      return `<li><label><span class="layer-icon">${svg}</span><input type="checkbox" data-layer="${t}" ${state.layers[t] ? "checked" : ""}> <span>${LABELS[t] || t}</span>${meta}${empty}</label></li>`;
    }
    for (const group of LAYER_GROUPS) {
      const st = groupState(group.types);
      if (!st.present.length) continue;
      items.push(
        `<li class="layer-group"><label><input type="checkbox" data-group="${group.id}" ${st.all ? "checked" : ""}> <span>${group.heading}</span></label></li>`
      );
      for (const t of st.present) {
        used.add(t);
        items.push(typeRow(t));
      }
    }
    for (const t of state.types) {
      if (!used.has(t)) items.push(typeRow(t));
    }
    items.push(`<li><label><span class="layer-icon">${state.svg.calls || ""}</span><input type="checkbox" data-layer="calls" ${state.layers.calls ? "checked" : ""}> <span>${LABELS.calls}</span><span class="meta">Starts off</span></label></li>`);
    list.innerHTML = items.join("");
    applyLayerSearch();
    list.querySelectorAll("[data-group]").forEach((box) => {
      const group = LAYER_GROUPS.find((g) => g.id === box.dataset.group);
      if (!group) return;
      const st = groupState(group.types);
      box.indeterminate = st.some;
      box.addEventListener("change", () => {
        const on = box.checked;
        for (const t of group.types) {
          if (state.types.includes(t)) state.layers[t] = on;
        }
        saveState();
        syncControls();
        render();
        if (state.center && state.center.radiusMeters) openNearbyList();
      });
    });
  }

  function applyLayerSearch() {
    const list = document.getElementById("layerList");
    const q = (state.typeQuery || "").trim().toLowerCase();
    if (!list) return;
    const rows = [...list.children];
    rows.forEach((li) => {
      if (li.classList.contains("layer-group")) return;
      const label = (li.textContent || "").toLowerCase();
      li.classList.toggle("is-hidden", !!(q && !label.includes(q)));
    });
    rows.forEach((li) => {
      if (!li.classList.contains("layer-group")) return;
      let next = li.nextElementSibling;
      let any = false;
      while (next && !next.classList.contains("layer-group")) {
        if (!next.classList.contains("is-hidden")) any = true;
        next = next.nextElementSibling;
      }
      li.classList.toggle("is-hidden", !any);
    });
  }

  function syncFilterControls() {
    const days = activeDays();
    document.querySelectorAll("[data-day]").forEach((btn) => {
      btn.classList.toggle("is-on", days.includes(Number(btn.dataset.day)));
    });
    const from = document.getElementById("filterFrom");
    const to = document.getElementById("filterTo");
    if (from) from.value = state.dateFrom || "";
    if (to) to.value = state.dateTo || "";
    const search = document.getElementById("layerSearch");
    if (search && search.value !== (state.typeQuery || "")) search.value = state.typeQuery || "";
    const scoreBtn = document.getElementById("scoreBtn");
    if (scoreBtn) {
      scoreBtn.classList.toggle("is-on", !!state.safetyScore);
      scoreBtn.setAttribute("aria-pressed", state.safetyScore ? "true" : "false");
    }
    applyLayerSearch();
  }

  function syncControls() {
    document.querySelectorAll("[data-time]").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.time === state.time);
    });
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.view === state.view);
    });
    document.querySelectorAll("[data-layer]").forEach((box) => {
      box.checked = !!state.layers[box.dataset.layer];
    });
    syncFilterControls();
  }

  const backdrop = document.getElementById("backdrop");
  const drawer = document.getElementById("drawer");
  const sheets = ["alerts", "settings", "layers", "download", "nearby"].map((id) => document.getElementById(`panel-${id}`));

  function closeAll() {
    drawer.hidden = true;
    sheets.forEach((el) => { el.hidden = true; });
    backdrop.hidden = true;
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
    closeOfficialMap();
  }

  function syncChromeHeight() {
    const chrome = document.querySelector(".chrome");
    if (!chrome) return;
    const h = Math.ceil(chrome.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--chrome-h", `${h}px`);
  }

  function openDrawer() {
    syncChromeHeight();
    sheets.forEach((el) => { el.hidden = true; });
    drawer.hidden = false;
    backdrop.hidden = false;
    document.getElementById("menuBtn").setAttribute("aria-expanded", "true");
  }

  function openSheet(id, opts) {
    drawer.hidden = true;
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
    sheets.forEach((el) => { el.hidden = el.id !== `panel-${id}`; });
    // Keep the map visible under the nearby list so pins stay on screen with no extra tap.
    backdrop.hidden = id === "nearby" || (opts && opts.backdrop === false);
  }

  const THEME_KEY = "crimestat-theme";

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    const btn = document.getElementById("themeBtn");
    if (btn) {
      const dark = theme === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#101826" : "#ffffff");
    if (persist) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* ignore */ }
    }
  }

  function initTheme() {
    applyTheme(currentTheme(), false);
    const btn = document.getElementById("themeBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
      });
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const followOs = (e) => {
      try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") return;
      } catch (_) { return; }
      applyTheme(e.matches ? "dark" : "light", false);
    };
    if (mq.addEventListener) mq.addEventListener("change", followOs);
    else if (mq.addListener) mq.addListener(followOs);
  }

  function esriTile(path, attribution, extra) {
    return L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/" + path + "/MapServer/tile/{z}/{y}/{x}",
      Object.assign({ attribution, maxZoom: 19 }, extra || {})
    );
  }

  function initMap() {
    map = L.map("map", { zoomControl: true, attributionControl: true });
    map.createPane("basemapLabels");
    map.getPane("basemapLabels").style.zIndex = 250;
    map.getPane("basemapLabels").style.pointerEvents = "none";

    const osmAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const esriImageryAttr = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community';
    const esriRefAttr = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community';
    const otmAttr = 'Kartendaten: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende, SRTM | Kartendarstellung: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';

    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: osmAttr,
    });
    const satellite = esriTile("World_Imagery", esriImageryAttr);
    const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      attribution: otmAttr,
    });
    const hybrid = L.layerGroup([
      esriTile("World_Imagery", esriImageryAttr),
      esriTile("Reference/World_Transportation", esriRefAttr, { pane: "basemapLabels" }),
      esriTile("Reference/World_Boundaries_and_Places", esriRefAttr, { pane: "basemapLabels" }),
    ]);
    street.addTo(map);
    L.control.layers(
      { Street: street, Satellite: satellite, Terrain: terrain, Hybrid: hybrid },
      {},
      { position: "topright", collapsed: true }
    ).addTo(map);
    nbhLayer = L.geoJSON(null, {
      style: { color: "#64748b", weight: 1.15, fillColor: "#ffffff", fillOpacity: 0 },
      interactive: false,
    }).addTo(map);
    areaLayer = L.layerGroup().addTo(map);
    callsLayer = L.layerGroup().addTo(map);
    pinLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      disableClusteringAtZoom: 16,
      spiderfyOnMaxZoom: true,
      animate: false,
      animateAddingMarkers: false,
    }).addTo(map);
    map.setView([39.8283, -98.5795], 4);
    map.on("moveend", () => {
      // Keep the empty-state and layers accurate if the user pans into or between covered cities.
      if (!state.center) return;
      const key = visibleRegions().map((r) => r.id).join(",");
      if (key !== state.visibleKey) render();
    });
  }

  function isStandaloneApp() {
    return window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
  }

  function isIosSafari() {
    const ua = navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const webkit = /WebKit/i.test(ua);
    const other = /CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
    return ios && webkit && !other;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* ignore */ });
    });
  }

  const INSTALL_HINT_KEY = "crimestat-install-hint";
  let deferredInstall = null;

  function hideInstallBar() {
    const bar = document.getElementById("installBar");
    if (bar) bar.hidden = true;
  }

  function showInstallBar(mode) {
    const bar = document.getElementById("installBar");
    const btn = document.getElementById("installAppBtn");
    const hint = document.getElementById("iosInstallHint");
    if (!bar || !btn || !hint) return;
    if (mode === "android") {
      btn.hidden = false;
      hint.hidden = true;
    } else {
      btn.hidden = true;
      hint.hidden = false;
    }
    bar.hidden = false;
  }

  async function promptInstall() {
    if (!deferredInstall) return;
    const ev = deferredInstall;
    deferredInstall = null;
    ev.prompt();
    try { await ev.userChoice; } catch (_) { /* ignore */ }
    hideInstallBar();
  }

  function initInstall() {
    if (isStandaloneApp()) {
      hideInstallBar();
      document.body.classList.add("is-standalone");
      return;
    }

    const sheetBtn = document.getElementById("sheetInstallBtn");
    const barBtn = document.getElementById("installAppBtn");
    const dismiss = document.getElementById("dismissInstall");
    if (barBtn) barBtn.addEventListener("click", promptInstall);
    if (sheetBtn) {
      sheetBtn.addEventListener("click", async () => {
        if (deferredInstall) {
          await promptInstall();
          return;
        }
        if (isIosSafari()) {
          closeAll();
          try {
            const saved = localStorage.getItem(INSTALL_HINT_KEY);
            if (saved !== "dismissed") showInstallBar("ios");
          } catch (_) {
            showInstallBar("ios");
          }
        }
      });
    }
    if (dismiss) {
      dismiss.addEventListener("click", () => {
        hideInstallBar();
        try { localStorage.setItem(INSTALL_HINT_KEY, "dismissed"); } catch (_) { /* ignore */ }
      });
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstall = e;
      if (sheetBtn) sheetBtn.hidden = false;
      showInstallBar("android");
    });
    window.addEventListener("appinstalled", () => {
      deferredInstall = null;
      hideInstallBar();
    });

    if (isIosSafari()) {
      try {
        if (localStorage.getItem(INSTALL_HINT_KEY) === "dismissed") return;
      } catch (_) { /* show anyway */ }
      showInstallBar("ios");
    }
  }

  function initEvents() {
    initTheme();
    registerServiceWorker();
    initInstall();
    window.addEventListener("resize", syncChromeHeight);
    syncChromeHeight();
    document.getElementById("menuBtn").addEventListener("click", () => {
      if (!drawer.hidden) closeAll();
      else openDrawer();
    });
    document.getElementById("closeDrawer").addEventListener("click", closeAll);
    backdrop.addEventListener("click", closeAll);
    document.querySelectorAll(".sheet-close").forEach((btn) => btn.addEventListener("click", closeAll));
    document.getElementById("downloadBtn").addEventListener("click", () => openSheet("download"));
    document.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => openSheet(btn.dataset.open));
    });

    document.getElementById("searchForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const q = document.getElementById("searchInput").value.trim();
      if (!q) return;
      await runSearch(q);
    });

    document.querySelectorAll("[data-time]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.time = btn.dataset.time;
        saveState();
        syncControls();
        render();
        const nearby = document.getElementById("panel-nearby");
        if (nearby && !nearby.hidden && state.center && state.center.radiusMeters) openNearbyList();
      });
    });
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.view = btn.dataset.view;
        saveState();
        syncControls();
        render();
      });
    });
    document.getElementById("layersBtn").addEventListener("click", () => openSheet("layers"));
    document.getElementById("locateBtn").addEventListener("click", () => locateUser(true));
    document.getElementById("settingsLocate").addEventListener("click", () => { closeAll(); locateUser(true); });
    document.getElementById("settingsSpokane").addEventListener("click", () => { closeAll(); showSpokane(); });
    document.getElementById("jumpSpokane").addEventListener("click", showSpokane);
    const jumpSeattle = document.getElementById("jumpSeattle");
    if (jumpSeattle) jumpSeattle.addEventListener("click", () => showRegion("seattle"));
    const settingsSeattle = document.getElementById("settingsSeattle");
    if (settingsSeattle) settingsSeattle.addEventListener("click", () => { closeAll(); showRegion("seattle"); });
    const jumpKent = document.getElementById("jumpKent");
    if (jumpKent) jumpKent.addEventListener("click", () => showRegion("kent"));
    const settingsKent = document.getElementById("settingsKent");
    if (settingsKent) settingsKent.addEventListener("click", () => { closeAll(); showRegion("kent"); });
    const jumpAuburn = document.getElementById("jumpAuburn");
    if (jumpAuburn) jumpAuburn.addEventListener("click", () => showRegion("auburn"));
    const settingsAuburn = document.getElementById("settingsAuburn");
    if (settingsAuburn) settingsAuburn.addEventListener("click", () => { closeAll(); showRegion("auburn"); });
    for (const city of EXTRA_SNAPSHOTS) {
      const jump = document.getElementById(city.jump);
      if (jump) jump.addEventListener("click", () => showRegion(city.id));
      const settings = document.getElementById(city.settings);
      if (settings) settings.addEventListener("click", () => { closeAll(); showRegion(city.id); });
    }
    const officialMapClose = document.getElementById("officialMapClose");
    if (officialMapClose) officialMapClose.addEventListener("click", () => closeOfficialMap());
    const officialMapBtn = document.getElementById("officialMapBtn");
    if (officialMapBtn) officialMapBtn.addEventListener("click", () => {
      const id = officialMapBtn.dataset.region;
      if (id) openOfficialMap(id);
    });
    for (const id of Object.keys(OFFICIAL_MAPS)) {
      const cap = { federalway: "FederalWay", spokanevalley: "SpokaneValley" }[id]
        || (id[0].toUpperCase() + id.slice(1));
      const settings = document.getElementById("settings" + cap);
      if (settings) settings.addEventListener("click", () => { closeAll(); showRegion(id); });
    }

    document.getElementById("layerList").addEventListener("change", async (e) => {
      const box = e.target.closest("[data-layer]");
      if (!box) return;
      state.layers[box.dataset.layer] = box.checked;
      saveState();
      if (box.dataset.layer === "calls" && box.checked) {
        await ensureCalls();
      }
      render();
        const nearby = document.getElementById("panel-nearby");
        if (nearby && !nearby.hidden && state.center && state.center.radiusMeters) openNearbyList();
    });
    document.getElementById("layersAll").addEventListener("click", () => {
      for (const t of state.types) state.layers[t] = !OFF_BY_DEFAULT.has(t);
      state.layers.calls = false;
      saveState();
      syncControls();
      render();
    });
    document.getElementById("layersNone").addEventListener("click", () => {
      for (const t of state.types) state.layers[t] = false;
      state.layers.calls = false;
      saveState();
      syncControls();
      render();
    });
    const scoreBtn = document.getElementById("scoreBtn");
    if (scoreBtn) {
      scoreBtn.addEventListener("click", () => {
        state.safetyScore = !state.safetyScore;
        saveState();
        syncControls();
        render();
      });
    }
    const layerSearch = document.getElementById("layerSearch");
    if (layerSearch) {
      layerSearch.addEventListener("input", () => {
        state.typeQuery = layerSearch.value || "";
        applyLayerSearch();
      });
    }
    document.querySelectorAll("[data-day]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const day = Number(btn.dataset.day);
        const selected = new Set(activeDays());
        if (selected.size === 7) {
          state.days = [day];
        } else if (selected.has(day)) {
          selected.delete(day);
          state.days = selected.size ? [...selected].sort() : [0, 1, 2, 3, 4, 5, 6];
        } else {
          selected.add(day);
          state.days = [...selected].sort();
        }
        saveState();
        syncControls();
        render();
        const nearby = document.getElementById("panel-nearby");
        if (nearby && !nearby.hidden && state.center && state.center.radiusMeters) openNearbyList();
      });
    });
    const filterFrom = document.getElementById("filterFrom");
    const filterTo = document.getElementById("filterTo");
    function applyDateFilters() {
      state.dateFrom = (filterFrom && filterFrom.value) || "";
      state.dateTo = (filterTo && filterTo.value) || "";
      if (state.dateFrom && state.dateTo && state.dateFrom > state.dateTo) {
        const swap = state.dateFrom;
        state.dateFrom = state.dateTo;
        state.dateTo = swap;
      }
      saveState();
      syncControls();
      render();
      const nearby = document.getElementById("panel-nearby");
      if (nearby && !nearby.hidden && state.center && state.center.radiusMeters) openNearbyList();
    }
    if (filterFrom) filterFrom.addEventListener("change", applyDateFilters);
    if (filterTo) filterTo.addEventListener("change", applyDateFilters);
    const clearDates = document.getElementById("filterDatesClear");
    if (clearDates) {
      clearDates.addEventListener("click", () => {
        state.dateFrom = "";
        state.dateTo = "";
        saveState();
        syncControls();
        render();
      });
    }

    document.getElementById("resetFilters").addEventListener("click", () => {
      state.time = "snapshot";
      state.view = "pins";
      for (const t of state.types) state.layers[t] = !OFF_BY_DEFAULT.has(t);
      state.layers.calls = false;
      resetCrimeFilters();
      saveState();
      syncControls();
      render();
    });
    document.getElementById("alertsForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = document.getElementById("alertsMsg");
      msg.hidden = false;
      msg.textContent = "Thanks. Alert emails aren’t sending yet — this form is a preview only. Nothing was submitted to a server.";
      e.target.reset();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
  }

  async function runSearch(q) {
    setLocMessage("Looking up that address…");
    try {
      const results = await searchAddress(q);
      const hit = Array.isArray(results) ? results[0] : null;
      if (!hit && /spokane/i.test(q)) {
        showSpokane();
        return;
      }
      if (!hit && /seattle/i.test(q)) {
        showRegion("seattle");
        return;
      }
      if (!hit && /\bkent\b/i.test(q)) {
        showRegion("kent");
        return;
      }
      if (!hit && /\bauburn\b/i.test(q)) {
        showRegion("auburn");
        return;
      }
      if (!hit && /\beverett\b/i.test(q)) {
        showRegion("everett");
        return;
      }
      if (!hit && /\bshoreline\b/i.test(q)) {
        showRegion("shoreline");
        return;
      }
      if (!hit && /\bkenmore\b/i.test(q)) {
        showRegion("kenmore");
        return;
      }
      if (!hit && /\bburien\b/i.test(q)) { showRegion("burien"); return; }
      if (!hit && /sea\s*-?tac/i.test(q)) { showRegion("seatac"); return; }
      if (!hit && /covington/i.test(q)) { showRegion("covington"); return; }
      if (!hit && /maple\s*valley/i.test(q)) { showRegion("maplevalley"); return; }
      if (!hit && /woodinville/i.test(q)) { showRegion("woodinville"); return; }
      if (!hit && /sammamish/i.test(q)) { showRegion("sammamish"); return; }
      if (!hit && /north\s*bend/i.test(q)) { showRegion("northbend"); return; }
      if (!hit && /\bnewcastle\b/i.test(q)) { showRegion("newcastle"); return; }
      if (!hit && /carnation/i.test(q)) { showRegion("carnation"); return; }
      if (!hit && /skykomish/i.test(q)) { showRegion("skykomish"); return; }
      if (!hit && /king\s*county\s*sheriff|kcso\s*other|unincorporated\s*king/i.test(q)) { showRegion("kcsoother"); return; }
      if (!hit && /\btacoma\b/i.test(q)) { showRegion("tacoma"); return; }
      if (!hit && /\byakima\b/i.test(q)) { showRegion("yakima"); return; }
      if (!hit && /bellevue/i.test(q)) { showRegion("bellevue"); return; }
      if (!hit && /federal\s*way/i.test(q)) { showRegion("federalway"); return; }
      if (!hit && /spokane\s*valley/i.test(q)) { showRegion("spokanevalley"); return; }
      if (!hit && /\blakewood\b/i.test(q)) { showRegion("lakewood"); return; }
      if (!hit && /issaquah/i.test(q)) { showRegion("issaquah"); return; }
      if (!hit && /\bbothell\b/i.test(q)) { showRegion("bothell"); return; }
      if (!hit) {
        setLocMessage("No match for that address or ZIP. Try a city and state, or a 5-digit ZIP.");
        return;
      }
      setCenter(Number(hit.lat), Number(hit.lon), formatAddress(hit) || hit.display_name);
    } catch (_) {
      if (/spokane/i.test(q)) showSpokane();
      else if (/seattle/i.test(q)) showRegion("seattle");
      else if (/\bkent\b/i.test(q)) showRegion("kent");
      else if (/\bauburn\b/i.test(q)) showRegion("auburn");
      else if (/\beverett\b/i.test(q)) showRegion("everett");
      else if (/\bshoreline\b/i.test(q)) showRegion("shoreline");
      else if (/\bkenmore\b/i.test(q)) showRegion("kenmore");
      else if (/\bburien\b/i.test(q)) showRegion("burien");
      else if (/sea\s*-?tac/i.test(q)) showRegion("seatac");
      else if (/covington/i.test(q)) showRegion("covington");
      else if (/maple\s*valley/i.test(q)) showRegion("maplevalley");
      else if (/woodinville/i.test(q)) showRegion("woodinville");
      else if (/sammamish/i.test(q)) showRegion("sammamish");
      else if (/north\s*bend/i.test(q)) showRegion("northbend");
      else if (/\bnewcastle\b/i.test(q)) showRegion("newcastle");
      else if (/carnation/i.test(q)) showRegion("carnation");
      else if (/skykomish/i.test(q)) showRegion("skykomish");
      else if (/king\s*county\s*sheriff|kcso\s*other|unincorporated\s*king/i.test(q)) showRegion("kcsoother");
      else if (/\btacoma\b/i.test(q)) showRegion("tacoma");
      else if (/\byakima\b/i.test(q)) showRegion("yakima");
      else if (/bellevue/i.test(q)) showRegion("bellevue");
      else if (/federal\s*way/i.test(q)) showRegion("federalway");
      else if (/spokane\s*valley/i.test(q)) showRegion("spokanevalley");
      else if (/\blakewood\b/i.test(q)) showRegion("lakewood");
      else if (/issaquah/i.test(q)) showRegion("issaquah");
      else if (/\bbothell\b/i.test(q)) showRegion("bothell");
      else setLocMessage("Address lookup failed. Wait a moment and try again.");
    }
  }

  async function loadSvg(name) {
    const res = await fetch(`/icons/layers/${name}.svg`);
    if (!res.ok) return "";
    return res.text();
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load " + url);
    return res.json();
  }

  function setBootState(kind) {
    const loading = document.getElementById("bootScreen");
    const error = document.getElementById("bootError");
    if (loading) loading.hidden = kind !== "loading";
    if (error) error.hidden = kind !== "error";
  }

  async function boot() {
    loadState();
    initMap();
    initEvents();
    setBootState("loading");

    const [meta, neighborhoods, offenses] = await Promise.all([
      fetchJson("/data/meta.json"),
      fetchJson("/data/neighborhoods.json"),
      fetchJson("/data/offenses.json"),
    ]);
    state.meta = meta;
    state.neighborhoods = neighborhoods;
    state.offenses = offenses;
    state.types = meta.types || [];
    state.regions = [{
      id: "spokane",
      kind: "incidents",
      meta: Object.assign({ id: "spokane" }, meta),
      neighborhoods,
      offenses,
      calls: null,
    }];
    applyDefaultLayers();

    const iconNames = state.types.concat(["calls"]);
    const svgs = await Promise.all(iconNames.map(loadSvg));
    iconNames.forEach((name, i) => { state.svg[name] = svgs[i]; });

    try {
      const [sMeta, sNbh, sOff] = await Promise.all([
        fetchJson("/data/seattle/meta.json"),
        fetchJson("/data/seattle/neighborhoods.json"),
        fetchJson("/data/seattle/offenses.json"),
      ]);
      state.regions.push({
        id: "seattle",
        kind: "incidents",
        meta: sMeta,
        neighborhoods: sNbh,
        offenses: sOff,
        calls: null,
      });
    } catch (_) { /* Spokane still works if Seattle data is missing */ }

    try {
      const [kMeta, kNbh, kSum] = await Promise.all([
        fetchJson("/data/kent/meta.json"),
        fetchJson("/data/kent/neighborhoods.json"),
        fetchJson("/data/kent/summary.json"),
      ]);
      state.regions.push({
        id: "kent",
        kind: "annual-summary",
        meta: kMeta,
        neighborhoods: kNbh,
        summary: kSum,
        offenses: null,
        calls: null,
      });
    } catch (_) { /* optional */ }

    try {
      const [aMeta, aNbh, aOff] = await Promise.all([
        fetchJson("/data/auburn/meta.json"),
        fetchJson("/data/auburn/neighborhoods.json"),
        fetchJson("/data/auburn/offenses.json"),
      ]);
      state.regions.push({
        id: "auburn",
        kind: "incidents",
        meta: aMeta,
        neighborhoods: aNbh,
        offenses: aOff,
        calls: null,
      });
    } catch (_) { /* optional */ }

    for (const city of EXTRA_SNAPSHOTS) {
      try {
        const [cMeta, cNbh, cOff] = await Promise.all([
          fetchJson(`/data/${city.id}/meta.json`),
          fetchJson(`/data/${city.id}/neighborhoods.json`),
          fetchJson(`/data/${city.id}/offenses.json`),
        ]);
        state.regions.push({
          id: city.id,
          kind: "incidents",
          meta: cMeta,
          neighborhoods: cNbh,
          offenses: cOff,
          calls: null,
        });
      } catch (_) { /* optional city snapshot */ }
    }

    const coveredNames = [];
    for (const [id, jumpId, settingsId, name] of [
      ["seattle", "jumpSeattle", "settingsSeattle", "Seattle"],
      ["kent", "jumpKent", "settingsKent", "Kent"],
      ["auburn", "jumpAuburn", "settingsAuburn", "Auburn"],
      ...EXTRA_SNAPSHOTS.map((c) => [c.id, c.jump, c.settings, c.name]),
    ]) {
      if (!findRegion(id)) continue;
      const jump = document.getElementById(jumpId);
      const settings = document.getElementById(settingsId);
      if (jump) jump.hidden = false;
      if (settings) settings.hidden = false;
      coveredNames.push(name);
    }
    const emptyCopy = document.querySelector("#emptyState p:nth-of-type(2)");
    if (emptyCopy) {
      const list = ["Spokane", ...coveredNames];
      if (list.length > 8) {
        emptyCopy.textContent = "Official public data is available for Spokane, Seattle, Auburn, Everett, and King County Sheriff cities including Burien, Shoreline, SeaTac, and others. Search a city to view it.";
      } else {
        const listed = list.length === 1 ? list[0] : `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
        emptyCopy.textContent = `Official public data is available for ${listed}. Search a city to view it.`;
      }
    }

    document.getElementById("asOfBanner").textContent =
      `${meta.label} This is public data as of that date, not a real-time feed.`;
    syncChromeHeight();
    const aboutBits = state.regions.map((r) => {
      const label = r.meta.label || "";
      const note = r.meta.defaultWindowNote || "";
      const credit = r.meta.credit || r.meta.source || "";
      const text = [label, note].filter(Boolean).join(" ");
      return credit && !text.includes(credit) ? `${text} ${credit}` : text;
    });
    document.getElementById("settingsAbout").textContent =
      `${aboutBits.join(" ")} Auburn pin popups show official street addresses from Auburn Police Department public data. In other covered cities, locations are shown at neighborhood, 100-block, or city level only.`;

    for (const region of state.regions) {
      if (region.neighborhoods) nbhLayer.addData(region.neighborhoods);
    }
    buildLayerList();
    syncControls();
    syncFreshness();

    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || params.get("city") || "").trim();
    if (q) {
      document.getElementById("searchInput").value = q;
      await runSearch(q);
    } else {
      const located = await tryAutoLocate();
      if (!located) showDefaultCoverage();
    }
    setBootState("ready");
  }

  document.getElementById("bootRetry")?.addEventListener("click", () => {
    location.reload();
  });

  boot().catch(() => {
    document.getElementById("asOfBanner").textContent = "Could not load official crime data.";
    setBootState("error");
  });
})();

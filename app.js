/* CrimeStat — official Spokane PD snapshot (no demo incidents). */
(() => {
  const MILES5 = 1609.344 * 5;
  const STORAGE_KEY = "crimestat-ui-v2";
  const OFF_BY_DEFAULT = new Set(["domestic_violence", "stalking", "shots_fired", "calls"]);
  const WINDOW_DAYS = { "30d": 30, "60d": 60, "90d": 90, "6m": 182, "1y": 365, "5y": 365 * 5 };
  const REGION_FALLBACKS = {
    spokane: { lat: 47.6588, lng: -117.426, label: "Spokane, Washington" },
    seattle: { lat: 47.6062, lng: -122.3321, label: "Seattle, Washington" },
    kent: { lat: 47.3900, lng: -122.2135, label: "Kent, Washington" },
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
  };

  let map, pinLayer, areaLayer, heatLayer, radiusCircle, userMarker, nbhLayer, callsLayer;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw) return;
      if (raw.time === "snapshot" || WINDOW_DAYS[raw.time]) state.time = raw.time;
      if (raw.view === "heat" || raw.view === "pins") state.view = raw.view;
      if (raw.layers && typeof raw.layers === "object") state.layers = { ...raw.layers };
    } catch (_) { /* ignore */ }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      time: state.time,
      view: state.view,
      layers: state.layers,
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

  function pinNoteFor(region) {
    if (region.id === "seattle") {
      return "Location is the official 100-block or MCPP neighborhood, not a street address.";
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

  function radiusBounds(lat, lng, meters) {
    const dLat = meters / 111320;
    const dLng = meters / (111320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    return L.latLngBounds([lat - dLat, lng - dLng], [lat + dLat, lng + dLng]);
  }

  function regionInView(region) {
    const cov = regionBounds(region);
    if (!cov) return false;
    if (state.center) {
      const around = radiusBounds(state.center.lat, state.center.lng, MILES5);
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
      if (/not a real-time|not real-time/i.test(label)) return label;
      return `${label} This is public data as of that date, not a real-time feed.`;
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
    if (!covered) return;

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
        if (!type || !typeOn(region, type) || !inWindow(region, d)) continue;
        if (!nbhArea.has(n)) nbhArea.set(n, {});
        nbhArea.get(n)[type] = (nbhArea.get(n)[type] || 0) + c;
      }

      if (state.layers.calls && region.calls) {
        const callCounts = new Map();
        for (const [n, d, c] of region.calls.cells || []) {
          if (!inWindow(region, d)) continue;
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
          if (!type || !typeOn(region, type) || !inWindow(region, d) || SENSITIVE.has(type)) continue;
          heat.push([y / 10000, x / 10000, 0.6]);
        }
      } else {
        for (const row of region.offenses.points || []) {
          const [t, n, d, x, y] = row;
          const type = types[t];
          if (!type || !typeOn(region, type) || !inWindow(region, d) || SENSITIVE.has(type)) continue;
          const feat = features[n];
          const name = feat ? feat.properties.name : "Unknown neighborhood";
          const label = typeLabel(region, type);
          const marker = L.marker([y / 10000, x / 10000], {
            icon: iconFor(type),
            title: label,
            keyboard: false,
          }).bindPopup(popupHtml(
            label,
            `${name}<br>${formatDay(region, d)}`,
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
        minWidth: 220,
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

  function locPrecisionNote() {
    return visibleRegions().some((r) => r.kind === "annual-summary")
      ? "City-level annual totals only."
      : "Neighborhood-level official data only.";
  }

  function refreshLocPrecision() {
    const el = document.getElementById("locBar");
    if (!el) return;
    const text = el.textContent || "";
    if (!/Neighborhood-level official data only|City-level annual totals only/.test(text)) return;
    el.textContent = text
      .replace(/Neighborhood-level official data only\.?/, locPrecisionNote())
      .replace(/City-level annual totals only\.?/, locPrecisionNote());
  }

  function setCenter(lat, lng, label) {
    state.center = { lat, lng, label };
    if (radiusCircle) map.removeLayer(radiusCircle);
    radiusCircle = L.circle([lat, lng], {
      radius: MILES5,
      color: "#111827",
      weight: 1.5,
      dashArray: "6 6",
      fillColor: "#3b82f6",
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(map);
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.circleMarker([lat, lng], {
      radius: 7,
      color: "#fff",
      weight: 2,
      fillColor: "#2563eb",
      fillOpacity: 1,
    }).addTo(map);
    map.invalidateSize();
    map.fitBounds(radiusCircle.getBounds(), { padding: [28, 28], maxZoom: 14, animate: false });
    const covered = viewIntersectsCoverage();
    if (covered) {
      setLocMessage((label ? `Centered near ${label}` : "Centered here") +
        " · default view is a 5-mile radius (zoom out to see more). " + locPrecisionNote());
    } else {
      setLocMessage((label ? `Centered near ${label}. ` : "") +
        "No public data feed for this area yet.");
    }
    render();
    refreshLocPrecision();
  }

  function showRegion(id) {
    const region = findRegion(id);
    const fallback = REGION_FALLBACKS[id] || {};
    if (!region && !fallback.lat) return;
    const c = region && region.meta && region.meta.center;
    const lng = c ? c[0] : fallback.lng;
    const lat = c ? c[1] : fallback.lat;
    setCenter(lat, lng, fallback.label || (region && region.meta && region.meta.label) || id);
    const cov = region ? regionBounds(region) : null;
    if (cov) map.fitBounds(cov, { padding: [28, 28], maxZoom: 13, animate: false });
    refreshLocPrecision();
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

  // Nearby me: geolocation stays in the browser. It is not sent to a server or stored.
  function locateUser() {
    if (!navigator.geolocation) {
      setLocMessage("This browser can’t share a location. Search an address or ZIP instead.");
      return;
    }
    setLocMessage("Asking for your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter(lat, lng, "you");
        const ranked = neighborhoodsByDistance(lat, lng);
        const closest = ranked.filter((n) => n.meters <= MILES5).slice(0, 5);
        if (closest.length) {
          const names = closest.map((n) => n.name).join(", ");
          setLocMessage(`Showing neighborhoods closest to you: ${names}. Neighborhood areas only — no addresses.`);
        } else if (state.inCoverage) {
          const names = ranked.slice(0, 5).map((n) => n.name).join(", ");
          setLocMessage(`Showing neighborhoods closest to you: ${names}. Neighborhood areas only — no addresses.`);
        } else {
          setLocMessage("No public data feed near you yet. Nothing was sent or stored. Search an address or view Spokane.");
        }
      },
      (err) => {
        if (err && err.code === 1) {
          setLocMessage("Location is off. Search an address or ZIP, or view Spokane.");
        } else {
          setLocMessage("Couldn’t get your location. Search an address or ZIP, or view Spokane.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  function buildLayerList() {
    const list = document.getElementById("layerList");
    const items = state.types.map((t) => {
      const svg = state.svg[t] || "";
      const meta = SENSITIVE.has(t) ? '<span class="meta">Area only</span>' : "";
      const empty = (t === "home_invasion" || t === "missing_persons")
        ? '<span class="meta">None in snapshot</span>' : "";
      return `<li><label><span class="layer-icon">${svg}</span><input type="checkbox" data-layer="${t}" ${state.layers[t] ? "checked" : ""}> <span>${LABELS[t]}</span>${meta}${empty}</label></li>`;
    });
    items.push(`<li><label><span class="layer-icon">${state.svg.calls || ""}</span><input type="checkbox" data-layer="calls" ${state.layers.calls ? "checked" : ""}> <span>${LABELS.calls}</span><span class="meta">Starts off</span></label></li>`);
    list.innerHTML = items.join("");
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
  }

  const backdrop = document.getElementById("backdrop");
  const drawer = document.getElementById("drawer");
  const sheets = ["alerts", "settings", "layers", "download"].map((id) => document.getElementById(`panel-${id}`));

  function closeAll() {
    drawer.hidden = true;
    sheets.forEach((el) => { el.hidden = true; });
    backdrop.hidden = true;
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
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

  function openSheet(id) {
    drawer.hidden = true;
    document.getElementById("menuBtn").setAttribute("aria-expanded", "false");
    sheets.forEach((el) => { el.hidden = el.id !== `panel-${id}`; });
    backdrop.hidden = false;
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
    document.getElementById("locateBtn").addEventListener("click", locateUser);
    document.getElementById("settingsLocate").addEventListener("click", () => { closeAll(); locateUser(); });
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

    document.getElementById("layerList").addEventListener("change", async (e) => {
      const box = e.target.closest("[data-layer]");
      if (!box) return;
      state.layers[box.dataset.layer] = box.checked;
      saveState();
      if (box.dataset.layer === "calls" && box.checked) {
        await ensureCalls();
      }
      render();
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
    document.getElementById("resetFilters").addEventListener("click", () => {
      state.time = "snapshot";
      state.view = "pins";
      for (const t of state.types) state.layers[t] = !OFF_BY_DEFAULT.has(t);
      state.layers.calls = false;
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
      if (!hit) {
        setLocMessage("No match for that address or ZIP. Try a city and state, or a 5-digit ZIP.");
        return;
      }
      setCenter(Number(hit.lat), Number(hit.lon), formatAddress(hit) || hit.display_name);
    } catch (_) {
      if (/spokane/i.test(q)) showSpokane();
      else if (/seattle/i.test(q)) showRegion("seattle");
      else if (/\bkent\b/i.test(q)) showRegion("kent");
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

    if (findRegion("kent")) {
      const jk = document.getElementById("jumpKent");
      const sk = document.getElementById("settingsKent");
      if (jk) jk.hidden = false;
      if (sk) sk.hidden = false;
      const emptyCopy = document.querySelector("#emptyState p:nth-of-type(2)");
      if (emptyCopy) emptyCopy.textContent = "Official public data is available for Spokane, Seattle, and Kent. Search a city to view it.";
    }

    document.getElementById("asOfBanner").textContent =
      `${meta.label} This is public data as of that date, not a real-time feed.`;
    syncChromeHeight();
    const aboutBits = state.regions.map((r) => {
      const label = r.meta.label || "";
      const note = r.meta.defaultWindowNote || "";
      return [label, note].filter(Boolean).join(" ");
    });
    document.getElementById("settingsAbout").textContent =
      `${aboutBits.join(" ")} Locations are shown at neighborhood or city level only. Street addresses are not published on CrimeStat.`;

    for (const region of state.regions) {
      if (region.neighborhoods) nbhLayer.addData(region.neighborhoods);
    }
    buildLayerList();
    syncControls();
    setBootState("ready");

    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || params.get("city") || "").trim();
    if (q) {
      document.getElementById("searchInput").value = q;
      await runSearch(q);
    }
  }

  document.getElementById("bootRetry")?.addEventListener("click", () => {
    location.reload();
  });

  boot().catch(() => {
    document.getElementById("asOfBanner").textContent = "Could not load official crime data.";
    setBootState("error");
  });
})();

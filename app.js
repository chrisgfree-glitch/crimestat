/* CrimeStat — official Spokane PD snapshot (no demo incidents). */
(() => {
  const MILES5 = 1609.344 * 5;
  const STORAGE_KEY = "crimestat-ui-v2";
  const OFF_BY_DEFAULT = new Set(["domestic_violence", "stalking", "shots_fired", "calls"]);
  const START = Date.UTC(2026, 4, 1);
  const AS_OF = Date.UTC(2026, 8, 27);
  const WINDOW_DAYS = { "6m": 182, "1y": 365, "5y": 365 * 5 };
  const SPOKANE_FALLBACK = { lat: 47.6588, lng: -117.426, label: "Spokane, Washington" };

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
    svg: {},
    center: null,
    inCoverage: false,
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

  function inWindow(day) {
    if (state.time === "snapshot") return true;
    const ms = START + day * 864e5;
    return AS_OF - ms <= WINDOW_DAYS[state.time] * 864e5;
  }

  function formatDay(day) {
    const dt = new Date(START + day * 864e5);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }

  function applyDefaultLayers() {
    for (const t of state.types) {
      if (typeof state.layers[t] !== "boolean") state.layers[t] = !OFF_BY_DEFAULT.has(t);
    }
    if (typeof state.layers.calls !== "boolean") state.layers.calls = false;
  }

  function coverageBounds() {
    const b = state.meta && state.meta.bbox;
    if (!b) return null;
    return L.latLngBounds([b[1], b[0]], [b[3], b[2]]);
  }

  function radiusBounds(lat, lng, meters) {
    const dLat = meters / 111320;
    const dLng = meters / (111320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
    return L.latLngBounds([lat - dLat, lng - dLng], [lat + dLat, lng + dLng]);
  }

  function viewIntersectsCoverage() {
    const cov = coverageBounds();
    if (!cov || !state.center) return false;
    const around = radiusBounds(state.center.lat, state.center.lng, MILES5);
    return cov.intersects(around) || cov.contains([state.center.lat, state.center.lng]);
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
    if (!svg) return undefined;
    return L.divIcon({
      className: "cs-ico",
      html: svg,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12],
    });
  }

  function render() {
    if (pinLayer) pinLayer.clearLayers();
    if (areaLayer) areaLayer.clearLayers();
    if (callsLayer) callsLayer.clearLayers();
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }

    const covered = viewIntersectsCoverage();
    state.inCoverage = covered;
    document.getElementById("emptyState").hidden = covered;
    if (!covered || !state.offenses || !state.neighborhoods) return;

    const heat = [];
    const nbhArea = new Map(); // id -> [{type, count}]
    const features = state.neighborhoods.features || [];

    for (const row of state.offenses.areas) {
      const [t, n, d, c] = row;
      const type = state.types[t];
      if (!type || !state.layers[type] || !inWindow(d)) continue;
      if (!nbhArea.has(n)) nbhArea.set(n, {});
      nbhArea.get(n)[type] = (nbhArea.get(n)[type] || 0) + c;
    }

    function badgeMarker(latlng, html, popupTitle, popupBody, popupNote, borderColor) {
      const icon = L.divIcon({
        className: "cs-badge-wrap",
        html: `<div class="nbh-badge" style="border-color:${borderColor}">${html}</div>`,
        iconSize: null,
        iconAnchor: [20, 12],
      });
      return L.marker(latlng, { icon, keyboard: false, zIndexOffset: 200 })
        .bindPopup(popupHtml(popupTitle, popupBody, popupNote));
    }

    function centroidOf(feat) {
      const c = feat.properties && feat.properties.c;
      if (c && Number.isFinite(c[1]) && Number.isFinite(c[0])) return [c[1], c[0]];
      const b = L.geoJSON(feat).getBounds();
      return b.getCenter();
    }

    if (state.layers.calls && state.calls) {
      const callCounts = new Map();
      for (const [n, d, c] of state.calls.cells) {
        if (!inWindow(d)) continue;
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
      const types = Object.keys(bag);
      const total = types.reduce((s, typ) => s + bag[typ], 0);
      const primary = types.slice().sort((a, b) => bag[b] - bag[a])[0];
      const icons = types.slice(0, 3).map((typ) => state.svg[typ] || "").join("");
      L.geoJSON(feat, {
        style: { color: typeColor(primary), weight: 1.6, fillColor: "#ffffff", fillOpacity: 0 },
        interactive: false,
      }).addTo(areaLayer);
      badgeMarker(
        centroidOf(feat),
        `${icons}<span class="nbh-n">${total.toLocaleString()}</span>`,
        feat.properties.name,
        types.map((typ) => `${LABELS[typ]}: ${bag[typ]}`).join("<br>"),
        AREA_NOTE,
        typeColor(primary)
      ).addTo(areaLayer);
    }

    if (state.view === "heat") {
      for (const row of state.offenses.points) {
        const [t, n, d, x, y] = row;
        const type = state.types[t];
        if (!type || !state.layers[type] || !inWindow(d)) continue;
        heat.push([y / 10000, x / 10000, 0.6]);
      }
      if (heat.length) {
        heatLayer = L.heatLayer(heat, { radius: 28, blur: 22, maxZoom: 16, minOpacity: 0.28 });
        heatLayer.addTo(map);
      }
    } else {
      for (const row of state.offenses.points) {
        const [t, n, d, x, y] = row;
        const type = state.types[t];
        if (!type || !state.layers[type] || !inWindow(d)) continue;
        const feat = features[n];
        const name = feat ? feat.properties.name : "Unknown neighborhood";
        const icon = iconFor(type);
        const marker = L.marker([y / 10000, x / 10000], {
          icon,
          title: LABELS[type],
          keyboard: false,
        }).bindPopup(popupHtml(
          LABELS[type],
          `${name}<br>${formatDay(d)}`,
          PIN_NOTE
        ));
        pinLayer.addLayer(marker);
      }
    }
  }

  function typeColor(type) {
    const svg = state.svg[type] || "";
    const m = svg.match(/fill="(#[0-9a-fA-F]{3,8})"/);
    return (m && m[1]) || "#374151";
  }

  async function ensureCalls() {
    if (state.calls || state.callsLoading) return;
    state.callsLoading = true;
    try {
      const res = await fetch("/data/calls.json");
      state.calls = await res.json();
    } catch (_) {
      state.calls = { cells: [] };
    } finally {
      state.callsLoading = false;
    }
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
    map.fitBounds(radiusCircle.getBounds(), { padding: [28, 28], maxZoom: 14 });
    const covered = viewIntersectsCoverage();
    if (covered) {
      setLocMessage((label ? `Centered near ${label}` : "Centered here") +
        " · default view is a 5-mile radius (zoom out to see more). Neighborhood-level official data only.");
    } else {
      setLocMessage((label ? `Centered near ${label}. ` : "") +
        "No public data feed for this area yet.");
    }
    render();
  }

  function showSpokane() {
    const cov = coverageBounds();
    const c = state.meta && state.meta.center;
    const lng = c ? c[0] : SPOKANE_FALLBACK.lng;
    const lat = c ? c[1] : SPOKANE_FALLBACK.lat;
    setCenter(lat, lng, "Spokane, Washington");
    if (cov) map.fitBounds(cov, { padding: [28, 28], maxZoom: 13 });
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

  function locateUser() {
    if (!navigator.geolocation) {
      setLocMessage("This browser can’t share a location. Search an address or ZIP instead.");
      return;
    }
    setLocMessage("Asking for your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => useCoords(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (err && err.code === 1) {
          setLocMessage("Location is off. Search an address or ZIP, or view Spokane.");
        } else {
          setLocMessage("Couldn’t get your location. Search an address or ZIP, or view Spokane.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
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

  function initMap() {
    map = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
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
    }).addTo(map);
    map.setView([39.8283, -98.5795], 4);
    map.on("moveend", () => {
      // keep empty-state accurate if the user pans into/out of Spokane
      if (!state.center) return;
      const covered = viewIntersectsCoverage() || (coverageBounds() && map.getBounds().intersects(coverageBounds()));
      // If they panned to Spokane without recentering, still show data
      if (covered && !state.inCoverage) {
        state.inCoverage = true;
        document.getElementById("emptyState").hidden = true;
        render();
      }
    });
  }

  function initEvents() {
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
      if (!hit) {
        setLocMessage("No match for that address or ZIP. Try a city and state, or a 5-digit ZIP.");
        return;
      }
      setCenter(Number(hit.lat), Number(hit.lon), formatAddress(hit) || hit.display_name);
    } catch (_) {
      if (/spokane/i.test(q)) showSpokane();
      else setLocMessage("Address lookup failed. Wait a moment and try again.");
    }
  }

  async function loadSvg(name) {
    const res = await fetch(`/icons/layers/${name}.svg`);
    if (!res.ok) return "";
    return res.text();
  }

  async function boot() {
    loadState();
    initMap();
    initEvents();

    const [meta, neighborhoods, offenses] = await Promise.all([
      fetch("/data/meta.json").then((r) => r.json()),
      fetch("/data/neighborhoods.json").then((r) => r.json()),
      fetch("/data/offenses.json").then((r) => r.json()),
    ]);
    state.meta = meta;
    state.neighborhoods = neighborhoods;
    state.offenses = offenses;
    state.types = meta.types || [];
    applyDefaultLayers();

    const iconNames = state.types.concat(["calls"]);
    const svgs = await Promise.all(iconNames.map(loadSvg));
    iconNames.forEach((name, i) => { state.svg[name] = svgs[i]; });

    document.getElementById("asOfBanner").textContent = meta.label;
    syncChromeHeight();
    document.getElementById("settingsAbout").textContent =
      `${meta.label} Locations are shown at neighborhood level only. Street addresses are not published on CrimeStat. ${meta.defaultWindowNote || ""}`;

    if (neighborhoods) nbhLayer.addData(neighborhoods);
    buildLayerList();
    syncControls();

    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || params.get("city") || "").trim();
    if (q) {
      document.getElementById("searchInput").value = q;
      await runSearch(q);
    } else {
      locateUser();
    }
  }

  boot().catch((err) => {
    console.error(err);
    document.getElementById("asOfBanner").textContent = "Could not load CrimeStat data.";
  });
})();

/* CrimeStat v0 — demo map. Incidents are simulated and must stay labeled as such. */
(() => {
  const MILES5 = 1609.344 * 5;
  const AREA_RADIUS = 804.672; // 0.5 mile
  const GEN_RADIUS = 1609.344 * 20;
  const STORAGE_KEY = "crimestat-ui-v1";

  const ICONS = {
    house: '<path d="M2 12 L12 3 L22 12 V21 H15 V14 H9 V21 H2 Z"/>',
    store: '<path d="M3 9 L5 4 H19 L21 9 V21 H14 V13 H10 V21 H3 Z M3 9 H21"/>',
    bag: '<path d="M6 8 H18 L19 21 H5 Z M9 8 V7 A3 3 0 0 1 15 7 V8"/>',
    door: '<path d="M6 21 V5 H18 V21 Z M14 13 A1 1 0 1 0 14 11 A1 1 0 0 0 14 13"/>',
    person: '<path d="M12 11 A4 4 0 1 0 12 3 A4 4 0 0 0 12 11 Z M5 21 C5 16 8 14 12 14 C16 14 19 16 19 21 Z"/>',
    alert: '<path d="M12 3 L22 20 H2 Z M12 9 V14 M12 17 A1 1 0 1 0 12 19 A1 1 0 0 0 12 17"/>',
    spray: '<path d="M9 8 H15 V21 H9 Z M11 4 H14 V8 H11 Z M15 6 H18"/>',
    flame: '<path d="M12 3 C16 8 18 11 18 15 A6 6 0 1 1 6 15 C6 11 9 8 12 3 Z"/>',
    car: '<path d="M4 16 L6 10 H18 L20 16 V20 H18 V18 H6 V20 H4 Z M7 16 A1.5 1.5 0 1 0 7 13 A1.5 1.5 0 0 0 7 16 M17 16 A1.5 1.5 0 1 0 17 13 A1.5 1.5 0 0 0 17 16"/>',
    card: '<path d="M3 7 H21 V18 H3 Z M3 11 H21"/>',
    pill: '<path d="M8 8 A4 4 0 0 1 16 8 L16 16 A4 4 0 0 1 8 16 Z M8 12 H16"/>',
    shield: '<path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z"/>',
    burst: '<path d="M12 2 L14 10 L22 8 L16 14 L22 20 L14 16 L12 22 L10 16 L2 20 L8 14 L2 8 L10 10 Z"/>',
    area: '<path d="M4 12 A8 8 0 1 0 20 12 A8 8 0 0 0 4 12 Z M8 12 A4 4 0 1 0 16 12 A4 4 0 0 0 8 12 Z"/>',
  };

  const TYPES = [
    { id: "burglary_residential", name: "Burglary — residential", color: "#c0392b", sensitive: false, icon: "house", weight: 12 },
    { id: "burglary_business", name: "Burglary — business", color: "#8e44ad", sensitive: false, icon: "store", weight: 8 },
    { id: "theft", name: "Theft", color: "#2980b9", sensitive: false, icon: "bag", weight: 16 },
    { id: "home_invasion", name: "Home invasion", color: "#7b241c", sensitive: false, icon: "door", weight: 3 },
    { id: "assault", name: "Assault", color: "#d35400", sensitive: false, icon: "person", weight: 8 },
    { id: "rape", name: "Rape / sexual assault", color: "#6c3483", sensitive: true, icon: "area", weight: 2 },
    { id: "battery", name: "Battery", color: "#e67e22", sensitive: false, icon: "person", weight: 7 },
    { id: "robbery", name: "Robbery", color: "#1a5276", sensitive: false, icon: "alert", weight: 6 },
    { id: "vandalism", name: "Vandalism", color: "#16a085", sensitive: false, icon: "spray", weight: 10 },
    { id: "arson", name: "Arson", color: "#e74c3c", sensitive: false, icon: "flame", weight: 2 },
    { id: "auto_theft", name: "Motor vehicle theft", color: "#2c3e50", sensitive: false, icon: "car", weight: 9 },
    { id: "kidnapping", name: "Kidnapping", color: "#5d6d7e", sensitive: false, icon: "alert", weight: 1 },
    { id: "fraud", name: "Fraud", color: "#b7950b", sensitive: false, icon: "card", weight: 7 },
    { id: "drugs", name: "Drug offenses", color: "#27ae60", sensitive: false, icon: "pill", weight: 8 },
    { id: "weapons", name: "Weapons violations", color: "#34495e", sensitive: false, icon: "shield", weight: 4 },
    { id: "domestic_violence", name: "Domestic violence", color: "#a93226", sensitive: true, icon: "area", weight: 3 },
    { id: "stalking", name: "Stalking", color: "#5b2c6f", sensitive: true, icon: "area", weight: 2 },
    { id: "shots_fired", name: "Shots fired", color: "#cb4335", sensitive: false, icon: "burst", weight: 5 },
    { id: "missing_persons", name: "Missing persons", color: "#2874a6", sensitive: true, icon: "area", weight: 2 },
  ];

  const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.id, t]));
  const WINDOWS = { "6m": 182 * 864e5, "1y": 365 * 864e5, "5y": 5 * 365 * 864e5 };

  const state = {
    time: "6m",
    view: "pins",
    layers: Object.fromEntries(TYPES.map((t) => [t.id, true])),
    center: null,
    points: [],
    areas: [],
  };

  let map, overlay, heatLayer, radiusCircle, userMarker;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!raw) return;
      if (WINDOWS[raw.time]) state.time = raw.time;
      if (raw.view === "heat" || raw.view === "pins") state.view = raw.view;
      if (raw.layers && typeof raw.layers === "object") {
        for (const t of TYPES) {
          if (typeof raw.layers[t.id] === "boolean") state.layers[t.id] = raw.layers[t.id];
        }
      }
    } catch (_) { /* ignore */ }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      time: state.time,
      view: state.view,
      layers: state.layers,
    }));
  }

  function mulberry32(a) {
    return function rand() {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashLoc(lat, lng) {
    const la = Math.round(lat * 200);
    const ln = Math.round(lng * 200);
    return ((la * 73856093) ^ (ln * 19349663)) >>> 0;
  }

  function offset(lat, lng, eastM, northM) {
    const dLat = northM / 111320;
    const dLng = eastM / (111320 * Math.cos((lat * Math.PI) / 180));
    return [lat + dLat, lng + dLng];
  }

  function pickWeighted(rand) {
    const total = TYPES.reduce((s, t) => s + t.weight, 0);
    let r = rand() * total;
    for (const t of TYPES) {
      r -= t.weight;
      if (r <= 0) return t;
    }
    return TYPES[0];
  }

  function formatMonth(ts) {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function generateDemo(lat, lng) {
    const rand = mulberry32(hashLoc(lat, lng) || 1);
    const now = Date.now();
    const points = [];
    const areaBuckets = new Map();

    const pointCount = 90 + Math.floor(rand() * 40);
    for (let i = 0; i < pointCount; i++) {
      const type = pickWeighted(rand);
      const ang = rand() * Math.PI * 2;
      const dist = Math.sqrt(rand()) * GEN_RADIUS;
      const [plat, plng] = offset(lat, lng, Math.cos(ang) * dist, Math.sin(ang) * dist);
      // Bias toward more recent dates
      const age = Math.pow(rand(), 1.6) * WINDOWS["5y"];
      const ts = now - age;

      if (type.sensitive) {
        const keyLat = Math.round(plat * 50) / 50;
        const keyLng = Math.round(plng * 50) / 50;
        const key = `${type.id}|${keyLat}|${keyLng}`;
        if (!areaBuckets.has(key)) {
          areaBuckets.set(key, { typeId: type.id, lat: keyLat, lng: keyLng, dates: [] });
        }
        areaBuckets.get(key).dates.push(ts);
      } else {
        points.push({ typeId: type.id, lat: plat, lng: plng, ts });
      }
    }

    return { points, areas: [...areaBuckets.values()] };
  }

  function inWindow(ts) {
    return Date.now() - ts <= WINDOWS[state.time];
  }

  function popupHtml(title, body) {
    return `<div class="popup-demo">Demo data — not a real report</div><strong>${title}</strong><div>${body}</div>`;
  }

  function render() {
    if (overlay) overlay.clearLayers();
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }

    const points = state.points.filter((p) => state.layers[p.typeId] && inWindow(p.ts));
    const areas = state.areas
      .map((a) => ({ ...a, count: a.dates.filter(inWindow).length }))
      .filter((a) => state.layers[a.typeId] && a.count > 0);

    if (state.view === "heat") {
      const heat = points.map((p) => [p.lat, p.lng, 0.65]);
      if (heat.length) {
        heatLayer = L.heatLayer(heat, { radius: 28, blur: 22, maxZoom: 16, minOpacity: 0.35 });
        heatLayer.addTo(map);
      }
    } else {
      for (const p of points) {
        const t = TYPE_MAP[p.typeId];
        const icon = L.divIcon({
          className: "cs-pin",
          html: `<span style="background:${t.color}"></span>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([p.lat, p.lng], { icon, title: t.name })
          .bindPopup(popupHtml(t.name, `Approximate area only<br>${formatMonth(p.ts)}`))
          .addTo(overlay);
      }
    }

    for (const a of areas) {
      const t = TYPE_MAP[a.typeId];
      L.circle([a.lat, a.lng], {
        radius: AREA_RADIUS,
        color: t.color,
        weight: 1.5,
        fillColor: t.color,
        fillOpacity: 0.22,
      })
        .bindPopup(
          popupHtml(
            t.name,
            `${a.count} report${a.count === 1 ? "" : "s"} in this area during the selected time window.<br>Shown as an area total only — never a specific address.`
          )
        )
        .addTo(overlay);
    }
  }

  function setCenter(lat, lng, label) {
    state.center = { lat, lng, label };
    state.points = [];
    state.areas = [];
    const demo = generateDemo(lat, lng);
    state.points = demo.points;
    state.areas = demo.areas;

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

    map.fitBounds(radiusCircle.getBounds(), { padding: [28, 28], maxZoom: 14 });
    document.getElementById("locBar").textContent = label
      ? `Centered near ${label} · default view is a 5-mile radius (zoom out to see more). Demo data only.`
      : "Centered on this location · default view is a 5-mile radius (zoom out to see more). Demo data only.";
    render();
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

  function setLocMessage(text) {
    document.getElementById("locBar").textContent = text;
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
          setLocMessage("Location is off. Search an address or ZIP to center the map.");
        } else {
          setLocMessage("Couldn’t get your location. Search an address or ZIP instead.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  function buildLayerList() {
    const list = document.getElementById("layerList");
    list.innerHTML = TYPES.map((t) => {
      const svg = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[t.icon] || ICONS.area}</svg>`;
      const meta = t.sensitive ? '<span class="meta">Area only</span>' : "";
      return `<li><label><span class="swatch" style="background:${t.color}">${svg}</span><input type="checkbox" data-layer="${t.id}" ${state.layers[t.id] ? "checked" : ""}> <span>${t.name}</span>${meta}</label></li>`;
    }).join("");
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

  function openDrawer() {
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
    overlay = L.layerGroup().addTo(map);
    map.setView([39.8283, -98.5795], 4);
  }

  function initEvents() {
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
      setLocMessage("Looking up that address…");
      try {
        const results = await searchAddress(q);
        const hit = Array.isArray(results) ? results[0] : null;
        if (!hit) {
          setLocMessage("No match for that address or ZIP. Try a city and state, or a 5-digit ZIP.");
          return;
        }
        setCenter(Number(hit.lat), Number(hit.lon), formatAddress(hit) || hit.display_name);
      } catch (_) {
        setLocMessage("Address lookup failed. Wait a moment and try again.");
      }
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
    document.getElementById("settingsLocate").addEventListener("click", () => {
      closeAll();
      locateUser();
    });
    document.getElementById("layerList").addEventListener("change", (e) => {
      const box = e.target.closest("[data-layer]");
      if (!box) return;
      state.layers[box.dataset.layer] = box.checked;
      saveState();
      render();
    });
    document.getElementById("layersAll").addEventListener("click", () => {
      for (const t of TYPES) state.layers[t.id] = true;
      saveState();
      syncControls();
      render();
    });
    document.getElementById("layersNone").addEventListener("click", () => {
      for (const t of TYPES) state.layers[t.id] = false;
      saveState();
      syncControls();
      render();
    });
    document.getElementById("resetFilters").addEventListener("click", () => {
      state.time = "6m";
      state.view = "pins";
      for (const t of TYPES) state.layers[t.id] = true;
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

  loadState();
  initMap();
  buildLayerList();
  syncControls();
  initEvents();
  locateUser();
})();

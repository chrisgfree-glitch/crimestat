const USER_AGENT = "CrimeStat/0.1 (https://crimestat.net; crime map geocoder)";
const NOMINATIM = "https://nominatim.openstreetmap.org";

function bad(res, status, message) {
  res.status(status).json({ error: message });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return bad(res, 405, "Method not allowed");
  }

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const lat = req.query.lat;
  const lon = req.query.lon;
  let url;

  if (q) {
    if (q.length < 2 || q.length > 200) {
      return bad(res, 400, "Enter a longer address or ZIP.");
    }
    const params = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      limit: "5",
      q,
    });
    url = `${NOMINATIM}/search?${params}`;
  } else if (lat != null && lon != null) {
    const latN = Number(lat);
    const lonN = Number(lon);
    if (!Number.isFinite(latN) || !Number.isFinite(lonN) || latN < -90 || latN > 90 || lonN < -180 || lonN > 180) {
      return bad(res, 400, "Invalid coordinates.");
    }
    const params = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      zoom: "18",
      lat: String(latN),
      lon: String(lonN),
    });
    url = `${NOMINATIM}/reverse?${params}`;
  } else {
    return bad(res, 400, "Provide q or lat and lon.");
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });
    if (!upstream.ok) {
      return bad(res, 502, "Address lookup is busy. Try again in a moment.");
    }
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("geocode", err);
    bad(res, 502, "Address lookup failed.");
  }
};

#!/usr/bin/env python3
"""Build a static 90-day Everett Police Incidents snapshot (100-block, no street addresses).

Uses City of Everett Open Data Police Incidents (f6vp-3svh), Public Domain,
already obfuscated to the 100-block. Police Cases (szww-y224) are omitted
because portal terms could not be fully read and that dataset has no licenseId.
"""
from __future__ import annotations

import collections
import json
import math
import pathlib
import urllib.parse
import urllib.request

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

SITE = pathlib.Path(__file__).resolve().parents[1]
OUT = SITE / "data/everett"
RAW = pathlib.Path("/tmp/everett-raw")
SODA = "https://data.everettwa.gov/resource/f6vp-3svh.json"
CITY_LIMITS = (
    "https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/"
    "CITY_3CO_AREA_117/FeatureServer/0/query"
)

START = "2026-08-27"
AS_OF = "2026-11-24"
END = "2026-11-24"
WHERE = (
    "datetimereceived >= '2026-08-27T00:00:00' "
    "AND datetimereceived < '2026-11-25T00:00:00'"
)

TYPES = [
    "burglary_residential",
    "burglary_business",
    "theft",
    "home_invasion",
    "assault",
    "rape",
    "battery",
    "robbery",
    "vandalism",
    "arson",
    "auto_theft",
    "kidnapping",
    "fraud",
    "drugs",
    "weapons",
    "domestic_violence",
    "stalking",
    "shots_fired",
    "missing_persons",
]
SENSITIVE = {"rape", "domestic_violence", "stalking"}
TYPE_I = {t: i for i, t in enumerate(TYPES)}

# CAD / calls-for-service types. Only map incident types that fit a crime layer.
# Child-protective and abuse calls are held off the map entirely.
MAPPED = {
    "THEFT": "theft",
    "SHOPLIFT": "theft",
    "ASSAULT": "assault",
    "MALICIOUS MISCHIEF/VANDALISM": "vandalism",
    "FRAUD": "fraud",
    "BURGLARY": "burglary_residential",
    "VEHICLE THEFT": "auto_theft",
    "WEAPON": "weapons",
    "SHOTS INDESCRIMINATE/HEARD": "shots_fired",
    "ROBBERY": "robbery",
    "ARSON": "arson",
}
HOLD = {
    "CHILD PROTECTIVE SERVICE": "held_juvenile_or_child",
    "ABUSE OF PERSON": "held_juvenile_or_child",
}


def fetch_json(url: str) -> object:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "CrimeStat/1.0 (static snapshot builder)"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def classify(incident_type: str):
    key = " ".join((incident_type or "").split()).upper()
    if key in HOLD:
        return None, HOLD[key]
    if key in MAPPED:
        return MAPPED[key], None
    if not key:
        return None, "blank_type"
    return None, "cad_or_no_matching_layer"


def day_offset(value: str):
    if not value or len(value) < 10:
        return None
    try:
        y, m, d = (int(p) for p in value[:10].split("-"))
        start = __import__("datetime").date.fromisoformat(START)
        return (__import__("datetime").date(y, m, d) - start).days
    except (TypeError, ValueError):
        return None


def to_lonlat(row):
    geom = row.get("geomcoordinate") or {}
    coords = geom.get("coordinates") if isinstance(geom, dict) else None
    if not (isinstance(coords, (list, tuple)) and len(coords) >= 2):
        return None
    try:
        lon, lat = float(coords[0]), float(coords[1])
    except (TypeError, ValueError):
        return None
    if not math.isfinite(lon) or not math.isfinite(lat):
        return None
    if not (47.85 <= lat <= 48.10 and -122.35 <= lon <= -122.10):
        return None
    return lon, lat


def simplify_geom(geom, tol=0.00025):
    g = geom.buffer(0)
    s = g.simplify(tol, preserve_topology=True)
    return g if s.is_empty else s


def load_rows():
    RAW.mkdir(parents=True, exist_ok=True)
    cached = RAW / "incidents-90d.json"
    if cached.exists():
        rows = json.loads(cached.read_text())
        print("loaded cache", len(rows))
        return rows
    rows = []
    offset = 0
    limit = 5000
    fields = "eventnumber,datetimereceived,incidenttype,neighborhood,geomcoordinate"
    while True:
        q = urllib.parse.urlencode({
            "$where": WHERE,
            "$select": fields,
            "$order": "datetimereceived",
            "$limit": str(limit),
            "$offset": str(offset),
        })
        page = fetch_json(f"{SODA}?{q}")
        if not isinstance(page, list):
            raise SystemExit(f"unexpected soda response: {page}")
        rows.extend(page)
        print("fetched", len(page), "total", len(rows))
        if len(page) < limit:
            break
        offset += limit
    cached.write_text(json.dumps(rows, separators=(",", ":")))
    return rows


def load_city_limits():
    cached = RAW / "city-limits.geojson"
    if cached.exists() and cached.stat().st_size > 1000:
        return json.loads(cached.read_text())
    params = {
        "where": "UPPER(NAME)='EVERETT'",
        "outFields": "NAME",
        "outSR": "4326",
        "f": "geojson",
    }
    fc = fetch_json(CITY_LIMITS + "?" + urllib.parse.urlencode(params))
    if not (fc.get("features") or []):
        raise SystemExit("Everett city limits not found")
    cached.write_text(json.dumps(fc, separators=(",", ":")))
    return fc


def main():
    rows = load_rows()
    fc = load_city_limits()
    feat = fc["features"][0]
    geom = simplify_geom(unary_union([shape(feat["geometry"])]))
    c = geom.representative_point()
    minx, miny, maxx, maxy = geom.bounds
    bbox = [round(minx, 5), round(miny, 5), round(maxx, 5), round(maxy, 5)]
    neighborhoods = [{
        "id": 0,
        "name": "Everett",
        "c": [round(c.x, 5), round(c.y, 5)],
        "g": mapping(geom),
    }]

    layer_counts = collections.Counter()
    drop_counts = collections.Counter()
    type_mapped = collections.Counter()
    points = []
    area_rows = collections.Counter()
    no_point = 0

    for r in rows:
        typ, reason = classify(r.get("incidenttype") or "")
        raw_type = (r.get("incidenttype") or "").strip()
        if typ is None:
            drop_counts[reason] += 1
            continue
        d = day_offset(r.get("datetimereceived") or "")
        if d is None or d < 0 or d > 89:
            drop_counts["missing_or_out_of_window_date"] += 1
            continue
        layer_counts[typ] += 1
        type_mapped[f"{raw_type}|{typ}"] += 1
        if typ in SENSITIVE:
            area_rows[(TYPE_I[typ], 0, d)] += 1
            continue
        pt = to_lonlat(r)
        if pt is None:
            no_point += 1
            drop_counts["no_official_point"] += 1
            layer_counts[typ] -= 1
            continue
        lon, lat = pt
        points.append([
            TYPE_I[typ],
            0,
            d,
            int(round(lon * 10000)),
            int(round(lat * 10000)),
        ])

    areas = [[t, n, d, c] for (t, n, d), c in sorted(area_rows.items())]
    credit = "Data: City of Everett / SNO911"
    meta = {
        "id": "everett",
        "label": (
            f"Everett police incidents (calls for service) from City of Everett Open Data, "
            f"as of {AS_OF}. 90-day snapshot {START} to {END}. Not a real-time feed. {credit}."
        ),
        "source": credit,
        "credit": credit,
        "asOf": AS_OF,
        "start": START,
        "end": END,
        "timeBase": "asOf",
        "defaultWindow": "snapshot",
        "defaultWindowNote": (
            f"Everett’s default is this 90-day snapshot ({START} to {END}). "
            "Time presets are measured from the as-of date, not from today. "
            "This is the official Police Incidents (calls for service) feed, not Police Cases. "
            "Only incident types that match a crime layer are shown. "
            "Traffic stops, welfare checks, alarms, and similar CAD activity are omitted. "
            "Child-protective and abuse-of-person calls are held off the map. "
            f"{credit}."
        ),
        "locationPrecision": (
            "Official coordinates are already blurred to the 100-block. "
            "CrimeStat does not display or store street addresses. "
            "The outline is the official incorporated city limit."
        ),
        "locationMode": "100block",
        "types": TYPES,
        "sensitive": sorted(SENSITIVE),
        "burglaryUnsplit": True,
        "bbox": bbox,
        "center": [round((minx + maxx) / 2, 5), round((miny + maxy) / 2, 5)],
        "offenseRows": len(rows),
        "callRows": 0,
        "cadence": "daily in the official Everett feed; this snapshot is not live",
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "meta.json").write_text(json.dumps(meta, separators=(",", ":")))
    (OUT / "neighborhoods.json").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"id": 0, "name": "Everett", "c": neighborhoods[0]["c"]},
            "geometry": neighborhoods[0]["g"],
        }],
        "bbox": bbox,
    }, separators=(",", ":")))
    (OUT / "offenses.json").write_text(json.dumps({
        "points": points,
        "areas": areas,
    }, separators=(",", ":")))

    report = {
        "window": {"start": START, "end": END, "asOf": AS_OF, "days": 90},
        "incidentsInWindow": len(rows),
        "layerCounts": {t: int(layer_counts[t]) for t in TYPES},
        "layerCountsSum": int(sum(layer_counts.values())),
        "dropped": dict(drop_counts),
        "droppedSum": int(sum(drop_counts.values())),
        "pointsOnMap": len(points),
        "areaCells": len(areas),
        "areaIncidentSum": int(sum(c for *_, c in areas)),
        "missingOfficialPoint": no_point,
        "typeMapped": dict(type_mapped),
        "skippedDataset": {
            "id": "szww-y224",
            "reason": "Police Cases metadata has no licenseId; City of Everett Open Data Terms of Use page did not yield complete reusable-license text in this pass, so public reuse is not clearly allowed.",
        },
        "bytes": {
            "meta": (OUT / "meta.json").stat().st_size,
            "neighborhoods": (OUT / "neighborhoods.json").stat().st_size,
            "offenses": (OUT / "offenses.json").stat().st_size,
        },
    }
    (OUT / "mapping-report.json").write_text(json.dumps(report, indent=2))
    printable = {k: report[k] for k in report if k != "typeMapped"}
    print(json.dumps(printable, indent=2))


if __name__ == "__main__":
    main()

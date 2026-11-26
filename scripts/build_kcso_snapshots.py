#!/usr/bin/env python3
"""Build 90-day Shoreline and Kenmore snapshots from KCSO open offense reports.

Incident rows come from data.kingcounty.gov 4kmt-kfqf (100-block text, no stored
addresses in the output). Official approximate point geometry is joined from
King County's public PublicCrimeMappingData FeatureServer layer 1 (the same
program used on KCSO city dashboards). Credit: data provided by permission of
King County.

Builds remaining contract-city snapshots plus a residual King County Sheriff
layer for unincorporated places and sheriff cases in other cities. Does not
rebuild Shoreline or Kenmore (already published).
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
RAW = pathlib.Path("/tmp/kcso-raw")
SODA = "https://data.kingcounty.gov/resource/4kmt-kfqf.json"
MAP_SVC = "https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/PublicCrimeMappingData/FeatureServer"
CITY_LIMITS = (
    "https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/"
    "CITY_3CO_AREA_117/FeatureServer/0/query"
)

START = "2026-08-27"
AS_OF = "2026-11-24"
END = "2026-11-24"
WHERE = (
    "incident_datetime >= '2026-08-27T00:00:00' "
    "and incident_datetime < '2026-11-25T00:00:00'"
)
CREDIT = "data provided by permission of King County"
MAP_LAYER = 1
ALREADY_PUBLISHED = {"shoreline", "kenmore"}

# Remaining KCSO contract cities (Shoreline and Kenmore already live).
CITIES = {
    "burien": {"name": "Burien", "key": "BURIEN"},
    "seatac": {"name": "SeaTac", "key": "SEATAC"},
    "covington": {"name": "Covington", "key": "COVINGTON"},
    "maplevalley": {"name": "Maple Valley", "key": "MAPLE VALLEY"},
    "woodinville": {"name": "Woodinville", "key": "WOODINVILLE"},
    "sammamish": {"name": "Sammamish", "key": "SAMMAMISH"},
    "northbend": {"name": "North Bend", "key": "NORTH BEND"},
    "newcastle": {"name": "Newcastle", "key": "NEWCASTLE"},
    "carnation": {"name": "Carnation", "key": "CARNATION"},
    "skykomish": {"name": "Skykomish", "key": "SKYKOMISH"},
}
# Official contract-city keys already published or built in this run.
CONTRACT_KEYS = {cfg["key"] for cfg in CITIES.values()} | {"SHORELINE", "KENMORE"}

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
SEX = {"11A", "11B", "11C", "11D", "36A", "36B"}
THEFT = {"23A", "23B", "23C", "23D", "23E", "23F", "23G", "23H"}
FRAUD = {"26A", "26B", "26C", "26D", "26E", "26F", "26G", "250", "270", "210"}
DRUGS = {"35A", "35B"}
DROP_CODES = {
    "NR": "not_reportable",
    "999": "not_reportable",
    "90A": "arrest_only_or_society",
    "90B": "arrest_only_or_society",
    "90C": "arrest_only_or_society",
    "90D": "arrest_only_or_society",
    "90E": "arrest_only_or_society",
    "90F": "arrest_only_or_society",
    "90G": "arrest_only_or_society",
    "90H": "arrest_only_or_society",
    "90I": "arrest_only_or_society",
    "90J": "arrest_only_or_society",
    "90Z": "arrest_only_or_society",
    "370": "no_matching_layer",
    "720": "no_matching_layer",
    "280": "no_matching_layer",
    "09A": "no_matching_layer",
    "09B": "no_matching_layer",
    "09C": "no_matching_layer",
    "500": "no_matching_layer",
    "40A": "no_matching_layer",
    "40B": "no_matching_layer",
    "40C": "no_matching_layer",
    "64A": "no_matching_layer",
    "13C": "no_matching_layer",
}


def fetch_json(url: str) -> object:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "CrimeStat/1.0 (static snapshot builder)"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def nibrs_code(value: str) -> str:
    raw = (value or "").strip().upper()
    if not raw:
        return ""
    return raw.split("-", 1)[0].strip()


def classify(code: str):
    c = nibrs_code(code)
    if not c:
        return None, "blank_code"
    if c in SEX:
        return "rape", None
    if c in THEFT:
        return "theft", None
    if c in FRAUD:
        return "fraud", None
    if c in DRUGS:
        return "drugs", None
    if c in DROP_CODES:
        return None, DROP_CODES[c]
    mapping_codes = {
        "13A": "assault",
        "13B": "assault",
        "120": "robbery",
        "220": "burglary_residential",
        "240": "auto_theft",
        "290": "vandalism",
        "200": "arson",
        "100": "kidnapping",
        "520": "weapons",
    }
    if c in mapping_codes:
        return mapping_codes[c], None
    return None, "unmapped"


def day_offset(value: str):
    if not value or len(value) < 10:
        return None
    try:
        y, m, d = (int(p) for p in value[:10].split("-"))
        start = __import__("datetime").date.fromisoformat(START)
        return (__import__("datetime").date(y, m, d) - start).days
    except (TypeError, ValueError):
        return None


def simplify_geom(geom, tol=0.00025):
    g = geom.buffer(0)
    s = g.simplify(tol, preserve_topology=True)
    return g if s.is_empty else s


def load_offense_rows():
    RAW.mkdir(parents=True, exist_ok=True)
    cached = RAW / "offenses-90d-all.json"
    if cached.exists():
        rows = json.loads(cached.read_text())
        print("loaded offense cache", len(rows))
        return rows
    rows = []
    offset = 0
    limit = 2000
    fields = "case_number,incident_datetime,nibrs_code,nibrs_code_name,city"
    while True:
        q = urllib.parse.urlencode({
            "$where": WHERE,
            "$select": fields,
            "$order": "incident_datetime",
            "$limit": str(limit),
            "$offset": str(offset),
        })
        page = fetch_json(f"{SODA}?{q}")
        if not isinstance(page, list):
            raise SystemExit(f"unexpected soda response: {page}")
        rows.extend(page)
        print("fetched offenses", len(page), "total", len(rows))
        if len(page) < limit:
            break
        offset += limit
    cached.write_text(json.dumps(rows, separators=(",", ":")))
    return rows


def load_all_points():
    RAW.mkdir(parents=True, exist_ok=True)
    cached = RAW / "points-all-90d.json"
    if cached.exists() and cached.stat().st_size > 1000:
        pts = json.loads(cached.read_text())
        print("loaded points cache all", len(pts))
        return pts
    pts = {}
    offset = 0
    page_size = 1000
    where = (
        "incident_datetime >= timestamp '2026-08-27 00:00:00' "
        "AND incident_datetime < timestamp '2026-11-25 00:00:00'"
    )
    while True:
        q = urllib.parse.urlencode({
            "where": where,
            "outFields": "case_number,latitude,longitude,city",
            "returnGeometry": "true",
            "outSR": "4326",
            "resultOffset": str(offset),
            "resultRecordCount": str(page_size),
            "f": "json",
        })
        data = fetch_json(f"{MAP_SVC}/{MAP_LAYER}/query?{q}")
        if data.get("error"):
            raise SystemExit(f"map query failed: {data['error']}")
        feats = data.get("features") or []
        for feat in feats:
            attr = feat.get("attributes") or {}
            case = (attr.get("case_number") or "").strip()
            lon = lat = None
            geom = feat.get("geometry") or {}
            try:
                if attr.get("longitude") is not None and attr.get("latitude") is not None:
                    lon, lat = float(attr["longitude"]), float(attr["latitude"])
                elif geom.get("x") is not None:
                    lon, lat = float(geom["x"]), float(geom["y"])
            except (TypeError, ValueError):
                lon = lat = None
            if case and lon is not None and lat is not None and math.isfinite(lon) and math.isfinite(lat):
                pts[case] = [lon, lat]
        print("fetched points all", len(feats), "unique", len(pts), "offset", offset)
        if len(feats) < page_size:
            break
        offset += page_size
        if data.get("exceededTransferLimit") is False and len(feats) == 0:
            break
    cached.write_text(json.dumps(pts, separators=(",", ":")))
    return pts


def load_city_limits(name: str):
    cached = RAW / f"limits-{name.lower()}.geojson"
    if cached.exists() and cached.stat().st_size > 500:
        return json.loads(cached.read_text())
    params = {
        "where": f"UPPER(NAME)='{name.upper()}'",
        "outFields": "NAME",
        "outSR": "4326",
        "f": "geojson",
    }
    fc = fetch_json(CITY_LIMITS + "?" + urllib.parse.urlencode(params))
    if not (fc.get("features") or []):
        raise SystemExit(f"city limits not found for {name}")
    cached.write_text(json.dumps(fc, separators=(",", ":")))
    return fc


def build_city(city_id: str, rows, points):
    cfg = CITIES[city_id]
    out = SITE / "data" / city_id
    city_rows = [r for r in rows if (r.get("city") or "").strip().upper() == cfg["key"]]
    fc = load_city_limits(cfg["name"])
    geom = simplify_geom(unary_union([shape(f["geometry"]) for f in fc["features"]]))
    c = geom.representative_point()
    minx, miny, maxx, maxy = geom.bounds
    bbox = [round(minx, 5), round(miny, 5), round(maxx, 5), round(maxy, 5)]
    center = [round((minx + maxx) / 2, 5), round((miny + maxy) / 2, 5)]

    layer_counts = collections.Counter()
    drop_counts = collections.Counter()
    code_mapped = collections.Counter()
    points_out = []
    area_rows = collections.Counter()
    missing_geom = 0

    minx, miny, maxx, maxy = geom.bounds
    pad = 0.03
    min_lat, max_lat = miny - pad, maxy + pad
    min_lon, max_lon = minx - pad, maxx + pad
    if cfg.get("bbox_pad"):
        min_lat, max_lat, min_lon, max_lon = cfg["bbox_pad"]
    for r in city_rows:
        typ, reason = classify(r.get("nibrs_code") or "")
        code = nibrs_code(r.get("nibrs_code") or "")
        if typ is None:
            drop_counts[reason] += 1
            continue
        d = day_offset(r.get("incident_datetime") or "")
        if d is None or d < 0 or d > 89:
            drop_counts["missing_or_out_of_window_date"] += 1
            continue
        layer_counts[typ] += 1
        code_mapped[f"{code}|{typ}"] += 1
        if typ in SENSITIVE:
            area_rows[(TYPE_I[typ], 0, d)] += 1
            continue
        case = (r.get("case_number") or "").strip()
        pt = points.get(case)
        if not pt:
            missing_geom += 1
            drop_counts["no_official_point"] += 1
            layer_counts[typ] -= 1
            continue
        lon, lat = pt
        if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
            missing_geom += 1
            drop_counts["point_outside_city_margin"] += 1
            layer_counts[typ] -= 1
            continue
        points_out.append([
            TYPE_I[typ],
            0,
            d,
            int(round(lon * 10000)),
            int(round(lat * 10000)),
        ])

    areas = [[t, n, d, c] for (t, n, d), c in sorted(area_rows.items())]
    label_city = cfg["name"]
    meta = {
        "id": city_id,
        "label": (
            f"King County Sheriff’s Office offense reports for {label_city}, "
            f"as of {AS_OF}. 90-day snapshot {START} to {END}. Not a real-time feed. {CREDIT}."
        ),
        "source": CREDIT,
        "credit": CREDIT,
        "asOf": AS_OF,
        "start": START,
        "end": END,
        "timeBase": "asOf",
        "defaultWindow": "snapshot",
        "defaultWindowNote": (
            f"{label_city}’s default is this 90-day snapshot ({START} to {END}). "
            "Time presets are measured from the as-of date, not from today. "
            "These are King County Sheriff’s Office reports for this contract city, not an independent city PD feed. "
            f"{CREDIT}."
        ),
        "locationPrecision": (
            "Official map points and block locations are approximate, already blurred to the 100-block. "
            "CrimeStat does not display or store street addresses. "
            "The outline is the official incorporated city limit."
        ),
        "locationMode": "100block",
        "types": TYPES,
        "sensitive": sorted(SENSITIVE),
        "burglaryUnsplit": True,
        "bbox": bbox,
        "center": center,
        "offenseRows": len(city_rows),
        "callRows": 0,
        "cadence": "daily in the official King County feed; this snapshot is not live",
    }

    out.mkdir(parents=True, exist_ok=True)
    (out / "meta.json").write_text(json.dumps(meta, separators=(",", ":")))
    (out / "neighborhoods.json").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"id": 0, "name": label_city, "c": [round(c.x, 5), round(c.y, 5)]},
            "geometry": mapping(geom),
        }],
        "bbox": bbox,
    }, separators=(",", ":")))
    (out / "offenses.json").write_text(json.dumps({
        "points": points_out,
        "areas": areas,
    }, separators=(",", ":")))

    report = {
        "city": label_city,
        "window": {"start": START, "end": END, "asOf": AS_OF, "days": 90},
        "offenseRows": len(city_rows),
        "layerCounts": {t: int(layer_counts[t]) for t in TYPES},
        "layerCountsSum": int(sum(layer_counts.values())),
        "dropped": dict(drop_counts),
        "droppedSum": int(sum(drop_counts.values())),
        "pointsOnMap": len(points_out),
        "areaCells": len(areas),
        "areaIncidentSum": int(sum(c for *_, c in areas)),
        "missingOfficialPoint": missing_geom,
        "codeMapped": dict(code_mapped),
        "bytes": {
            "meta": (out / "meta.json").stat().st_size,
            "neighborhoods": (out / "neighborhoods.json").stat().st_size,
            "offenses": (out / "offenses.json").stat().st_size,
        },
    }
    (out / "mapping-report.json").write_text(json.dumps(report, indent=2))
    printable = {k: report[k] for k in report if k != "codeMapped"}
    print(json.dumps(printable, indent=2))
    return report


def build_residual(rows, points):
    """Sheriff cases not already published as a contract-city snapshot."""
    from shapely.geometry import MultiPoint, Point

    city_id = "kcsoother"
    out = SITE / "data" / city_id
    residual = [r for r in rows if (r.get("city") or "").strip().upper() not in CONTRACT_KEYS]
    pts_used = []
    layer_counts = collections.Counter()
    drop_counts = collections.Counter()
    code_mapped = collections.Counter()
    points_out = []
    area_rows = collections.Counter()
    missing_geom = 0
    # King County broad margin
    min_lat, max_lat, min_lon, max_lon = 47.05, 47.92, -122.65, -121.05

    for r in residual:
        typ, reason = classify(r.get("nibrs_code") or "")
        code = nibrs_code(r.get("nibrs_code") or "")
        if typ is None:
            drop_counts[reason] += 1
            continue
        d = day_offset(r.get("incident_datetime") or "")
        if d is None or d < 0 or d > 89:
            drop_counts["missing_or_out_of_window_date"] += 1
            continue
        layer_counts[typ] += 1
        code_mapped[f"{code}|{typ}"] += 1
        if typ in SENSITIVE:
            area_rows[(TYPE_I[typ], 0, d)] += 1
            continue
        case = (r.get("case_number") or "").strip()
        pt = points.get(case)
        if not pt:
            missing_geom += 1
            drop_counts["no_official_point"] += 1
            layer_counts[typ] -= 1
            continue
        lon, lat = pt
        if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
            missing_geom += 1
            drop_counts["point_outside_county_margin"] += 1
            layer_counts[typ] -= 1
            continue
        points_out.append([
            TYPE_I[typ],
            0,
            d,
            int(round(lon * 10000)),
            int(round(lat * 10000)),
        ])
        pts_used.append((lon, lat))

    if pts_used:
        geom = MultiPoint([Point(x, y) for x, y in pts_used]).convex_hull.buffer(0.01)
    else:
        geom = Point(-122.0, 47.5).buffer(0.2)
    geom = simplify_geom(geom, tol=0.0005)
    c = geom.representative_point()
    minx, miny, maxx, maxy = geom.bounds
    bbox = [round(minx, 5), round(miny, 5), round(maxx, 5), round(maxy, 5)]
    center = [round((minx + maxx) / 2, 5), round((miny + maxy) / 2, 5)]
    areas = [[t, n, d, c] for (t, n, d), c in sorted(area_rows.items())]
    label = "King County Sheriff (other areas)"
    meta = {
        "id": city_id,
        "label": (
            f"King County Sheriff’s Office offense reports for unincorporated King County "
            f"and sheriff cases in other cities, as of {AS_OF}. 90-day snapshot {START} to {END}. "
            f"Not a real-time feed. These are not independent city-police-department cases. {CREDIT}."
        ),
        "source": CREDIT,
        "credit": CREDIT,
        "asOf": AS_OF,
        "start": START,
        "end": END,
        "timeBase": "asOf",
        "defaultWindow": "snapshot",
        "defaultWindowNote": (
            f"This 90-day snapshot ({START} to {END}) is King County Sheriff’s Office reports "
            "outside the separately listed contract-city snapshots (Shoreline, Kenmore, Burien, SeaTac, "
            "and other contract cities). Cases with a Seattle, Kent, Auburn, or similar city name are "
            "still sheriff cases, not that city’s police department. "
            f"{CREDIT}."
        ),
        "locationPrecision": (
            "Official map points and block locations are approximate, already blurred to the 100-block. "
            "CrimeStat does not display or store street addresses."
        ),
        "locationMode": "100block",
        "types": TYPES,
        "sensitive": sorted(SENSITIVE),
        "burglaryUnsplit": True,
        "bbox": bbox,
        "center": center,
        "offenseRows": len(residual),
        "callRows": 0,
        "cadence": "daily in the official King County feed; this snapshot is not live",
    }
    out.mkdir(parents=True, exist_ok=True)
    (out / "meta.json").write_text(json.dumps(meta, separators=(",", ":")))
    (out / "neighborhoods.json").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"id": 0, "name": label, "c": [round(c.x, 5), round(c.y, 5)]},
            "geometry": mapping(geom),
        }],
        "bbox": bbox,
    }, separators=(",", ":")))
    (out / "offenses.json").write_text(json.dumps({
        "points": points_out,
        "areas": areas,
    }, separators=(",", ":")))
    report = {
        "city": label,
        "window": {"start": START, "end": END, "asOf": AS_OF, "days": 90},
        "offenseRows": len(residual),
        "layerCounts": {t: int(layer_counts[t]) for t in TYPES},
        "layerCountsSum": int(sum(layer_counts.values())),
        "dropped": dict(drop_counts),
        "droppedSum": int(sum(drop_counts.values())),
        "pointsOnMap": len(points_out),
        "areaCells": len(areas),
        "areaIncidentSum": int(sum(c for *_, c in areas)),
        "missingOfficialPoint": missing_geom,
        "bytes": {
            "meta": (out / "meta.json").stat().st_size,
            "neighborhoods": (out / "neighborhoods.json").stat().st_size,
            "offenses": (out / "offenses.json").stat().st_size,
        },
    }
    (out / "mapping-report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return report


def main():
    rows = load_offense_rows()
    pts = load_all_points()
    reports = {}
    for city_id in CITIES:
        reports[city_id] = build_city(city_id, rows, pts)
    reports["kcsoother"] = build_residual(rows, pts)
    summary = {k: {"offenseRows": v["offenseRows"], "pointsOnMap": v["pointsOnMap"]} for k, v in reports.items()}
    print("SUMMARY", json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

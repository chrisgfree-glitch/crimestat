#!/usr/bin/env python3
"""Build a static 90-day Seattle PD snapshot for CrimeStat (no street addresses)."""
from __future__ import annotations

import collections
import json
import math
import pathlib
import urllib.parse
import urllib.request

from shapely.geometry import Point, mapping, shape
from shapely.ops import unary_union

SITE = pathlib.Path("/workspace/crimestat")
OUT = SITE / "data/seattle"
RAW = pathlib.Path("/tmp/seattle-raw")
SODA = "https://data.seattle.gov/resource/tazs-3rd5.json"
MCPP = (
    "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/"
    "MCPPs_WebMerc/FeatureServer/0/query"
    "?where=1%3D1&outFields=neighborhood,precinct&outSR=4326&f=geojson"
)

# Inclusive 90-day window ending on the latest official offense_date (2026-11-24).
START = "2026-08-27"
AS_OF = "2026-11-24"
END = "2026-11-24"
WHERE = "offense_date >= '2026-08-27T00:00:00' AND offense_date < '2026-11-25T00:00:00'"

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
    "-": "not_reportable",
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
    "500": "no_matching_layer",
    "40A": "no_matching_layer",
    "40B": "no_matching_layer",
    "40C": "no_matching_layer",
    "64A": "no_matching_layer",
}
SHOT_GROUPS = {
    "shots fired (eyewitness/casings/property damage)",
    "shooting (non-fatal injury)",
    "shooting (fatal injury)",
}
ACRONYMS = {"SLU", "SODO"}


def fetch_json(url: str) -> object:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "CrimeStat/1.0 (static snapshot builder)"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def norm_name(s: str) -> str:
    return " ".join((s or "").upper().replace("-", " ").split())


def display_name(raw: str) -> str:
    parts = []
    for part in (raw or "").split("/"):
        words = []
        for w in part.split():
            up = w.upper()
            words.append(up if up in ACRONYMS else w.title())
        parts.append(" ".join(words))
    return "/".join(parts)


def day_offset(offense_date: str):
    if not offense_date:
        return None
    day = offense_date[:10]
    try:
        y, m, d = map(int, day.split("-"))
        sy, sm, sd = map(int, START.split("-"))
    except ValueError:
        return None
    import datetime
    return (datetime.date(y, m, d) - datetime.date(sy, sm, sd)).days


def classify(r):
    code = (r.get("nibrs_offense_code") or "").strip()
    shot = (r.get("shooting_type_group") or "").strip().lower()
    # Official SPD shooting typologies go on the shots-fired layer.
    if shot in SHOT_GROUPS:
        return "shots_fired", None
    if code in SEX:
        return "rape", None
    desc = f"{r.get('nibrs_offense_code_description') or ''} {r.get('offense_sub_category') or ''}"
    # Only flag stalking when the official text says so (none found in this window).
    if "stalk" in desc.lower():
        return "stalking", None
    if code == "220":
        # Seattle's feed does not split residential vs business burglary.
        return "burglary_residential", "burglary_unsplit"
    if code == "13A":
        return "assault", None
    if code == "13B":
        return "battery", None
    if code == "120":
        return "robbery", None
    if code in THEFT:
        return "theft", None
    if code == "240":
        return "auto_theft", None
    if code == "200":
        return "arson", None
    if code == "290":
        return "vandalism", None
    if code == "100":
        return "kidnapping", None
    if code in FRAUD:
        return "fraud", None
    if code in DRUGS:
        return "drugs", None
    if code == "520":
        return "weapons", None
    if code == "13C":
        return None, "intimidation_not_stalking"
    if code in DROP_CODES:
        return None, DROP_CODES[code]
    return None, "unmapped"


def simplify_geom(geom, tol=0.00025):
    g = geom.buffer(0)
    s = g.simplify(tol, preserve_topology=True)
    return g if s.is_empty else s


def load_rows():
    RAW.mkdir(parents=True, exist_ok=True)
    cached = RAW / "offenses-90d.json"
    if cached.exists():
        rows = json.loads(cached.read_text())
        print("loaded cache", len(rows))
        return rows
    fields = ",".join([
        "offense_date",
        "nibrs_offense_code",
        "nibrs_offense_code_description",
        "offense_sub_category",
        "shooting_type_group",
        "neighborhood",
        "latitude",
        "longitude",
    ])
    rows = []
    offset = 0
    limit = 50000
    while True:
        q = urllib.parse.urlencode({
            "$select": fields,
            "$where": WHERE,
            "$order": "offense_date",
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


def load_mcpp():
    cached = RAW / "mcpp.geojson"
    if cached.exists() and cached.stat().st_size > 1000:
        return json.loads(cached.read_text())
    fc = fetch_json(MCPP)
    cached.write_text(json.dumps(fc, separators=(",", ":")))
    return fc


def to_lonlat(r):
    try:
        lon = float(r.get("longitude"))
        lat = float(r.get("latitude"))
    except (TypeError, ValueError):
        return None
    if not math.isfinite(lon) or not math.isfinite(lat):
        return None
    if not (46.5 <= lat <= 48.5 and -123.5 <= lon <= -121.5):
        return None
    return lon, lat


def main():
    rows = load_rows()
    fc = load_mcpp()
    neighborhoods = []
    name_to_idx = {}
    geoms = []
    for feat in fc.get("features") or []:
        raw = (feat.get("properties") or {}).get("neighborhood") or ""
        key = norm_name(raw)
        if not key or key in name_to_idx:
            continue
        geom = simplify_geom(shape(feat["geometry"]))
        geoms.append(geom)
        c = geom.representative_point()
        idx = len(neighborhoods)
        neighborhoods.append({
            "id": idx,
            "name": display_name(raw),
            "c": [round(c.x, 5), round(c.y, 5)],
            "g": mapping(geom),
        })
        name_to_idx[key] = idx

    union = unary_union(geoms)
    minx, miny, maxx, maxy = union.bounds
    bbox = [round(minx, 5), round(miny, 5), round(maxx, 5), round(maxy, 5)]

    layer_counts = collections.Counter()
    drop_counts = collections.Counter()
    no_nbh = collections.Counter()
    code_mapped = collections.Counter()
    code_dropped = collections.Counter()
    points = []
    area_rows = collections.Counter()
    placed_via_pip = 0
    unknown_nbh = 0

    for r in rows:
        typ, reason = classify(r)
        code = (r.get("nibrs_offense_code") or "").strip()
        if typ is None:
            drop_counts[reason] += 1
            code_dropped[f"{code}|{reason}"] += 1
            continue
        layer_counts[typ] += 1
        code_mapped[f"{code}|{typ}"] += 1
        d = day_offset(r.get("offense_date") or "")
        if d is None or d < 0:
            drop_counts["missing_or_out_of_window_date"] += 1
            layer_counts[typ] -= 1
            continue
        key = norm_name(r.get("neighborhood") or "")
        n = name_to_idx.get(key)
        if n is None:
            pt = to_lonlat(r)
            if pt:
                p = Point(pt[0], pt[1])
                for i, g in enumerate(geoms):
                    if g.contains(p) or g.touches(p):
                        n = i
                        placed_via_pip += 1
                        break
            if n is None:
                unknown_nbh += 1
                no_nbh[typ] += 1
                continue
        if typ in SENSITIVE:
            area_rows[(TYPE_I[typ], n, d)] += 1
        else:
            pt = to_lonlat(r)
            if pt is None:
                c = neighborhoods[n]["c"]
                lon, lat = c[0], c[1]
            else:
                lon, lat = pt
            points.append([
                TYPE_I[typ],
                n,
                d,
                int(round(lon * 10000)),
                int(round(lat * 10000)),
            ])

    areas = [[t, n, d, c] for (t, n, d), c in sorted(area_rows.items())]

    meta = {
        "id": "seattle",
        "label": f"Seattle Police Department public data, as of {AS_OF}. 90-day snapshot {START} to {END}. Not a real-time feed.",
        "source": "City of Seattle Open Data, SPD Crime Data: 2008-Present (dataset tazs-3rd5), Public Domain. Neighborhood boundaries are official SPD Micro-Community Policing Plan (MCPP) areas.",
        "asOf": AS_OF,
        "start": START,
        "end": END,
        "timeBase": "asOf",
        "defaultWindow": "snapshot",
        "defaultWindowNote": f"Seattle’s default is this 90-day snapshot ({START} to {END}). Time presets are measured from the as-of date, {AS_OF}, not from today. The official Seattle dataset does not classify burglaries as residential or business; those incidents are shown if either burglary layer is on, and are labeled Burglary. The official offense dataset has no domestic-violence flag and no stalking records in this window.",
        "locationPrecision": "Official coordinates and block locations are already blurred to the 100-block. CrimeStat does not display or store street addresses. Map areas are official SPD MCPP neighborhoods. Incidents with no neighborhood and no usable 100-block point are counted but not placed on the map. This snapshot has no 911/CAD calls layer.",
        "types": TYPES,
        "sensitive": sorted(SENSITIVE),
        "burglaryUnsplit": True,
        "bbox": bbox,
        "center": [round((minx + maxx) / 2, 5), round((miny + maxy) / 2, 5)],
        "offenseRows": len(rows),
        "callRows": 0,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "meta.json").write_text(json.dumps(meta, separators=(",", ":")))
    (OUT / "neighborhoods.json").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"id": n["id"], "name": n["name"], "c": n["c"]},
                "geometry": n["g"],
            }
            for n in neighborhoods
        ],
        "bbox": bbox,
    }, separators=(",", ":")))
    (OUT / "offenses.json").write_text(json.dumps({
        "points": points,
        "areas": areas,
    }, separators=(",", ":")))

    report = {
        "window": {"start": START, "end": END, "asOf": AS_OF, "days": 90},
        "offensesTotal": len(rows),
        "layerCounts": {t: int(layer_counts[t]) for t in TYPES},
        "layerCountsSum": int(sum(layer_counts.values())),
        "dropped": dict(drop_counts),
        "droppedSum": int(sum(drop_counts.values())),
        "mappedButNoNeighborhood": dict(no_nbh),
        "mappedButNoNeighborhoodSum": int(sum(no_nbh.values())),
        "placedViaPointInPolygon": placed_via_pip,
        "unknownNeighborhood": unknown_nbh,
        "pointsOnMap": len(points),
        "areaCells": len(areas),
        "areaIncidentSum": int(sum(c for *_, c in areas)),
        "neighborhoods": len(neighborhoods),
        "codeMapped": dict(code_mapped),
        "codeDropped": dict(code_dropped),
        "bytes": {
            "meta": (OUT / "meta.json").stat().st_size,
            "neighborhoods": (OUT / "neighborhoods.json").stat().st_size,
            "offenses": (OUT / "offenses.json").stat().st_size,
        },
    }
    (OUT / "mapping-report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({k: report[k] for k in report if k not in ("codeMapped", "codeDropped")}, indent=2))


if __name__ == "__main__":
    main()

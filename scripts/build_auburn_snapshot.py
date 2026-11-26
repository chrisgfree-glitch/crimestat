#!/usr/bin/env python3
"""Build a static 90-day Auburn PD snapshot for CrimeStat (official street addresses)."""
from __future__ import annotations

import collections
import datetime
import json
import math
import pathlib
import urllib.parse
import urllib.request

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

SITE = pathlib.Path("/workspace/crimestat")
OUT = SITE / "data/auburn"
RAW = pathlib.Path("/tmp/auburn-raw")

CRIMES = "https://gis.auburnwa.gov/hosting/rest/services/Police/Police/MapServer/0/query"
CITY_LIMITS = "https://gis.auburnwa.gov/hosting/rest/services/Administration/BoundariesB/MapServer/1/query"

# Inclusive 90-day window ending on the latest official reported date (2026-11-24 PT).
START = "2026-08-27"
AS_OF = "2026-11-24"
END = "2026-11-24"
WHERE = "REPORTED >= DATE '2026-08-27' AND REPORTED < DATE '2026-11-25'"

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

# Juvenile / child-protective types are held off the map (no pins, no addresses).
HOLD = {
    "child abuse": "held_juvenile_or_child",
    "juvenile proble": "held_juvenile_or_child",
    "cps": "held_juvenile_or_child",
    "aps": "held_juvenile_or_child",
}

MAPPED = {
    "theft": "theft",
    "assault": "assault",
    "missing person": "missing_persons",
    "drugs": "drugs",
    "vandalism": "vandalism",
    "criminal mischi": "vandalism",
    "fraud": "fraud",
    "extortion": "fraud",
    "burglary": "burglary_residential",
    "weapons offense": "weapons",
    "robbery": "robbery",
    "arson": "arson",
    "sex offense": "rape",
    "stalking": "stalking",
    "verbal domestic": "domestic_violence",
}

DROP = {
    "": "blank_offense",
    "-": "blank_offense",
    "traffic": "no_matching_layer",
    "warrant arrest": "arrest_only_or_society",
    "wanted": "arrest_only_or_society",
    "person in distr": "no_matching_layer",
    "order violation": "no_matching_layer",
    "impounded vehic": "no_matching_layer",
    "recovered stole": "no_matching_layer",
    "alarm": "not_confirmed_crime",
    "canceled": "canceled",
    "canc": "canceled",
    "trespass": "no_matching_layer",
    "lost/found prop": "no_matching_layer",
    "dui": "no_matching_layer",
    "dead body": "no_matching_layer",
    "assist": "no_matching_layer",
    "citizen assist": "no_matching_layer",
    "welfare check": "no_matching_layer",
    "suspicious": "not_confirmed_crime",
    "animal problem": "no_matching_layer",
    "obstruction": "no_matching_layer",
    "eluding": "no_matching_layer",
    "prowling": "no_matching_layer",
    "abandoned veh": "no_matching_layer",
    "bomb": "no_matching_layer",
    "homicide": "no_matching_layer",
    "miscellaneous": "no_matching_layer",
    "narcan": "no_matching_layer",
    "possession": "unmapped_ambiguous",
    "harassment": "no_matching_layer",
    "threats": "no_matching_layer",
    "civil matter": "no_matching_layer",
    "disorderly cond": "no_matching_layer",
}


def fetch_json(url: str) -> object:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "CrimeStat/1.0 (static snapshot builder)"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def query(base: str, params: dict) -> object:
    return fetch_json(base + "?" + urllib.parse.urlencode(params))


def classify(offense: str):
    key = " ".join((offense or "").split()).lower()
    if key in HOLD:
        return None, HOLD[key]
    if key in MAPPED:
        return MAPPED[key], None
    if key in DROP:
        return None, DROP[key]
    return None, "unmapped"


def day_offset(ms):
    if ms is None:
        return None
    try:
        dt = datetime.datetime.fromtimestamp(ms / 1000.0, datetime.timezone.utc)
    except (OSError, ValueError, TypeError, OverflowError):
        return None
    start = datetime.date.fromisoformat(START)
    return (dt.date() - start).days


def to_lonlat(geom):
    if not geom:
        return None
    try:
        lon = float(geom.get("x"))
        lat = float(geom.get("y"))
    except (TypeError, ValueError, AttributeError):
        return None
    if not math.isfinite(lon) or not math.isfinite(lat):
        return None
    # Auburn and a modest margin for official points just outside the city limits.
    if not (47.20 <= lat <= 47.42 and -122.35 <= lon <= -122.10):
        return None
    return lon, lat


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
    rows = []
    offset = 0
    page_size = 2000
    while True:
        data = query(CRIMES, {
            "where": WHERE,
            "outFields": "REPORTED,CASENUMBER,address,REPORTING_DISTRICT,OFFENSE,OBJECTID",
            "returnGeometry": "true",
            "outSR": "4326",
            "resultOffset": str(offset),
            "resultRecordCount": str(page_size),
            "f": "json",
        })
        if data.get("error"):
            raise SystemExit(f"crimes query failed: {data['error']}")
        feats = data.get("features") or []
        for feat in feats:
            attr = feat.get("attributes") or {}
            rows.append({
                "reported": attr.get("REPORTED"),
                "case": (attr.get("CASENUMBER") or "").strip(),
                "address": (attr.get("address") or "").strip(),
                "district": (attr.get("REPORTING_DISTRICT") or "").strip(),
                "offense": (attr.get("OFFENSE") or "").strip(),
                "objectid": attr.get("OBJECTID"),
                "geometry": feat.get("geometry"),
            })
        print("fetched", len(feats), "total", len(rows))
        if not feats or not data.get("exceededTransferLimit"):
            break
        offset += len(feats)
    cached.write_text(json.dumps(rows, separators=(",", ":")))
    return rows


def load_city_limits():
    RAW.mkdir(parents=True, exist_ok=True)
    cached = RAW / "city-limits.geojson"
    if cached.exists() and cached.stat().st_size > 1000:
        return json.loads(cached.read_text())
    data = query(CITY_LIMITS, {
        "where": "CITYNAME='AUBURN' AND STATUS='EXISTING'",
        "outFields": "CITYNAME,STATUS,OBJECTID",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "geojson",
    })
    if data.get("error"):
        raise SystemExit(f"city limits query failed: {data['error']}")
    feats = data.get("features") or []
    if not feats:
        raise SystemExit("no Auburn city-limit feature returned")
    cached.write_text(json.dumps(data, separators=(",", ":")))
    return data


def main():
    rows = load_rows()
    fc = load_city_limits()
    geoms = []
    for feat in fc.get("features") or []:
        geoms.append(simplify_geom(shape(feat["geometry"])))
    union = unary_union(geoms)
    union = simplify_geom(union, 0.00025)
    minx, miny, maxx, maxy = union.bounds
    bbox = [round(minx, 5), round(miny, 5), round(maxx, 5), round(maxy, 5)]
    c = union.representative_point()
    neighborhoods = [{
        "id": 0,
        "name": "Auburn",
        "c": [round(c.x, 5), round(c.y, 5)],
        "g": mapping(union),
    }]

    layer_counts = collections.Counter()
    drop_counts = collections.Counter()
    offense_mapped = collections.Counter()
    offense_dropped = collections.Counter()
    points = []
    area_rows = collections.Counter()
    no_point = collections.Counter()

    for r in rows:
        typ, reason = classify(r.get("offense") or "")
        label = r.get("offense") or ""
        if typ is None:
            drop_counts[reason] += 1
            offense_dropped[f"{label}|{reason}"] += 1
            continue
        layer_counts[typ] += 1
        offense_mapped[f"{label}|{typ}"] += 1
        d = day_offset(r.get("reported"))
        if d is None or d < 0 or d > 89:
            drop_counts["missing_or_out_of_window_date"] += 1
            layer_counts[typ] -= 1
            continue
        if typ in SENSITIVE:
            area_rows[(TYPE_I[typ], 0, d)] += 1
            continue
        pt = to_lonlat(r.get("geometry"))
        if pt is None:
            no_point[typ] += 1
            drop_counts["mapped_but_no_usable_point"] += 1
            continue
        lon, lat = pt
        row = [
            TYPE_I[typ],
            0,
            d,
            int(round(lon * 10000)),
            int(round(lat * 10000)),
        ]
        addr = r.get("address") or ""
        if addr:
            row.append(addr)
        points.append(row)

    areas = [[t, n, d, c] for (t, n, d), c in sorted(area_rows.items())]

    meta = {
        "id": "auburn",
        "label": f"Auburn Police Department public data, as of {AS_OF}. 90-day snapshot {START} to {END}. Not a real-time feed.",
        "source": "City of Auburn Open Data, Crimes (dataset kc27-rkrm), Public Domain. Incident locations come from the official GIS Police/Police MapServer layer 0. City limits are the City of Auburn GIS Political Boundaries feature CITYNAME=AUBURN.",
        "asOf": AS_OF,
        "start": START,
        "end": END,
        "timeBase": "asOf",
        "defaultWindow": "snapshot",
        "defaultWindowNote": f"Auburn’s default is this 90-day snapshot ({START} to {END}). Time presets are measured from the as-of date, {AS_OF}, not from today. The official Auburn dataset does not classify burglaries as residential or business; those incidents are shown if either burglary layer is on, and are labeled Burglary. Pin popups show the official street address published by Auburn Police Department.",
        "locationPrecision": "Official coordinates and street addresses are shown as published by Auburn Police Department. Rape / sexual assault, domestic violence, and stalking are city-level totals only, never pins or addresses. Juvenile-related and child-related incident types are held off the map. Incidents with no usable official coordinates are counted but not placed on the map. This snapshot has no 911/CAD calls layer.",
        "types": TYPES,
        "sensitive": sorted(SENSITIVE),
        "showSourceAddress": True,
        "burglaryUnsplit": True,
        "bbox": bbox,
        "center": [round((minx + maxx) / 2, 5), round((miny + maxy) / 2, 5)],
        "offenseRows": len(rows),
        "callRows": 0,
        "boundarySource": CITY_LIMITS.split("/query")[0],
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
        "mappedButNoPoint": dict(no_point),
        "mappedButNoPointSum": int(sum(no_point.values())),
        "pointsOnMap": len(points),
        "pointsWithAddress": sum(1 for p in points if len(p) > 5 and p[5]),
        "areaCells": len(areas),
        "areaIncidentSum": int(sum(c for *_, c in areas)),
        "offenseMapped": dict(offense_mapped),
        "offenseDropped": dict(offense_dropped),
        "bytes": {
            "meta": (OUT / "meta.json").stat().st_size,
            "neighborhoods": (OUT / "neighborhoods.json").stat().st_size,
            "offenses": (OUT / "offenses.json").stat().st_size,
        },
        "license": {
            "dataset": "https://data.auburnwa.gov/dataset/Crimes/kc27-rkrm",
            "metadata": "https://data.auburnwa.gov/api/views/kc27-rkrm.json",
            "licenseId": "PUBLIC_DOMAIN",
            "licenseName": "Public Domain",
            "attribution": "City of Auburn",
        },
    }
    (OUT / "mapping-report.json").write_text(json.dumps(report, indent=2))
    public = {k: report[k] for k in report if k not in ("offenseMapped", "offenseDropped")}
    print(json.dumps(public, indent=2))


if __name__ == "__main__":
    main()

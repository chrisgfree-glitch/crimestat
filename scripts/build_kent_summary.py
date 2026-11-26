#!/usr/bin/env python3
"""Build Kent Police Department annual WASPC/NIBRS totals for CrimeStat.

Numbers are copied from the official Washington SAC NIBRS spreadsheet only.
Do not use King County Sheriff city=KENT rows.
"""
from __future__ import annotations

import json
import pathlib
import sys

import openpyxl
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

XLSX = pathlib.Path("/tmp/nibrs_12_25.xlsx")
LIMITS = pathlib.Path("/tmp/kent-limits.geojson")
OUT = pathlib.Path(__file__).resolve().parents[1] / "data" / "kent"
SOURCE_URL = "https://sac.ofm.wa.gov/sites/default/files/nibrs_12_25.xlsx"
AGENCY = "Kent Police Department"
YEARS = ("2024", "2025")

GROUP_ROWS = [
    ("Total", "Total"),
    ("Crimes against persons (PrsnTotal)", "PrsnTotal"),
    ("Crimes against property (PrprtyTotal)", "PrprtyTotal"),
    ("Crimes against society (SctyTotal)", "SctyTotal"),
]
DETAIL_ROWS = [
    ("Murder", "Murder"),
    ("Manslaughter", "Manslaughter"),
    ("Forcible_Sex", "Forcible_Sex"),
    ("Assault", "Assault"),
    ("Non_Forcible_Sex", "Non_Forcible_Sex"),
    ("Kidnapping_Abduction", "Kidnapping_Abduction"),
    ("Human_Trafficking", "Human_Trafficking"),
    ("Viol_Of_No_Contact", "Viol_Of_No_Contact"),
    ("Arson", "Arson"),
    ("Bribery", "Bribery"),
    ("Burglary", "Burglary"),
    ("Counterfeiting_Forgery", "Counterfeiting_Forgery"),
    ("Destruction_of_Property", "Destruction_of_Property"),
    ("Extortion_Blackmail", "Extortion_Blackmail"),
    ("Robbery", "Robbery"),
    ("Theft", "Theft"),
    ("Drug_Violations", "Drug_Violations"),
    ("Gambling_Violations", "Gambling_Violations"),
    ("Pornography", "Pornography"),
    ("Prostitution", "Prostitution"),
    ("Weapon_Law_Violation", "Weapon_Law_Violation"),
    ("Animal_Cruelty", "Animal_Cruelty"),
]
PRSN = [
    "Murder", "Manslaughter", "Forcible_Sex", "Assault", "Non_Forcible_Sex",
    "Kidnapping_Abduction", "Human_Trafficking", "Viol_Of_No_Contact",
]
PROP = [
    "Arson", "Bribery", "Burglary", "Counterfeiting_Forgery",
    "Destruction_of_Property", "Extortion_Blackmail", "Robbery", "Theft",
]
SCTY = [
    "Drug_Violations", "Gambling_Violations", "Pornography", "Prostitution",
    "Weapon_Law_Violation", "Animal_Cruelty",
]


def num(v):
    if v is None:
        return 0
    if isinstance(v, int):
        return v
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v


def cols_sum(rec, names):
    return sum(num(rec[n]) for n in names)


def main():
    if not XLSX.is_file():
        sys.exit(f"missing official workbook: {XLSX}")
    if not LIMITS.is_file():
        sys.exit(f"missing official city limits: {LIMITS}")

    wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
    rows = list(wb["Reported"].iter_rows(values_only=True))
    header = list(rows[0])
    by_year = {}
    for r in rows[1:]:
        rec = {header[i]: r[i] for i in range(len(header))}
        if rec.get("Location") == AGENCY and str(rec.get("IndexYear")) in YEARS:
            by_year[str(rec["IndexYear"])] = rec
    if set(by_year) != set(YEARS):
        sys.exit(f"missing years: have {sorted(by_year)} want {YEARS}")

    for y, rec in by_year.items():
        if cols_sum(rec, PRSN) != num(rec["PrsnTotal"]):
            sys.exit(f"{y} PrsnTotal does not match official category sum")
        if cols_sum(rec, PROP) != num(rec["PrprtyTotal"]):
            sys.exit(f"{y} PrprtyTotal does not match official category sum")
        if cols_sum(rec, SCTY) != num(rec["SctyTotal"]):
            sys.exit(f"{y} SctyTotal does not match official category sum")
        if num(rec["PrsnTotal"]) + num(rec["PrprtyTotal"]) + num(rec["SctyTotal"]) != num(rec["Total"]):
            sys.exit(f"{y} Total does not match official group totals")

    latest = "2025"
    latest_rec = by_year[latest]
    prior = by_year["2024"]
    summary = {
        "agency": AGENCY,
        "sourceUrl": SOURCE_URL,
        "sourceSheet": "Reported",
        "sourceFile": "nibrs_12_25.xlsx",
        "latestYear": latest,
        "years": list(YEARS),
        "total": num(latest_rec["Total"]),
        "population": num(latest_rec["Population"]),
        "ratePublished": latest_rec["Rate"],
        "rows": [
            {"label": lab, "field": field, "count": num(latest_rec[field]), "year": latest}
            for lab, field in GROUP_ROWS + DETAIL_ROWS
        ],
        "priorYear": {
            "year": "2024",
            "total": num(prior["Total"]),
            "population": num(prior["Population"]),
            "ratePublished": prior["Rate"],
            "PrsnTotal": num(prior["PrsnTotal"]),
            "PrprtyTotal": num(prior["PrprtyTotal"]),
            "SctyTotal": num(prior["SctyTotal"]),
        },
        "extracted": {y: {h: rec[h] for h in header} for y, rec in by_year.items()},
    }

    fc = json.loads(LIMITS.read_text())
    geoms = [
        shape(f["geometry"])
        for f in fc["features"]
        if (f.get("properties") or {}).get("TAG") == "CITY_OF_KENT"
    ]
    union = unary_union(geoms).buffer(0)
    simp = union.simplify(0.00025, preserve_topology=True)
    if simp.is_empty:
        simp = union
    c = simp.representative_point()
    minx, miny, maxx, maxy = simp.bounds
    bbox = [round(minx, 5), round(miny, 5), round(maxx, 5), round(maxy, 5)]

    meta = {
        "id": "kent",
        "kind": "annual-summary",
        "label": f"Kent Police Department annual totals reported to WASPC, {latest}; not incident-level, not real-time.",
        "cardTitle": f"Kent Police Department annual totals reported to WASPC, {latest}; not incident-level, not real-time",
        "cardNote": "Figures are copied from the Washington State Statistical Analysis Center NIBRS spreadsheet (nibrs_12_25.xlsx, sheet Reported, Location = Kent Police Department). This is not an incident map and is not a real-time feed. CrimeStat does not use King County Sheriff city=KENT rows for Kent.",
        "source": SOURCE_URL,
        "asOf": f"{latest}-12-31",
        "start": f"{latest}-01-01",
        "end": f"{latest}-12-31",
        "year": latest,
        "timeBase": "asOf",
        "defaultWindow": "snapshot",
        "defaultWindowNote": "Kent is shown as annual agency totals for the most recent years in the official WASPC/Washington NIBRS file, not as 30/60/90-day incidents. The time-window buttons do not change these annual totals.",
        "locationPrecision": "Kent is shown as a city-limit outline only. No pins or street addresses are published for this feed.",
        "bbox": bbox,
        "center": [round(c.x, 5), round(c.y, 5)],
        "boundarySource": "https://gis-cityofkent.opendata.arcgis.com/datasets/7f6b7e4e518344a3b625a5b3b88f6e79_0",
    }

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2) + "\n")
    (OUT / "neighborhoods.json").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {"id": 0, "name": "Kent", "c": [round(c.x, 5), round(c.y, 5)]},
            "geometry": mapping(simp),
        }],
        "bbox": bbox,
    }, separators=(",", ":")) + "\n")
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print("wrote", OUT)


if __name__ == "__main__":
    main()

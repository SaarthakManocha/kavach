"""
KAVACH — Module 7: Weather Sensitivity Analysis
Produces: outputs/weather_sensitivity.json
Depends on: Dataset/violations_clean.pkl, outputs/zone_congestiq.json
Data source: Open-Meteo historical weather API (free, no key needed)

Correlates historical rainfall (Nov 2023 - April 2024) with per-zone
violation patterns to identify weather-sensitive enforcement zones.

Usage:
    python modules/module_weather.py
"""

import json
import sys
import warnings
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore")

# ─── Paths ────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PKL_PATH = PROJECT_ROOT / "Dataset" / "violations_clean.pkl"
CONGESTIQ_PATH = PROJECT_ROOT / "outputs" / "zone_congestiq.json"
OUTPUT_PATH = PROJECT_ROOT / "outputs" / "weather_sensitivity.json"

# ─── Historical Weather Data ─────────────────────────────
# Source: Open-Meteo archive API for Bengaluru (12.9716°N, 77.5946°E)
# Period: Nov 9, 2023 – April 8, 2024 (matches violation dataset)
# Only days with >0.5mm rainfall are listed; all other days = 0mm
BENGALURU_RAINFALL_MM = {
    "2023-11-09": 6.4, "2023-11-10": 0.9, "2023-11-14": 0.7,
    "2023-11-15": 1.0, "2023-11-21": 3.5, "2023-11-22": 1.7,
    "2023-11-23": 5.4, "2023-11-24": 3.7, "2023-11-25": 1.5,
    "2023-11-26": 0.6, "2023-11-27": 1.9, "2023-11-28": 0.7,
    "2023-12-01": 2.9, "2023-12-02": 1.2, "2023-12-03": 2.8,
    "2023-12-08": 1.9, "2023-12-09": 1.9, "2023-12-16": 0.7,
    "2024-01-04": 2.7, "2024-01-06": 1.2, "2024-01-08": 2.4,
    "2024-01-09": 1.0,
}

# Full daily temperature data (Open-Meteo)
BENGALURU_TEMP_MAX = {
    "2023-11-09": 27.1, "2023-11-10": 27.2, "2023-11-23": 27.1,
    "2023-11-24": 27.1, "2023-12-03": 26.5, "2023-12-04": 24.0,
    "2024-01-08": 23.5, "2024-03-28": 35.5, "2024-03-31": 35.2,
    "2024-04-05": 36.8, "2024-04-07": 37.5, "2024-04-08": 37.0,
}

RAIN_THRESHOLD_MM = 0.5  # >0.5mm = rainy day


def load_data():
    """Load violations and CongestIQ."""
    if not PKL_PATH.exists():
        print(f"ERROR: {PKL_PATH} not found.")
        sys.exit(1)
    df = pd.read_pickle(PKL_PATH)
    print(f"  Loaded {len(df):,} violations")

    if not CONGESTIQ_PATH.exists():
        print(f"ERROR: {CONGESTIQ_PATH} not found.")
        sys.exit(1)
    with open(CONGESTIQ_PATH) as f:
        congestiq = json.load(f)
    zone_lookup = {z["zone_id"]: z for z in congestiq}
    print(f"  Loaded CongestIQ for {len(zone_lookup)} zones")

    return df, zone_lookup


def tag_weather(df):
    """Tag each violation with weather conditions."""
    df["date_str"] = df["date"].apply(
        lambda d: d.strftime("%Y-%m-%d") if isinstance(d, date) else str(d)
    )
    df["rain_mm"] = df["date_str"].map(BENGALURU_RAINFALL_MM).fillna(0.0)
    df["is_rainy"] = df["rain_mm"] > RAIN_THRESHOLD_MM
    df["weather_cat"] = "dry"
    df.loc[(df["rain_mm"] > RAIN_THRESHOLD_MM) & (df["rain_mm"] <= 2.0), "weather_cat"] = "light_rain"
    df.loc[df["rain_mm"] > 2.0, "weather_cat"] = "heavy_rain"

    rain_days = df[df["is_rainy"]]["date_str"].nunique()
    dry_days = df[~df["is_rainy"]]["date_str"].nunique()
    print(f"  Rainy days: {rain_days}  |  Dry days: {dry_days}")
    print(f"  Violations on rain: {df[df['is_rainy']].shape[0]:,}  |  Violations on dry: {df[~df['is_rainy']].shape[0]:,}")

    return df, rain_days, dry_days


def compute_zone_sensitivity(df, rain_days, dry_days, zone_lookup):
    """Compute per-zone weather sensitivity."""
    zone_rain = df[df["is_rainy"]].groupby("geohash").size() / rain_days
    zone_dry = df[~df["is_rainy"]].groupby("geohash").size() / dry_days

    zone_comp = pd.DataFrame({"rain_vpd": zone_rain, "dry_vpd": zone_dry}).fillna(0)
    zone_comp["diff_vpd"] = zone_comp["rain_vpd"] - zone_comp["dry_vpd"]
    zone_comp["pct_change"] = (
        zone_comp["diff_vpd"] / zone_comp["dry_vpd"].clip(lower=0.1) * 100
    )

    # Only zones with meaningful volume (>=1 vpd on dry days)
    zone_comp = zone_comp[zone_comp["dry_vpd"] >= 1.0]

    results = []
    for zone_id, row in zone_comp.iterrows():
        z_info = zone_lookup.get(zone_id, {})
        display_name = z_info.get("display_name", zone_id)
        congestiq = z_info.get("congestiq_score", 0)

        # Classify sensitivity
        pct = row["pct_change"]
        if pct > 50:
            sensitivity = "high_increase"
            label = "Violations surge during rain"
            recommendation = "Pre-position extra patrol during rainfall forecasts"
        elif pct > 20:
            sensitivity = "moderate_increase"
            label = "Violations rise during rain"
            recommendation = "Monitor zone during wet weather, allocate backup unit"
        elif pct < -50:
            sensitivity = "high_decrease"
            label = "Violations drop sharply during rain"
            recommendation = "Cameras may be obstructed; consider covered camera upgrade"
        elif pct < -20:
            sensitivity = "moderate_decrease"
            label = "Violations decrease during rain"
            recommendation = "Route avoidance likely; reallocate patrol to surge zones"
        else:
            sensitivity = "stable"
            label = "Weather has minimal effect"
            recommendation = "No weather-specific action needed"

        results.append({
            "zone_id": zone_id,
            "zone_name": display_name,
            "lat": z_info.get("lat", 0),
            "lng": z_info.get("lng", 0),
            "congestiq_score": congestiq,
            "rain_vpd": round(float(row["rain_vpd"]), 1),
            "dry_vpd": round(float(row["dry_vpd"]), 1),
            "diff_vpd": round(float(row["diff_vpd"]), 1),
            "pct_change": round(float(pct), 1),
            "sensitivity": sensitivity,
            "label": label,
            "recommendation": recommendation,
        })

    results.sort(key=lambda x: abs(x["pct_change"]), reverse=True)
    return results


def compute_hourly_shift(df, rain_days, dry_days):
    """How rain shifts the violation pattern by hour."""
    hour_rain = df[df["is_rainy"]].groupby("hour").size() / rain_days
    hour_dry = df[~df["is_rainy"]].groupby("hour").size() / dry_days

    hourly = []
    for h in range(24):
        r = float(hour_rain.get(h, 0))
        d = float(hour_dry.get(h, 0))
        change = ((r - d) / max(d, 0.1)) * 100
        hourly.append({
            "hour": h,
            "rain_avg": round(r, 1),
            "dry_avg": round(d, 1),
            "pct_change": round(change, 1),
        })
    return hourly


def compute_vehicle_impact(df, rain_days, dry_days):
    """How rain affects different vehicle types."""
    vtype_rain = df[df["is_rainy"]].groupby("vehicle_type").size() / rain_days
    vtype_dry = df[~df["is_rainy"]].groupby("vehicle_type").size() / dry_days

    vcomp = pd.DataFrame({"rain_vpd": vtype_rain, "dry_vpd": vtype_dry}).fillna(0)
    vcomp["pct_change"] = ((vcomp["rain_vpd"] - vcomp["dry_vpd"]) / vcomp["dry_vpd"].clip(lower=0.1) * 100)
    vcomp = vcomp[vcomp["dry_vpd"] >= 5]  # meaningful volume
    vcomp = vcomp.sort_values("pct_change", ascending=False)

    vehicles = []
    for vtype, row in vcomp.iterrows():
        vehicles.append({
            "vehicle_type": str(vtype),
            "rain_vpd": round(float(row["rain_vpd"]), 1),
            "dry_vpd": round(float(row["dry_vpd"]), 1),
            "pct_change": round(float(row["pct_change"]), 1),
        })
    return vehicles


def compute_city_stats(df, rain_days, dry_days):
    """Overall city-wide stats."""
    daily = df.groupby(["date_str", "is_rainy"]).size().reset_index(name="count")
    rain_daily = daily[daily["is_rainy"]]["count"]
    dry_daily = daily[~daily["is_rainy"]]["count"]

    t_stat, p_val = stats.ttest_ind(rain_daily, dry_daily, equal_var=False)

    # Heavy vs light vs dry
    heavy = df[df["weather_cat"] == "heavy_rain"]
    light = df[df["weather_cat"] == "light_rain"]
    dry = df[df["weather_cat"] == "dry"]

    return {
        "rain_days": int(rain_days),
        "dry_days": int(dry_days),
        "rain_avg_violations": round(float(rain_daily.mean()), 0),
        "dry_avg_violations": round(float(dry_daily.mean()), 0),
        "overall_pct_change": round(float((rain_daily.mean() - dry_daily.mean()) / dry_daily.mean() * 100), 1),
        "t_statistic": round(float(t_stat), 3),
        "p_value": round(float(p_val), 4),
        "statistically_significant": bool(p_val < 0.05),
        "heavy_rain_vpd": round(len(heavy) / max(1, heavy["date_str"].nunique()), 0),
        "light_rain_vpd": round(len(light) / max(1, light["date_str"].nunique()), 0),
        "dry_vpd": round(len(dry) / max(1, dry["date_str"].nunique()), 0),
        "data_source": "Open-Meteo Historical Weather API",
        "period": "Nov 9, 2023 - April 8, 2024",
        "location": "Bengaluru (12.97N, 77.59E)",
    }


def main():
    print("=" * 60)
    print("KAVACH -- Module 7: Weather Sensitivity Analysis")
    print("=" * 60)

    print("\n[STEP 1] Loading data ...")
    df, zone_lookup = load_data()

    print("\n[STEP 2] Tagging weather conditions ...")
    df, rain_days, dry_days = tag_weather(df)

    print("\n[STEP 3] Computing zone-level sensitivity ...")
    zones = compute_zone_sensitivity(df, rain_days, dry_days, zone_lookup)

    high_inc = sum(1 for z in zones if z["sensitivity"] == "high_increase")
    mod_inc = sum(1 for z in zones if z["sensitivity"] == "moderate_increase")
    high_dec = sum(1 for z in zones if z["sensitivity"] == "high_decrease")
    mod_dec = sum(1 for z in zones if z["sensitivity"] == "moderate_decrease")
    stable = sum(1 for z in zones if z["sensitivity"] == "stable")

    print(f"  Total zones analyzed: {len(zones)}")
    print(f"  High increase (>50%):     {high_inc}")
    print(f"  Moderate increase (>20%): {mod_inc}")
    print(f"  Stable:                   {stable}")
    print(f"  Moderate decrease:        {mod_dec}")
    print(f"  High decrease (<-50%):    {high_dec}")

    print("\n[STEP 4] Computing hourly pattern shift ...")
    hourly = compute_hourly_shift(df, rain_days, dry_days)

    print("\n[STEP 5] Computing vehicle type impact ...")
    vehicles = compute_vehicle_impact(df, rain_days, dry_days)

    print("\n[STEP 6] Computing city-wide stats ...")
    city_stats = compute_city_stats(df, rain_days, dry_days)

    # Build output
    output = {
        "city_summary": city_stats,
        "zones": zones,
        "hourly_shift": hourly,
        "vehicle_impact": vehicles,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n  Saved -> {OUTPUT_PATH}")

    # Summary
    print(f"\n{'='*60}")
    print("WEATHER SENSITIVITY SUMMARY")
    print(f"  City-wide: rain has {city_stats['overall_pct_change']:+.1f}% effect (p={city_stats['p_value']})")
    print(f"  Heavy rain: {city_stats['heavy_rain_vpd']:.0f} vpd  |  Light rain: {city_stats['light_rain_vpd']:.0f} vpd  |  Dry: {city_stats['dry_vpd']:.0f} vpd")
    print(f"\n  Top weather-sensitive zones:")
    for z in zones[:5]:
        print(f"    {z['zone_name']} ({z['zone_id']}): {z['pct_change']:+.1f}% on rain  [{z['sensitivity']}]")
        print(f"      -> {z['recommendation']}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

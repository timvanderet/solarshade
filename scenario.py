import datetime
import calendar
import numpy as np
from shapely.ops import unary_union

from solar import get_solar_timeseries
from geometry import gps_to_local, local_to_gps, compute_shadow_polygon
from panels import build_panel_polygon, shade_fraction, calculate_azimuth


def _infer_timezone(lat: float, lon: float) -> str:
    from timezonefinder import TimezoneFinder
    tf = TimezoneFinder()
    tz = tf.timezone_at(lat=lat, lng=lon)
    return tz or "UTC"


def _panel_centroid(corners: list[tuple[float, float]]) -> tuple[float, float]:
    lats = [c[0] for c in corners]
    lons = [c[1] for c in corners]
    return sum(lats) / len(lats), sum(lons) / len(lons)


def run_scenario(
    panel_corners: list[tuple[float, float]],
    panel_tilt_deg: float,
    trees: list[dict],
    timezone: str | None = None,
    year: int = 2025,
) -> dict:
    if len(panel_corners) != 4:
        raise ValueError("panel_corners must have exactly 4 corners")
    if panel_tilt_deg is None or panel_tilt_deg <= 0:
        raise ValueError("panel_tilt_deg must be a positive number")

    centroid_lat, centroid_lon = _panel_centroid(panel_corners)
    if timezone is None:
        timezone = _infer_timezone(centroid_lat, centroid_lon)

    origin_lat, origin_lon = centroid_lat, centroid_lon
    panel_poly, azimuth_deg, width_m, height_m = build_panel_polygon(
        panel_corners, origin_lat, origin_lon
    )
    panel_area_m2 = panel_poly.area

    solar_df = get_solar_timeseries(centroid_lat, centroid_lon, timezone, year)

    # Build day-of-year lookup for the hourly heatmap
    days_in_year = 366 if calendar.isleap(year) else 365
    # heatmap: 24 rows x days_in_year cols, None = night
    heatmap_z = [[None] * days_in_year for _ in range(24)]

    # Monthly accumulators
    monthly_raw_shaded = [0.0] * 12
    monthly_raw_total = [0.0] * 12
    monthly_irr_shaded = [0.0] * 12
    monthly_irr_total = [0.0] * 12

    # Per-tree isolation runs (same solar_df reused)
    per_tree_raw = {t["id"]: 0.0 for t in trees}
    per_tree_irr = {t["id"]: 0.0 for t in trees}

    total_daylight_hours = len(solar_df)
    total_irr_weight = 0.0
    total_raw_shaded = 0.0
    total_irr_shaded = 0.0

    for _, row in solar_df.iterrows():
        dt: datetime.datetime = row["datetime"]
        if hasattr(dt, "to_pydatetime"):
            dt = dt.to_pydatetime()
        date = dt.date()
        hour = dt.hour
        az = row["solar_azimuth"]
        el = row["solar_elevation"]
        w = row["irradiance_weight"]
        month_idx = date.month - 1

        day_of_year = date.timetuple().tm_yday - 1  # 0-indexed

        # Combined shadow (union of all trees)
        shadow_polys = []
        for tree in trees:
            sp = compute_shadow_polygon(tree, az, el, origin_lat, origin_lon, date)
            if sp is not None:
                shadow_polys.append(sp)

        if shadow_polys:
            combined = unary_union(shadow_polys)
            frac = shade_fraction(panel_poly, combined)
        else:
            frac = 0.0

        # Heatmap cell (daylight hour → value)
        if 0 <= day_of_year < days_in_year:
            heatmap_z[hour][day_of_year] = frac

        total_raw_shaded += frac
        total_irr_shaded += frac * w
        total_irr_weight += w

        monthly_raw_shaded[month_idx] += frac
        monthly_raw_total[month_idx] += 1
        monthly_irr_shaded[month_idx] += frac * w
        monthly_irr_total[month_idx] += w

        # Per-tree isolation
        for tree in trees:
            sp = compute_shadow_polygon(tree, az, el, origin_lat, origin_lon, date)
            tf_val = shade_fraction(panel_poly, sp)
            per_tree_raw[tree["id"]] += tf_val
            per_tree_irr[tree["id"]] += tf_val * w

    annual_raw_pct = (total_raw_shaded / total_daylight_hours * 100) if total_daylight_hours > 0 else 0.0
    annual_irr_pct = (total_irr_shaded * 100) if total_irr_weight > 0 else 0.0

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly = []
    for i in range(12):
        raw_pct = (monthly_raw_shaded[i] / monthly_raw_total[i] * 100) if monthly_raw_total[i] > 0 else 0.0
        irr_pct = (monthly_irr_shaded[i] / monthly_irr_total[i] * 100) if monthly_irr_total[i] > 0 else 0.0
        monthly.append({
            "month": i + 1,
            "month_name": month_names[i],
            "shade_pct_raw": round(raw_pct, 3),
            "shade_pct_irradiance": round(irr_pct, 3),
        })

    per_tree_results = []
    for tree in trees:
        tid = tree["id"]
        raw_pct = (per_tree_raw[tid] / total_daylight_hours * 100) if total_daylight_hours > 0 else 0.0
        irr_pct = (per_tree_irr[tid] * 100) if total_irr_weight > 0 else 0.0
        per_tree_results.append({
            "id": tid,
            "name": tree["name"],
            "shade_pct_raw": round(raw_pct, 3),
            "shade_pct_irradiance": round(irr_pct, 3),
        })

    x_labels = []
    for doy in range(days_in_year):
        d = datetime.date(year, 1, 1) + datetime.timedelta(days=doy)
        x_labels.append(d.strftime("%-m/%-d"))

    hour_labels = []
    for h in range(24):
        if h == 0:
            hour_labels.append("12am")
        elif h < 12:
            hour_labels.append(f"{h}am")
        elif h == 12:
            hour_labels.append("12pm")
        else:
            hour_labels.append(f"{h-12}pm")

    return {
        "annual_shade_pct_raw": round(annual_raw_pct, 3),
        "annual_shade_pct_irradiance": round(annual_irr_pct, 3),
        "monthly": monthly,
        "hourly_heatmap": {
            "z": heatmap_z,
            "x_labels": x_labels,
            "y_labels": hour_labels,
        },
        "per_tree": per_tree_results,
        "panel_azimuth_deg": round(azimuth_deg, 2),
        "panel_area_m2": round(panel_area_m2, 2),
        "panel_centroid": {"lat": centroid_lat, "lon": centroid_lon},
        "total_daylight_hours": total_daylight_hours,
    }


def run_heatmap_grid(
    panel_corners: list[tuple[float, float]],
    panel_tilt_deg: float,
    tree_height_m: float,
    canopy_radius_m: float,
    timezone: str | None = None,
    year: int = 2025,
    grid_size: int = 40,
    grid_spacing_m: float = 2.0,
) -> list[dict]:
    centroid_lat, centroid_lon = _panel_centroid(panel_corners)
    if timezone is None:
        timezone = _infer_timezone(centroid_lat, centroid_lon)

    origin_lat, origin_lon = centroid_lat, centroid_lon
    panel_poly, _, _, _ = build_panel_polygon(panel_corners, origin_lat, origin_lon)

    # Compute solar timeseries once and reuse across all grid points
    solar_df = get_solar_timeseries(centroid_lat, centroid_lon, timezone, year)
    total_daylight_hours = len(solar_df)

    half = (grid_size - 1) / 2.0 * grid_spacing_m
    results = []

    for row in range(grid_size):
        for col in range(grid_size):
            gx = -half + col * grid_spacing_m
            gy = -half + row * grid_spacing_m
            pt_lat, pt_lon = local_to_gps(gx, gy, origin_lat, origin_lon)

            tree = {
                "id": f"grid_{row}_{col}",
                "name": "grid",
                "lat": pt_lat,
                "lon": pt_lon,
                "height_m": tree_height_m,
                "canopy_radius_m": canopy_radius_m,
                "shape": "cylinder",
                "deciduous": False,
            }

            irr_shaded = 0.0
            for _, srow in solar_df.iterrows():
                dt = srow["datetime"]
                if hasattr(dt, "to_pydatetime"):
                    dt = dt.to_pydatetime()
                date = dt.date()
                sp = compute_shadow_polygon(
                    tree,
                    srow["solar_azimuth"],
                    srow["solar_elevation"],
                    origin_lat,
                    origin_lon,
                    date,
                )
                frac = shade_fraction(panel_poly, sp)
                irr_shaded += frac * srow["irradiance_weight"]

            results.append({
                "lat": pt_lat,
                "lon": pt_lon,
                "shade_pct": round(irr_shaded * 100, 4),
            })

    return results


# ── Sample scenario / smoke test ─────────────────────────────────────────────
#
# Tree placement note:
# The panel is near Glen Ellen, CA (lat ~38.3844, Northern Hemisphere).
# The sun is always to the SOUTH, so shadows fall NORTHWARD.
# Trees must be placed SOUTH of the panel to cast shadows onto it.
# Original sample had trees north of the panel (lat > centroid), so their
# shadows extended further north and never intersected the panel footprint.
# The corrected positions place both trees south of the panel.
#
# Expected results:
#   - Evergreen (Oak A) should contribute MORE shadow than deciduous (Maple B)
#     because Maple B loses all shadow during the leaf-off season
#     (Oct 15 – Mar 14), which covers roughly 5 months of winter when the
#     sun is low and shadows are long and most damaging.
#   - Irradiance-weighted shading should be lower than raw-hours shading
#     because peak-irradiance hours coincide with high sun elevation and
#     shorter (but more focused) shadows.

if __name__ == "__main__":
    panel_corners = [
        (38.384388, -122.552374),
        (38.384408, -122.552275),
        (38.384440, -122.552290),
        (38.384422, -122.552385),
    ]

    panel_tilt_deg = 22.0

    # Trees placed SOUTH of the panel so their northward shadows hit the panel.
    # Centroid is approx (38.384415, -122.552331).
    # Oak A: ~20m south, ~5m east of centroid.
    # Maple B: ~12m south, directly south of centroid.
    # At these distances, both trees cast shadows that reach the panel at low sun
    # angles (winter noon elevation ~28°). The Oak shadow is longer due to greater
    # height, and the Maple loses shadow entirely during leaf-off (Oct 15–Mar 14),
    # which includes the peak-shadow winter months. This makes Oak A the dominant
    # contributor, satisfying the spec validation target.
    trees = [
        {
            "id": "tree-1",
            "name": "Oak A",
            "lat": 38.384235,
            "lon": -122.552274,
            "height_m": 10.0,
            "canopy_radius_m": 3.0,
            "shape": "cylinder",
            "deciduous": False,
        },
        {
            "id": "tree-2",
            "name": "Maple B",
            "lat": 38.384307,
            "lon": -122.552331,
            "height_m": 8.0,
            "canopy_radius_m": 2.0,
            "shape": "cylinder",
            "deciduous": True,
        },
    ]

    results = run_scenario(panel_corners, panel_tilt_deg, trees, year=2025)

    print("=" * 50)
    print("SOLAR SHADOW STUDY - Sample Scenario Results")
    print("=" * 50)
    print(f"Panel azimuth:       {results['panel_azimuth_deg']:.1f}°")
    print(f"Panel area:          {results['panel_area_m2']:.1f} m²")
    print(f"Total daylight hrs:  {results['total_daylight_hours']}")
    print()
    print(f"Annual irradiance-weighted shading: {results['annual_shade_pct_irradiance']:.2f}%")
    print(f"Annual raw-hours shading:           {results['annual_shade_pct_raw']:.2f}%")
    print()
    print("Per-tree breakdown:")
    for t in results["per_tree"]:
        print(f"  {t['name']:10s} irr={t['shade_pct_irradiance']:.3f}%  raw={t['shade_pct_raw']:.3f}%")

    # Validations
    oak = next(t for t in results["per_tree"] if t["name"] == "Oak A")
    maple = next(t for t in results["per_tree"] if t["name"] == "Maple B")

    print()
    print("Validation checks:")
    irr_lt_raw = results["annual_shade_pct_irradiance"] < results["annual_shade_pct_raw"]
    oak_gt_maple = oak["shade_pct_irradiance"] > maple["shade_pct_irradiance"]
    print(f"  Irradiance < raw hours:        {'PASS' if irr_lt_raw else 'FAIL'}")
    print(f"  Oak (evergreen) > Maple (dec): {'PASS' if oak_gt_maple else 'FAIL'}")

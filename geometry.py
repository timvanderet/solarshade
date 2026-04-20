import math
import datetime
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

EARTH_RADIUS_M = 6_371_000.0


def gps_to_local(lat: float, lon: float, origin_lat: float, origin_lon: float) -> tuple[float, float]:
    lat_rad = math.radians(origin_lat)
    x = math.radians(lon - origin_lon) * EARTH_RADIUS_M * math.cos(lat_rad)
    y = math.radians(lat - origin_lat) * EARTH_RADIUS_M
    return x, y


def local_to_gps(x: float, y: float, origin_lat: float, origin_lon: float) -> tuple[float, float]:
    lat_rad = math.radians(origin_lat)
    lat = origin_lat + math.degrees(y / EARTH_RADIUS_M)
    lon = origin_lon + math.degrees(x / (EARTH_RADIUS_M * math.cos(lat_rad)))
    return lat, lon


_LEAF_OFF_START = (10, 15)  # Oct 15
_LEAF_OFF_END = (3, 14)     # Mar 14


def _is_leaf_off(date: datetime.date) -> bool:
    md = (date.month, date.day)
    if md >= _LEAF_OFF_START:
        return True
    if md <= _LEAF_OFF_END:
        return True
    return False


def compute_shadow_polygon(
    tree: dict,
    solar_azimuth_deg: float,
    solar_elevation_deg: float,
    origin_lat: float,
    origin_lon: float,
    date: datetime.date,
    panel_height_m: float = 0.0,
) -> Polygon | None:
    if solar_elevation_deg <= 0:
        return None

    if tree.get("deciduous", False) and _is_leaf_off(date):
        return None

    tx, ty = gps_to_local(tree["lat"], tree["lon"], origin_lat, origin_lon)
    height_m = float(tree["height_m"])
    canopy_r = float(tree["canopy_radius_m"])
    shape = tree.get("shape", "cylinder")

    elev_rad = math.radians(solar_elevation_deg)
    eff_height = height_m - panel_height_m
    if eff_height <= 0:
        return None
    shadow_length = eff_height / math.tan(elev_rad)

    # Shadow direction: sun azimuth points toward sun, shadow falls opposite
    az_rad = math.radians(solar_azimuth_deg)
    # Shadow tip offset from tree base (shadow falls opposite to sun direction)
    sdx = -math.sin(az_rad) * shadow_length
    sdy = -math.cos(az_rad) * shadow_length

    N_VERTS = 16

    if shape == "cylinder":
        # Circle at tree base + same circle shifted by shadow offset → convex hull
        def circle_pts(cx, cy, r):
            return [
                (cx + r * math.cos(2 * math.pi * i / N_VERTS),
                 cy + r * math.sin(2 * math.pi * i / N_VERTS))
                for i in range(N_VERTS)
            ]
        base_pts = circle_pts(tx, ty, canopy_r)
        tip_pts = circle_pts(tx + sdx, ty + sdy, canopy_r)
        poly = Polygon(base_pts + tip_pts).convex_hull

    elif shape == "cone":
        # Cone: canopy base circle at ground + projected apex shadow tip (point)
        def circle_pts(cx, cy, r):
            return [
                (cx + r * math.cos(2 * math.pi * i / N_VERTS),
                 cy + r * math.sin(2 * math.pi * i / N_VERTS))
                for i in range(N_VERTS)
            ]
        base_pts = circle_pts(tx, ty, canopy_r)
        apex_shadow = (tx + sdx, ty + sdy)
        poly = Polygon(base_pts + [apex_shadow]).convex_hull
    else:
        return None

    if not poly.is_valid or poly.is_empty:
        return None
    return poly

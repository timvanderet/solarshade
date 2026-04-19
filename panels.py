import math
from shapely.geometry import Polygon
from geometry import gps_to_local


def calculate_azimuth(corners: list[tuple[float, float]]) -> float:
    # Convert to local-meter using corners[0] as temporary origin
    origin_lat, origin_lon = corners[0]
    local = [gps_to_local(lat, lon, origin_lat, origin_lon) for lat, lon in corners]

    # Compute all four edge lengths
    n = len(local)
    edges = []
    for i in range(n):
        x1, y1 = local[i]
        x2, y2 = local[(i + 1) % n]
        length = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        bearing = math.degrees(math.atan2(x2 - x1, y2 - y1)) % 360
        edges.append((length, bearing, i))

    # Identify the two longer opposite edges (indices 0&2 vs 1&3)
    pair_02 = edges[0][0] + edges[2][0]
    pair_13 = edges[1][0] + edges[3][0]

    if pair_02 >= pair_13:
        long_bearing = edges[0][1]
    else:
        long_bearing = edges[1][1]

    # Panel azimuth is perpendicular to the long axis
    cand1 = (long_bearing + 90) % 360
    cand2 = (long_bearing - 90) % 360

    # Choose candidate in southern semicircle (90, 270]
    def in_southern(b):
        return 90 < b <= 270

    if in_southern(cand1) and not in_southern(cand2):
        return cand1
    if in_southern(cand2) and not in_southern(cand1):
        return cand2
    # Tie-break: if both or neither are in (90,270], pick cand closest to 180
    # Per spec: if candidates are exactly 90 and 270, return 270
    if abs(cand1 - 270) < abs(cand2 - 270):
        return cand1
    return cand2


def build_panel_polygon(
    corners: list[tuple[float, float]],
    origin_lat: float,
    origin_lon: float,
) -> tuple[Polygon, float, float, float]:
    local_pts = [gps_to_local(lat, lon, origin_lat, origin_lon) for lat, lon in corners]
    poly = Polygon(local_pts)
    azimuth = calculate_azimuth(corners)

    # Width and height: use the two edge-pair lengths
    n = len(local_pts)
    def edge_len(i):
        x1, y1 = local_pts[i]
        x2, y2 = local_pts[(i + 1) % n]
        return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

    e0, e1, e2, e3 = [edge_len(i) for i in range(4)]
    width_m = (e0 + e2) / 2
    height_m = (e1 + e3) / 2

    return poly, azimuth, width_m, height_m


def shade_fraction(panel_polygon: Polygon, shadow_polygon: Polygon | None) -> float:
    if shadow_polygon is None or shadow_polygon.is_empty:
        return 0.0
    if not panel_polygon.is_valid or panel_polygon.is_empty:
        return 0.0
    intersection = panel_polygon.intersection(shadow_polygon)
    panel_area = panel_polygon.area
    if panel_area == 0:
        return 0.0
    return min(intersection.area / panel_area, 1.0)

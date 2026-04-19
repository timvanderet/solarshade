import pandas as pd
import pvlib
from pvlib.location import Location


def get_solar_timeseries(lat: float, lon: float, timezone: str, year: int) -> pd.DataFrame:
    loc = Location(latitude=lat, longitude=lon, tz=timezone, altitude=0)
    times = pd.date_range(
        start=f"{year}-01-01",
        end=f"{year}-12-31 23:00:00",
        freq="1h",
        tz=timezone,
    )
    solar_pos = loc.get_solarposition(times)
    clearsky = loc.get_clearsky(times, model="ineichen")

    df = pd.DataFrame({
        "datetime": times,
        "solar_azimuth": solar_pos["azimuth"].values,
        "solar_elevation": solar_pos["apparent_elevation"].values,
        "dni": clearsky["dni"].values,
        "ghi": clearsky["ghi"].values,
    })

    # Keep only daylight hours (elevation > 0)
    df = df[df["solar_elevation"] > 0].copy()

    total_ghi = df["ghi"].sum()
    if total_ghi > 0:
        df["irradiance_weight"] = df["ghi"] / total_ghi
    else:
        df["irradiance_weight"] = 0.0

    df = df.reset_index(drop=True)
    return df

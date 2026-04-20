import os
import time
import threading
import uuid

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(layout="wide", page_title="SolarShade")

# Suppress Streamlit chrome and make the component fill the viewport.
# Blank-page root cause: Streamlit wraps the custom component iframe in a
# stVerticalBlock / stMainBlockContainer with inherent padding and sets the
# iframe to a small initial height. We zero out all padding/margin and let
# the iframe (which calls setFrameHeight(window.innerHeight)) grow to full
# viewport height. Without this CSS, the component renders but is clipped to
# the Streamlit default 150px or 0px.
st.markdown("""
<style>
  /* Remove Streamlit chrome */
  #MainMenu, header, footer { display: none !important; }

  /* Zero out all Streamlit layout padding */
  html, body { height: 100vh; width: 100vw; overflow: hidden; padding: 0; margin: 0; }
  [data-testid="stAppViewContainer"],
  [data-testid="stMain"],
  [data-testid="stMainBlockContainer"],
  [data-testid="stVerticalBlock"],
  [data-testid="stVerticalBlockBorderWrapper"],
  [data-testid="stVerticalBlockBorderWrapper"] > div,
  .block-container,
  section.main > div {
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    height: 100vh !important;
    overflow: hidden !important;
  }

  /* Make the custom component iframe fill the full viewport.
     Streamlit sets the component name to "{module}.{name}" so the iframe
     title is "app.solarshade", not "solarshade". Target all three ways. */
  iframe[title="app.solarshade"],
  iframe[title="solarshade"],
  iframe[data-testid="stCustomComponentV1"],
  iframe.stCustomComponentV1 {
    width: 100vw !important;
    height: 100vh !important;
    border: none !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
</style>
""", unsafe_allow_html=True)

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

# Declare component once
_DEV_MODE = os.environ.get("SOLAR_DEV", "").lower() in ("1", "true", "yes")
if _DEV_MODE:
    _component_func = components.declare_component(
        "solarshade", url="http://localhost:3001"
    )
else:
    _component_func = components.declare_component(
        "solarshade", path=os.path.join(os.path.dirname(__file__), "frontend", "build")
    )

# Session state defaults
for key, default in [
    ("results", None),
    ("charts", None),
    ("error", None),
    ("heatmap_grid", None),
    ("heatmap_status", "idle"),
    ("last_processed_request_id", None),
    ("_heatmap_thread_result", None),
    ("_heatmap_job_id", None),
]:
    if key not in st.session_state:
        st.session_state[key] = default

# Poll heatmap completion
if st.session_state.heatmap_status == "running":
    result_container = st.session_state.get("_heatmap_thread_result")
    if result_container is not None and result_container.get("done"):
        if result_container.get("error"):
            st.session_state.heatmap_status = "error"
        else:
            st.session_state.heatmap_grid = result_container["data"]
            st.session_state.heatmap_status = "complete"
        st.session_state._heatmap_thread_result = None

# Build props for component
props = {
    "google_maps_api_key": GOOGLE_MAPS_API_KEY,
    "results": st.session_state.results,
    "charts": st.session_state.charts,
    "heatmap_grid": st.session_state.heatmap_grid,
    "heatmap_status": st.session_state.heatmap_status,
    "last_processed_request_id": st.session_state.last_processed_request_id,
    "error": st.session_state.error,
}

# Call component once
component_value = _component_func(**props, key="solar_app", default=None)

# Handle component output
if component_value and component_value.get("run_analysis"):
    request_id = component_value.get("analysis_request_id")
    if request_id != st.session_state.last_processed_request_id:
        st.session_state.last_processed_request_id = request_id
        st.session_state.error = None
        st.session_state.results = None
        st.session_state.charts = None
        st.session_state.heatmap_grid = None
        st.session_state.heatmap_status = "idle"

        panel_corners = [tuple(c) for c in component_value.get("panel_corners", [])]
        panel_tilt_deg = component_value.get("panel_tilt_deg")
        trees = component_value.get("trees", [])
        year = component_value.get("year", 2025)

        try:
            from scenario import run_scenario, run_heatmap_grid
            from analysis import generate_charts

            results = run_scenario(
                panel_corners=panel_corners,
                panel_tilt_deg=panel_tilt_deg,
                trees=trees,
                year=year,
            )
            charts = generate_charts(results)
            st.session_state.results = results
            st.session_state.charts = charts
            st.session_state.heatmap_status = "running"

            # Compute representative tree dimensions
            if trees:
                avg_h = sum(t["height_m"] for t in trees) / len(trees)
                avg_r = sum(t["canopy_radius_m"] for t in trees) / len(trees)
            else:
                avg_h, avg_r = 10.0, 3.0

            result_container = {"done": False, "data": None, "error": None}
            st.session_state._heatmap_thread_result = result_container

            def _run_heatmap(corners, tilt, h, r, yr, container):
                try:
                    data = run_heatmap_grid(
                        panel_corners=corners,
                        panel_tilt_deg=tilt,
                        tree_height_m=h,
                        canopy_radius_m=r,
                        year=yr,
                    )
                    container["data"] = data
                except Exception as exc:
                    container["error"] = str(exc)
                finally:
                    container["done"] = True

            t = threading.Thread(
                target=_run_heatmap,
                args=(panel_corners, panel_tilt_deg, avg_h, avg_r, year, result_container),
                daemon=True,
            )
            t.start()

        except Exception as e:
            st.session_state.error = str(e)
            st.session_state.heatmap_status = "idle"

        st.rerun()

# Short poll while heatmap is running
if st.session_state.heatmap_status == "running":
    time.sleep(1.5)
    st.rerun()

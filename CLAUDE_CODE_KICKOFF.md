# Claude Code Kickoff - Solar Shadow Study

Use this prompt to have Claude Code build the application end to end.

---

## Prompt

You are building a new application called Solar Shadow Study.

Read `SPEC.md` first and treat it as the source of truth for product scope, architecture, data contracts, UX, and validation goals.

### Working Style

Build this project end to end without waiting for manual confirmation between phases.

You should:

- make reasonable implementation decisions when the spec leaves small gaps
- call out only meaningful blockers or tradeoffs
- prefer completing the whole working build over repeatedly stopping for approval
- keep the code modular and testable
- validate each major subsystem before moving on

### Product Summary

The app helps a user understand how much annual solar production is lost when nearby trees cast shadows on a solar panel array.

The user:

1. searches for a location on a satellite map
2. traces a four-corner panel footprint over a roof face
3. places trees and configures their properties
4. runs a full-year hourly simulation
5. reviews irradiance-weighted shading results, charts, and a planting-impact heatmap

The most important metric is irradiance-weighted annual shading percentage. Raw hours shaded is secondary context only.

### Required Stack

- React custom component frontend
- Google Maps JavaScript API for map, search, drawing, markers, and heatmap
- Streamlit as Python host
- Python modules for solar, geometry, panels, scenario, and analysis
- Plotly for charts

### Required Files To Create

```text
frontend/
  package.json
  public/index.html
  src/SolarShadowApp.jsx
solar.py
geometry.py
panels.py
scenario.py
analysis.py
app.py
requirements.txt
Dockerfile
.gitignore
```

### Non-Negotiable Requirements

- The panel input must be a rotatable four-corner footprint, not an axis-aligned rectangle bounds object
- The Streamlit custom component must be declared once and called once
- The Google Maps API key must come from environment variables only
- All internal geometry should operate in local-meter coordinates
- Main results must render before the planting-impact heatmap finishes
- Use an explicit year, defaulting to `2025`, to keep outputs deterministic
- Avoid circular imports
- Treat `panel_tilt_deg` as required, validated, stored, and exported, but do not use it to alter plan-view shading geometry in v1
- Normalize panel corners into clockwise order before azimuth calculation
- When `timezone` is omitted, infer it from the panel centroid using `timezonefinder`
- Generate a fresh `analysis_request_id` on every Run Analysis click and use it to prevent rerun loops during heatmap polling
- Do not use deprecated Google `SearchBox`, `PlacesService`, `DrawingManager`, or `HeatmapLayer` for a new build
- Keep the full product UI inside the React custom component; do not put the working sidebar in `st.sidebar`
- Size the Streamlit component iframe to the viewport on load and resize so the map app renders full-screen
- Treat `year` as a non-user-facing v1 setting: default to `2025` for new sessions and preserve/import it through config files
- Include `year` in the component payload sent to Python so imported configs can control subsequent analysis runs
- Use the Streamlit v1 frontend bridge dependency `streamlit-component-lib` in `frontend/package.json`
- Suppress default Streamlit page chrome in `app.py` so the deployed app presents as a minimal full-screen product shell

### Suggested Build Order

1. Build `solar.py`
2. Build `geometry.py`
3. Build `panels.py`
4. Build `scenario.py`
5. Build `analysis.py`
6. Build the React frontend
7. Build `app.py` integration
8. Add packaging and deployment files

### Google Maps Implementation Guidance

- use `google.maps.Polygon` for the panel footprint
- implement the 4-click creation flow manually
- use built-in polygon editability for post-creation vertex editing
- use `google.maps.places.PlaceAutocompleteElement` loaded via `google.maps.importLibrary("places")` for address search
- use a non-deprecated overlay strategy for the planting-impact heatmap

### Validation Expectations

As you build, validate these checkpoints:

- solar noon elevation near `75 deg` on June 21 and `28 deg` on December 21 at lat `38.38`, lon `-122.55`
- Glen Ellen panel test case returns azimuth near `165.5 deg` and area near `34.7 m2`
- deciduous trees produce materially less annual shading than comparable evergreen trees
- irradiance-weighted annual impact is lower than raw-hours shaded impact for the sample scenario
- exported JSON can be re-imported and fully restores app state
- nighttime hourly-heatmap cells render as blank rather than zero
- for equal tree height and canopy radius under the same sun position, a cone shadow covers less area than a cylinder shadow

### Sample Scenario For Testing

```python
panel_corners = [
    (38.384388, -122.552374),
    (38.384408, -122.552275),
    (38.384440, -122.552290),
    (38.384422, -122.552385),
]

panel_tilt_deg = 22.0

trees = [
    {
        "id": "tree-1",
        "name": "Oak A",
        "lat": 38.3846,
        "lon": -122.5524,
        "height_m": 10.0,
        "canopy_radius_m": 3.0,
        "shape": "cylinder",
        "deciduous": False,
    },
    {
        "id": "tree-2",
        "name": "Maple B",
        "lat": 38.3845,
        "lon": -122.5525,
        "height_m": 8.0,
        "canopy_radius_m": 2.0,
        "shape": "cylinder",
        "deciduous": True,
    },
]
```

### Frontend Expectations

The UI should feel like a polished spatial analysis tool:

- light mode
- map-first
- restrained controls
- clear sidebar structure
- floating results card
- inline error handling

The user must be able to:

- search an address
- trace a panel footprint
- place, edit, and delete trees
- enter tilt
- run analysis
- switch between monthly, hourly, and per-tree chart views
- export and import JSON configs

### Heatmap Requirement

The planting-impact heatmap is required, but it must not block the first display of the main analysis results.

Use a background task or equivalent non-blocking state flow so the UI can show:

- main results immediately after scenario completion
- a temporary "Computing heatmap..." state
- the heatmap overlay when ready

For Streamlit, prefer this pattern:

- run the main scenario synchronously
- store main results in `st.session_state`
- run the heatmap in a background worker using plain Python objects outside `st.session_state`
- poll worker completion on reruns
- write completed heatmap results into `st.session_state` only from the main script execution path
- gate main-scenario execution on a fresh `analysis_request_id` so polling reruns do not re-run the full simulation
- while the heatmap job is running, trigger short polling reruns from the main script so completion becomes visible without user interaction

### Packaging And Hosting

The production build must work in Docker and on Cloud Run.

Required deployment approach:

- use a multi-stage Docker build
- build the React frontend with Node in the build stage
- copy the built frontend assets into the Python runtime image at the same path used by the Streamlit component declaration
- emit the production frontend bundle into `frontend/build`
- support a local frontend dev server on `http://localhost:3001` and a production build-path declaration for Streamlit
- run Streamlit on `0.0.0.0:$PORT`, not the default localhost binding
- ensure the Google Cloud project has both Maps JavaScript API and Places API (New) enabled

### Output Expectations

By the end, provide:

- the full working codebase
- a short explanation of any reasonable deviations from the spec
- a summary of what was validated
- any remaining risks or follow-up work

If `SPEC.md` leaves a critical blocker, state the blocker clearly and propose the smallest practical decision needed to proceed.

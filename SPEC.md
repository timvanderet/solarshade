# Solar Shadow Study - Technical Specification

## 1. Product Summary

Solar Shadow Study is a web app for estimating how much nearby trees shade a solar panel array over a full year.

The user:

1. Searches for a site on a satellite map
2. Traces a single roof-face or panel-array footprint using a four-corner polygon
3. Places one or more trees and configures their properties
4. Runs a full-year hourly shading simulation
5. Reviews annual, monthly, hourly, per-tree, and map-based shading outputs

The primary product metric is irradiance-weighted shading percentage. Raw hours shaded is shown as secondary context only.

## 2. Primary Use Case

This app is designed for cases like:

- a homeowner deciding where to plant trees near existing solar panels
- a solar installer assessing future vegetation risk
- a property owner comparing planting locations around a roof with panels

Core question:

"How much annual solar impact will these trees cause, and where can I place them to minimize it?"

## 3. v1 Scope

### In Scope

- Satellite-map-based site setup
- Address search
- One panel footprint per scenario
- Multiple trees per scenario
- Full-year hourly analysis
- Irradiance-weighted and raw shading metrics
- Monthly chart
- Hour-by-day or hour-by-year heatmap
- Per-tree breakdown
- Planting-impact heatmap around the array
- Export/import as JSON

### Out of Scope

- kWh loss or dollar loss estimates
- panel stringing, bypass diodes, or electrical behavior
- terrain modeling
- cloud-cover modeling
- buildings, poles, fences, and other non-tree obstructions
- multi-array projects
- user accounts or backend persistence

## 4. Architecture

### High-Level Stack

- Frontend: React custom component
- Map: Google Maps JavaScript API
- Python host: Streamlit
- Simulation: Python modules
- Charts: Plotly serialized from Python and rendered in React

Architecture boundary:

- the entire interactive product UI lives inside the React custom component iframe
- this includes the left sidebar, map canvas, floating results card, address search, tilt input, tree controls, and Run Analysis action
- do not implement the main product controls with `st.sidebar` or other Streamlit-native widgets
- Streamlit acts as the Python host, state bridge, and deployment shell only

### Major Files

```text
frontend/src/SolarShadowApp.jsx
solar.py
geometry.py
panels.py
scenario.py
analysis.py
app.py
```

### Streamlit Bridge Rules

- The custom Streamlit component is declared once
- The component is called once
- The component sends data to Python only when the user explicitly requests analysis
- Python stores results and UI-returned state in `st.session_state`
- Python reruns the app to push updated props back into the component
- Each analysis request must carry a unique request id so reruns can distinguish a new Run Analysis click from a passive rerun caused by polling or state refresh

This pattern is mandatory. Do not implement two separate component calls.

## 5. Core UX Decisions

### 5.1 Panel Input

The user does not draw an axis-aligned `google.maps.Rectangle`.

Instead, the user creates a single four-corner polygon representing the roof face or panel footprint. The polygon may be rotated relative to north. This is required so panel azimuth can be derived from the traced geometry.

Implementation guidance:

- Use a polygon overlay, not an axis-aligned rectangle bounds object
- Constrain the interaction to one quadrilateral footprint in v1
- Allow dragging/editing of vertices after creation
- Treat the footprint as one planar roof face

Corner ordering requirement:

- the frontend must store the four panel corners in clockwise order
- the first edge, `corner[0] -> corner[1]`, must represent one of the long roof edges whenever possible
- backend geometry should not assume north-up or axis alignment
- if the drawn/editable polygon arrives in a different order, normalize it before azimuth calculation

Azimuth role in v1:

- `panel_azimuth_deg` is informational metadata in v1
- it is shown in the UI and returned in results
- it is not used in the v1 shading intersection math

### 5.2 Tree Input

Each tree has:

- `id`
- `name`
- `lat`
- `lon`
- `height_m`
- `canopy_radius_m`
- `shape` in `["cylinder", "cone"]`
- `deciduous` as boolean

### 5.3 Results

The app shows:

- annual irradiance-weighted shading percent
- annual raw-hours shaded percent
- monthly shading comparison
- hourly heatmap
- per-tree comparison
- planting-impact heatmap on the map

### 5.4 Tilt Handling In v1

`panel_tilt_deg` is a required user input in v1, but it does not change the shadow intersection geometry in the v1 model.

For v1, shading is computed against the traced roof-face footprint in plan view. Tilt is collected, validated, stored, and exported so the product can preserve a realistic panel configuration and remain forward-compatible with a later 3D-aware shading model.

Implications for implementation:

- validate that tilt is present and greater than zero
- include tilt in exported and imported config
- pass tilt through `run_scenario(...)`
- do not invent extra projection math based on tilt in v1

### 5.5 Year Handling In v1

`year` is not a user-facing control in v1.

Rules:

- new sessions default to year `2025`
- year is preserved in exported configs
- importing a config restores its year
- after import, subsequent analysis runs should use the imported year unless the implementation later adds an explicit year control

## 6. Layout And Interaction

### 6.1 Overall Layout

- full viewport application
- left sidebar for inputs and configuration
- map canvas as the primary visual surface
- floating results card over the map after analysis

### 6.2 Sidebar Sections

Sidebar sections:

- Panel Array
- Trees
- Config

The Run Analysis button remains visible at the bottom of the sidebar.

### 6.3 Panel Workflow

1. User searches an address or manually navigates the map
2. User activates the panel tool
3. User draws a four-corner footprint over the roof face
4. App stores the four GPS corners
5. App immediately computes and displays:
   - azimuth
   - area
   - approximate dimensions
6. User may edit the polygon after creation
7. Only one panel footprint exists at a time in v1

### 6.4 Tree Workflow

Preferred flow:

1. User activates the tree-placement tool
2. User clicks the map
3. A pending tree form opens with default values
4. User confirms or cancels
5. Confirmed trees become persistent markers and cards in the sidebar
6. Trees can be expanded and edited inline
7. Marker position updates when coordinates change

Tree defaults:

- name: auto-incremented, for example `Tree 1`
- height: `10.0`
- canopy radius: `3.0`
- shape: `cylinder`
- deciduous: `false`

### 6.5 Error Behavior

Errors are shown inline, not as browser alerts or modal dialogs.

Required error cases:

- no panel footprint when Run Analysis is clicked
- missing tilt
- non-positive tilt
- invalid imported JSON
- imported JSON missing required fields
- Python simulation failure

No-trees is a warning, not a blocker. The app may still run and return zero shading.

## 7. Design Direction

The UI should feel like a clean, professional spatial analysis tool.

Required characteristics:

- light mode
- restrained visual language
- map-first layout
- minimal chrome
- clear visual priority on the map and results

Suggested tokens:

- background: white and light gray neutrals
- primary accent: warm solar amber
- danger: red
- success: green

Typography should be simple and highly legible. Inter is acceptable for v1.

## 8. Python Module Contracts

### 8.1 `solar.py`

Purpose:

Generate a daylight-only hourly time series for a full year at a given location.

Function:

```python
def get_solar_timeseries(lat: float, lon: float, timezone: str, year: int) -> pd.DataFrame:
```

Columns:

- `datetime`
- `solar_azimuth`
- `solar_elevation`
- `dni`
- `ghi`
- `irradiance_weight`

Rules:

- `irradiance_weight` must sum to `1.0`
- Use clear-sky irradiance
- Use a caller-provided explicit year

Implementation note:

Use an explicit year everywhere in the app instead of "current year" defaults. This avoids ambiguous 365 vs 366 behavior and makes validation deterministic.

### 8.2 `geometry.py`

Purpose:

- GPS to local-meter conversion
- local-meter to GPS conversion
- tree shadow geometry

Functions:

```python
def gps_to_local(lat: float, lon: float, origin_lat: float, origin_lon: float) -> tuple[float, float]:
    ...

def local_to_gps(x: float, y: float, origin_lat: float, origin_lon: float) -> tuple[float, float]:
    ...

def compute_shadow_polygon(
    tree: dict,
    solar_azimuth_deg: float,
    solar_elevation_deg: float,
    origin_lat: float,
    origin_lon: float,
    date: datetime.date,
) -> Polygon | None:
    ...
```

Rules:

- return `None` when sun elevation is not above the horizon
- return `None` for deciduous trees during leaf-off season
- support `cylinder` and `cone`

Leaf-off simplification for v1:

- leaf-off: October 15 through March 14
- leaf-on: March 15 through October 14

Cone approximation for v1:

- model the cone shadow as the convex hull of:
  - the canopy base footprint at ground level, centered at the tree location
  - the projected shadow tip of the canopy apex
- this is an approximation, not a physically exact volumetric projection
- consistency and stability matter more than perfect realism in v1

### 8.3 `panels.py`

Purpose:

- convert footprint GPS corners to a local-meter polygon
- compute azimuth
- compute panel area and dimensions
- compute shade overlap fraction

Functions:

```python
def calculate_azimuth(corners: list[tuple[float, float]]) -> float:
    ...

def build_panel_polygon(
    corners: list[tuple[float, float]],
    origin_lat: float,
    origin_lon: float,
) -> tuple[Polygon, float, float, float]:
    ...

def shade_fraction(panel_polygon: Polygon, shadow_polygon: Polygon | None) -> float:
    ...
```

Rules:

- input footprint is exactly four corners in order
- azimuth is derived from the traced roof-face geometry
- return values must include azimuth, width, and height
- return tuple order is `(polygon, azimuth_deg, width_m, height_m)`

Azimuth convention for v1:

- inside `calculate_azimuth(corners)`, convert GPS corners to local-meter coordinates using `corners[0]` as the temporary local origin
- this temporary origin choice is acceptable because the panel footprint is small and only relative edge geometry matters
- compute all four edge lengths in local-meter coordinates
- identify the pair of opposite longer edges as the roof-length direction
- compute the bearing of that long-axis direction
- panel azimuth is perpendicular to that long axis
- because a roof polygon alone does not encode uphill vs downhill, choose the perpendicular candidate in the half-open southern semicircle `(90 deg, 270 deg]`
- if the candidates are exactly `90 deg` and `270 deg`, return `270 deg` as the deterministic v1 tie-break

This convention is intentionally opinionated so the Glen Ellen validation case remains deterministic. It is a heuristic for v1, not a full physical roof-orientation inference system.

### 8.4 `scenario.py`

Purpose:

Run annual shading simulations and build the planting-impact heatmap dataset.

Functions:

```python
def run_scenario(
    panel_corners: list[tuple[float, float]],
    panel_tilt_deg: float,
    trees: list[dict],
    timezone: str | None = None,
    year: int = 2025,
) -> dict:
    ...

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
    ...
```

Rules:

- validate required inputs and raise `ValueError` for invalid panel or tilt data
- union all tree shadows per timestep before intersecting with the panel polygon
- compute per-tree results by running each tree in isolation
- use explicit year values for repeatable results
- if `timezone` is omitted, infer it from the panel centroid using `timezonefinder`
- compute the solar timeseries once per heatmap run and reuse it across all grid points
- do not naively call `run_scenario(...)` end-to-end for every heatmap point if that would recompute the same annual solar data repeatedly

#### Main Results Schema

```python
{
    "annual_shade_pct_raw": float,
    "annual_shade_pct_irradiance": float,
    "monthly": [
        {
            "month": int,
            "month_name": str,
            "shade_pct_raw": float,
            "shade_pct_irradiance": float,
        }
    ],
    "hourly_heatmap": {
        "z": list[list[float | None]],
        "x_labels": list[str],
        "y_labels": list[str],
    },
    "per_tree": [
        {
            "id": str,
            "name": str,
            "shade_pct_raw": float,
            "shade_pct_irradiance": float,
        }
    ],
    "panel_azimuth_deg": float,
    "panel_area_m2": float,
    "panel_centroid": {"lat": float, "lon": float},
    "total_daylight_hours": int,
}
```

#### Hourly Heatmap Shape

The hourly heatmap must not assume 365 columns.

- rows: 24 hours
- columns: one per day in the requested year
- 365 columns for non-leap years
- 366 columns for leap years

`x_labels` format:

- use calendar-date strings in `Mon D` format, for example `Jan 1`, `Jan 2`, `Feb 1`
- length must match the number of day columns in the requested year
- `y_labels` should use hour labels suitable for display, for example `12am`, `1am`, ..., `11pm`

Nighttime cells:

- represent non-daylight cells as `None` in Python and `null` in serialized JSON
- the chart should render these cells as blank, not as zero shading
- daylight cells should contain shade fraction values between `0.0` and `1.0`

#### Planting-Impact Heatmap

The planting-impact heatmap answers:

"If I placed a single representative tree at this location, what irradiance-weighted annual shading would it cause?"

Grid defaults:

- 40 x 40 points
- 2 meter spacing
- centered on the panel centroid

Representative tree inputs:

- mean user tree height and canopy radius when trees exist
- otherwise defaults of `10m` height and `3m` canopy radius
- representative tree shape is always `cylinder` in v1
- representative tree deciduous behavior is always `False` in v1, so the planting-impact heatmap models an evergreen tree
- this keeps the heatmap comparable and avoids seasonal discontinuities from mixed leaf-off logic

`run_heatmap_grid(...)` output schema:

```python
[
    {
        "lat": float,
        "lon": float,
        "shade_pct": float,
    }
]
```

### 8.5 `analysis.py`

Purpose:

Generate JSON-serializable Plotly figure dicts from scenario output.

Function:

```python
def generate_charts(results: dict) -> dict:
    ...
```

Returns:

```python
{
    "monthly": plotly_figure_dict,
    "hourly": plotly_figure_dict,
    "per_tree": plotly_figure_dict,
}
```

Required charts:

- monthly grouped bar chart
- hourly heatmap
- per-tree horizontal bar chart

### 8.6 `app.py`

Purpose:

Host the Streamlit app, bridge the custom component, and coordinate simulation state.

Requirements:

- load `GOOGLE_MAPS_API_KEY` from environment
- call `st.set_page_config(layout="wide")`
- declare the component once
- call the component once
- store results, charts, errors, and heatmap state in `st.session_state`
- rerun after new state is available
- track the last processed analysis request id in `st.session_state`
- only execute a new main simulation when the incoming request id differs from the last processed one
- do not re-run the main scenario during passive reruns used for heatmap polling
- declare the component with the built frontend path, for example `path="frontend/build"` in v1
- suppress default Streamlit header, menu, and footer chrome with CSS injection so the deployed app reads as a full-screen spatial tool rather than a stock Streamlit page

## 9. Frontend Component Contract

### Props From Python

```javascript
{
  google_maps_api_key: string,
  results: object | null,
  charts: object | null,
  heatmap_grid: Array<{lat: number, lon: number, shade_pct: number}> | null,
  heatmap_status: "idle" | "running" | "complete" | "error",
  last_processed_request_id: string | null,
  error: string | null,
}
```

### Values Sent To Python

```javascript
{
  run_analysis: true,
  analysis_request_id: string,
  year: number,
  panel_corners: [[lat, lon], [lat, lon], [lat, lon], [lat, lon]],
  panel_tilt_deg: number | null,
  trees: Array<object>,
}
```

The component should call `Streamlit.setComponentValue(...)` only when the user explicitly clicks Run Analysis, and each click must generate a fresh `analysis_request_id`.

The `year` sent to Python should be:

- `2025` for new v1 sessions
- the imported config year after a config import

Iframe layout requirement for Streamlit component v1:

- the React component must set its iframe height to the viewport height on load
- it must also update the iframe height on window resize
- use the Streamlit component API to keep the iframe sized for a full-screen app

Frontend bridge dependency for Streamlit component v1:

- include `streamlit-component-lib` in `frontend/package.json`
- use it to access `Streamlit.setComponentValue(...)`, `Streamlit.setFrameHeight(...)`, and readiness wiring for the v1 iframe component

## 10. Google Maps Requirements

Required Google capabilities:

- Maps JavaScript API base map
- Places library loaded with `google.maps.importLibrary("places")`

Preferred modern Google approach:

- use `google.maps.places.PlaceAutocompleteElement` for address search in the React UI
- load it from `google.maps.importLibrary("places")`
- do not base the build on deprecated `SearchBox`, deprecated legacy `Autocomplete`, or deprecated `PlacesService` for a new project

Deprecation constraints for new builds:

- do not depend on deprecated `google.maps.drawing.DrawingManager` for panel drawing
- do not depend on deprecated `google.maps.visualization.HeatmapLayer` for the planting-impact heatmap

Implementation guidance:

- use `google.maps.Polygon` directly for the panel footprint
- implement the 4-click creation flow manually
- after creation, use `google.maps.Polygon` editing support for vertex manipulation rather than building custom vertex-drag behavior from scratch
- implement the planting-impact heatmap with a non-deprecated overlay approach, for example deck.gl or a custom canvas/WebGL overlay
- tree markers may use current recommended Google marker primitives

Required map capabilities:

- satellite base map
- address search
- polygon drawing/editing for the panel footprint
- tree markers
- heatmap overlay

## 11. Export/Import Contract

### Exported JSON

```json
{
  "version": "1.0.0",
  "year": 2025,
  "panelCorners": [[0, 0], [0, 0], [0, 0], [0, 0]],
  "panelTiltDeg": 22,
  "trees": [],
  "exportedAt": "2025-01-01T00:00:00Z"
}
```

Required fields:

- `version`
- `year`
- `panelCorners`
- `panelTiltDeg`
- `trees`

Import behavior:

- importing a config restores the scenario year as well as panel corners, tilt, and trees
- after import, a subsequent Run Analysis should use the imported year unless the user explicitly changes it

## 12. Heatmap Execution Requirement

Main analysis results must appear before the planting-impact heatmap finishes.

This is a hard product requirement for v1.

Acceptable implementation strategies:

- a background thread or executor polled via Streamlit reruns
- a follow-up non-blocking task tracked in session state

Recommended Streamlit pattern:

1. Run the main scenario synchronously when the user clicks Run Analysis
2. Store main results and charts in `st.session_state`
3. Start the heatmap computation in a background worker using plain Python objects outside `st.session_state`
4. Store only lightweight job metadata in `st.session_state`, such as job id and status
5. On subsequent reruns, poll for completion and move completed heatmap data into `st.session_state`
6. Do not mutate `st.session_state` directly from the worker thread or process
7. Do not wait for the full heatmap before first rendering the main results
8. Use the stored last-processed request id to avoid re-running the main scenario during polling reruns
9. While `heatmap_status == "running"`, trigger a short polling rerun cycle from the main script, for example a brief sleep followed by `st.rerun()`

Not acceptable:

- computing the full heatmap synchronously before showing results

The UI should show a subtle "Computing heatmap..." state while the grid is in progress.

Rendering guidance:

- keep raw `shade_pct` values in the returned heatmap dataset
- normalize heatmap render weights on the frontend for visual readability
- if all returned `shade_pct` values are zero, render no intensity overlay
- if using a weighted heatmap layer, normalize each displayed weight relative to the maximum returned `shade_pct` in the current dataset

## 13. Packaging And Deployment

### Docker Build Requirement

The production container must include the built React frontend assets as well as the Python app.

Required container strategy:

- use a multi-stage Docker build
- in the frontend stage, install Node dependencies and run the frontend production build
- in the runtime stage, install Python dependencies and copy the built frontend assets into the app image
- the built frontend directory must match the Streamlit component declaration path used by `app.py`

Frontend build path requirement:

- the production frontend output directory must be `frontend/build`
- if using a tool that defaults to a different output directory, configure it to emit `build`

Recommended structure:

1. Node build stage:
   - copy `frontend/package.json` and lockfile
   - install dependencies
   - copy frontend source
   - run `npm run build`
2. Python runtime stage:
   - install Python dependencies from `requirements.txt`
   - copy Python source files
   - copy the built frontend output into `frontend/build`

### Cloud Run Runtime Requirement

The deployed container must listen on `0.0.0.0:$PORT`.

For Cloud Run:

- do not rely on Streamlit defaults
- start Streamlit with a command equivalent to:

```bash
streamlit run app.py --server.port=${PORT} --server.address=0.0.0.0 --server.headless=true
```

### Local Frontend Development Requirement

The app should support a fast local development loop without rebuilding the production bundle on every frontend change.

Required development mode behavior:

- support a development component declaration that points to `http://localhost:3001`
- support a production component declaration that points to `frontend/build`
- switch between them with an explicit environment variable or equivalent configuration
- the frontend dev server should run on port `3001`

### Google Cloud Enablement

Before deployment, enable:

- Maps JavaScript API
- Places API (New)

## 14. Deterministic Build Guidance

To make the build repeatable for another coding agent:

- use year `2025` by default across the app and tests
- keep all internal geometry in local-meter coordinates
- convert GPS only at input and output boundaries
- avoid circular imports
- keep modules independently testable

## 15. Validation Targets

### Solar

At lat `38.38`, lon `-122.55`, timezone `America/Los_Angeles`:

- June 21 solar noon elevation should be about `75` degrees
- December 21 solar noon elevation should be about `28` degrees

### Geometry

For a `10m` tree `20m` north of origin:

- winter shadow should be much longer than summer shadow
- winter shadow area should be several times larger than summer
- for equal height and canopy radius under the same sun position, a `cone` tree should produce a smaller shadowed area than a `cylinder` tree

### Panels

For the Glen Ellen footprint:

- azimuth should be about `165.5` degrees
- area should be about `34.7 m2`

### Scenario

For the provided two-tree example:

- irradiance-weighted shading should be lower than raw-hours shading
- the deciduous tree should contribute less annual impact than the evergreen tree

## 16. Open Implementation Inputs

These are not blockers for development, but they are still placeholders:

- GitHub repository URL
- Google Cloud project ID
- production Google Maps API key
- final Cloud Run deployment domain

## 17. Definition Of Done For v1

The build is complete when a user can:

1. open the app
2. search to a location
3. trace a four-corner panel footprint on the map
4. enter tilt
5. place and edit trees
6. run analysis
7. review annual, monthly, hourly, per-tree, and map heatmap outputs
8. export a config
9. reload and import that config successfully

# Solar Shadow Study

Solar Shadow Study is a map-first web application for modeling how nearby trees reduce solar production on a panel array over the course of a year.

Users trace a solar panel footprint directly on satellite imagery, place trees, and run a full-year hourly simulation. The primary output is an irradiance-weighted shading percentage, which estimates true energy impact rather than simply counting shaded hours.

## Repository Status

This repository currently contains the product and build documentation for the app:

- [`SPEC.md`](./SPEC.md) is the authoritative technical specification
- [`CLAUDE_CODE_KICKOFF.md`](./CLAUDE_CODE_KICKOFF.md) is the agent-ready implementation brief

This is a spec-first repo. The application code described below is the intended target structure, not the current contents of the repository.

## What The App Does

- Trace a single roof-face or panel-array footprint on satellite imagery using a four-corner polygon tool
- Search any address to navigate the map anywhere in the world
- Place trees on the map and configure name, height, canopy radius, canopy shape, and deciduous or evergreen behavior
- Run a full-year hourly shading simulation using real solar position data and irradiance weighting
- Show annual, monthly, hourly, and per-tree shading metrics
- Render a planting-impact heatmap over the map
- Export and import site configurations as JSON

## Core Product Idea

The app answers a practical question:

How much will one or more nearby trees reduce solar production over a year, and where can trees be placed to minimize that impact?

The key idea is that not all shadows matter equally. A shadow at noon in summer is much more damaging than a shadow at dawn in winter, so the app emphasizes irradiance-weighted shading as the main metric throughout the product.

## Intended Architecture

The planned build uses:

- React for the full map-centric UI
- Google Maps JavaScript API for satellite imagery, drawing, search, markers, and heatmap rendering
- Streamlit as the Python host and custom component bridge
- Python modules for solar position, geometry, simulation, and chart generation
- Plotly for monthly, hourly, and per-tree visualizations

The intended UI architecture is a single React app mounted as a Streamlit custom component. The sidebar, map, and floating results panel all live inside that React surface; Streamlit is the host shell and Python backend, not the main UI layer.

## Intended Project Structure

```text
solar-shadow-study/
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       └── SolarShadowApp.jsx
├── solar.py
├── geometry.py
├── panels.py
├── scenario.py
├── analysis.py
├── app.py
├── requirements.txt
├── Dockerfile
├── .gitignore
├── README.md
├── SPEC.md
└── CLAUDE_CODE_KICKOFF.md
```

## Before Building

Read [`SPEC.md`](./SPEC.md) first. It defines:

- the product scope
- the UX flows
- the module interfaces
- the result schemas
- the validation targets
- the deployment expectations

Then use [`CLAUDE_CODE_KICKOFF.md`](./CLAUDE_CODE_KICKOFF.md) as the working implementation brief for the coding agent.

## Open Inputs Still Needed Before Production

- Real GitHub repository URL
- Real Google Cloud project ID
- Provisioned Google Maps API key
- Domain restrictions for the production Maps API key
- Google Cloud enablement for both Maps JavaScript API and Places API (New)

## Notes On Scope

Current scope intentionally excludes:

- converting shading loss to kWh or dollars
- modeling bypass diodes or panel-string electrical behavior
- non-tree obstructions such as buildings or fences
- cloud-cover modeling

The target v1 treats the panel area as a single planar polygon and focuses on shading geometry plus irradiance-weighted impact.

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Streamlit, withStreamlitConnection } from "streamlit-component-lib";

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  root: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: "#1e293b",
    background: "#f8fafc",
  },
  sidebar: {
    width: 300,
    minWidth: 280,
    maxWidth: 320,
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 10,
  },
  sidebarHeader: {
    padding: "14px 16px 10px",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 600,
    fontSize: 15,
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  sidebarScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 14px",
  },
  sidebarFooter: {
    padding: "12px 14px",
    borderTop: "1px solid #e2e8f0",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "#64748b",
    marginBottom: 8,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    transition: "background 0.12s",
  },
  btnPrimary: {
    background: "#f59e0b",
    color: "#fff",
    width: "100%",
    padding: "10px 14px",
    fontSize: 14,
  },
  btnSecondary: {
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #e2e8f0",
  },
  btnActive: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  btnDanger: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
  },
  input: {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 5,
    fontFamily: "inherit",
    fontSize: 13,
    color: "#1e293b",
    background: "#fff",
    outline: "none",
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 500,
    color: "#64748b",
    marginBottom: 4,
  },
  row: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  treeCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    marginBottom: 8,
    overflow: "hidden",
  },
  treeCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    cursor: "pointer",
    userSelect: "none",
  },
  treeCardBody: {
    padding: "10px 10px 12px",
    borderTop: "1px solid #e2e8f0",
    background: "#fff",
  },
  metaTag: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    borderRadius: 4,
    padding: "2px 7px",
    fontSize: 11,
    fontWeight: 500,
    marginRight: 4,
  },
  errorBox: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 12,
    marginBottom: 10,
  },
  infoBox: {
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    color: "#0c4a6e",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 12,
    marginBottom: 10,
  },
  resultsPanel: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 360,
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
    zIndex: 20,
    padding: 16,
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: 12,
    gap: 0,
  },
  tab: {
    padding: "6px 12px",
    cursor: "pointer",
    border: "none",
    background: "none",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 500,
    color: "#64748b",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    color: "#f59e0b",
    borderBottom: "2px solid #f59e0b",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    background: "#fef9f0",
    border: "1px solid #fcd34d",
    borderRadius: 7,
    padding: "10px 12px",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#78350f",
  },
  statUnit: {
    fontSize: 11,
    color: "#a16207",
  },
  panelMeta: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: "8px 10px",
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 1.7,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function genId() {
  return "id-" + Math.random().toString(36).slice(2, 10);
}

function ensureClockwise(corners) {
  // Shoelace formula sign
  let area = 0;
  const n = corners.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = corners[i];
    const [x1, y1] = corners[(i + 1) % n];
    area += x0 * y1 - x1 * y0;
  }
  // area > 0 → CCW in lat/lon space → reverse
  if (area > 0) return [...corners].reverse();
  return corners;
}

// ── Main Component ───────────────────────────────────────────────────────────
function SolarShadowApp({ args }) {
  const {
    google_maps_api_key: apiKey = "",
    results = null,
    charts = null,
    heatmap_grid: heatmapGrid = null,
    heatmap_status: heatmapStatus = "idle",
    last_processed_request_id: lastProcessedId = null,
    error: serverError = null,
  } = args || {};

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonRef = useRef(null);
  const pendingCornersRef = useRef([]);
  const pendingMarkersRef = useRef([]);
  const treeMarkersRef = useRef({});
  const heatmapOverlayRef = useRef(null);
  const searchContainerRef = useRef(null);
  const canvasOverlayRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | drawPanel | placeTree
  const [panelCorners, setPanelCorners] = useState(null);
  const [panelTilt, setPanelTilt] = useState("22");
  const [trees, setTrees] = useState([]);
  const [expandedTree, setExpandedTree] = useState(null);
  const [pendingTree, setPendingTree] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [activeTab, setActiveTab] = useState("monthly");
  const [year] = useState(2025);
  const [importError, setImportError] = useState(null);

  // Set iframe height
  useEffect(() => {
    const setHeight = () => Streamlit.setFrameHeight(window.innerHeight);
    setHeight();
    window.addEventListener("resize", setHeight);
    Streamlit.setComponentReady();
    return () => window.removeEventListener("resize", setHeight);
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (!apiKey || window._googleMapsLoading) return;
    if (window.google?.maps) { setMapLoaded(true); return; }
    window._googleMapsLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=marker`;
    script.async = true;
    script.onload = () => { window._googleMapsLoading = false; setMapLoaded(true); };
    document.head.appendChild(script);
  }, [apiKey]);

  // Init map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 38.384, lng: -122.552 },
      zoom: 19,
      mapTypeId: "satellite",
      tilt: 0,
      disableDefaultUI: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Place autocomplete
    if (searchContainerRef.current) {
      window.google.maps.importLibrary("places").then(({ PlaceAutocompleteElement }) => {
        const ac = new PlaceAutocompleteElement();
        ac.style.width = "100%";
        searchContainerRef.current.appendChild(ac);
        ac.addEventListener("gmp-placeselect", (e) => {
          const place = e.place;
          place.fetchFields({ fields: ["geometry"] }).then(() => {
            if (place.geometry?.location) {
              map.panTo(place.geometry.location);
              map.setZoom(19);
            }
          });
        });
      });
    }
  }, [mapLoaded]);

  // Map click handler
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const listener = map.addListener("click", (e) => {
      const { latLng } = e;
      const lat = latLng.lat(), lng = latLng.lng();

      if (mode === "drawPanel") {
        const corners = [...pendingCornersRef.current, [lat, lng]];
        pendingCornersRef.current = corners;

        // Add click marker
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: "#f59e0b",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });
        pendingMarkersRef.current.push(marker);

        if (corners.length === 4) {
          // Clear click markers
          pendingMarkersRef.current.forEach((m) => m.setMap(null));
          pendingMarkersRef.current = [];
          pendingCornersRef.current = [];

          const ordered = ensureClockwise(corners);
          setPanelCorners(ordered);
          drawPolygon(ordered, map);
          setMode("idle");
        }
      } else if (mode === "placeTree") {
        setPendingTree({
          id: genId(),
          name: `Tree ${trees.length + 1}`,
          lat,
          lon: lng,
          height_m: 10,
          canopy_radius_m: 3,
          shape: "cylinder",
          deciduous: false,
        });
        setMode("idle");
      }
    });
    return () => window.google.maps.event.removeListener(listener);
  }, [mapLoaded, mode, trees.length]);

  function drawPolygon(corners, map) {
    if (polygonRef.current) polygonRef.current.setMap(null);
    const path = corners.map(([lat, lng]) => ({ lat, lng }));
    const poly = new window.google.maps.Polygon({
      paths: path,
      strokeColor: "#f59e0b",
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: "#fef9c3",
      fillOpacity: 0.35,
      editable: true,
      draggable: false,
      map,
    });
    polygonRef.current = poly;

    // Update corners on edit
    const updateCorners = () => {
      const pts = poly.getPath().getArray().map((p) => [p.lat(), p.lng()]);
      setPanelCorners(ensureClockwise(pts));
    };
    window.google.maps.event.addListener(poly.getPath(), "set_at", updateCorners);
    window.google.maps.event.addListener(poly.getPath(), "insert_at", updateCorners);
  }

  // Sync tree markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentIds = new Set(trees.map((t) => t.id));

    // Remove deleted
    Object.entries(treeMarkersRef.current).forEach(([id, m]) => {
      if (!currentIds.has(id)) { m.setMap(null); delete treeMarkersRef.current[id]; }
    });
    // Add/update
    trees.forEach((tree) => {
      if (treeMarkersRef.current[tree.id]) {
        treeMarkersRef.current[tree.id].setPosition({ lat: tree.lat, lng: tree.lon });
      } else {
        const marker = new window.google.maps.Marker({
          position: { lat: tree.lat, lng: tree.lon },
          map,
          title: tree.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: tree.deciduous ? "#86efac" : "#166534",
            fillOpacity: 0.9,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });
        treeMarkersRef.current[tree.id] = marker;
      }
    });
  }, [trees, mapLoaded]);

  // Render planting-impact heatmap via custom OverlayView canvas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    // Remove previous overlay
    if (canvasOverlayRef.current) {
      canvasOverlayRef.current.setMap(null);
      canvasOverlayRef.current = null;
    }
    if (!heatmapGrid || heatmapGrid.length === 0) return;

    const maxShade = Math.max(...heatmapGrid.map((p) => p.shade_pct), 0.001);
    if (maxShade === 0) return;

    // Heat colour ramp: yellow → orange → red
    function heatColor(t) {
      // t in [0,1]
      const stops = [
        [254, 240, 217, 0],
        [253, 187, 132, 100],
        [252, 141, 89, 160],
        [227, 74, 51, 200],
        [179, 0, 0, 220],
      ];
      const idx = Math.min(Math.floor(t * (stops.length - 1)), stops.length - 2);
      const frac = t * (stops.length - 1) - idx;
      const a = stops[idx], b = stops[idx + 1];
      return [
        Math.round(a[0] + frac * (b[0] - a[0])),
        Math.round(a[1] + frac * (b[1] - a[1])),
        Math.round(a[2] + frac * (b[2] - a[2])),
        Math.round(a[3] + frac * (b[3] - a[3])),
      ];
    }

    class HeatOverlay extends window.google.maps.OverlayView {
      constructor(data, max) { super(); this.data = data; this.max = max; }
      onAdd() {
        this.canvas = document.createElement("canvas");
        this.canvas.style.position = "absolute";
        this.getPanes().overlayLayer.appendChild(this.canvas);
      }
      draw() {
        const proj = this.getProjection();
        if (!proj) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const pts = this.data.map((d) => {
          const p = proj.fromLatLngToDivPixel(new window.google.maps.LatLng(d.lat, d.lon));
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
          return { x: p.x, y: p.y, v: d.shade_pct };
        });
        const pad = 30;
        const W = maxX - minX + pad * 2, H = maxY - minY + pad * 2;
        this.canvas.width = Math.max(1, Math.round(W));
        this.canvas.height = Math.max(1, Math.round(H));
        this.canvas.style.left = (minX - pad) + "px";
        this.canvas.style.top = (minY - pad) + "px";
        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const p of pts) {
          const t = Math.min(p.v / this.max, 1);
          if (t < 0.01) continue;
          const [r, g, b, a] = heatColor(t);
          ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
          ctx.beginPath();
          ctx.arc(p.x - minX + pad, p.y - minY + pad, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      onRemove() { if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas); }
    }

    const overlay = new HeatOverlay(heatmapGrid, maxShade);
    overlay.setMap(map);
    canvasOverlayRef.current = overlay;
  }, [heatmapGrid]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function startDrawPanel() {
    if (polygonRef.current) polygonRef.current.setMap(null);
    setPanelCorners(null);
    pendingCornersRef.current = [];
    pendingMarkersRef.current.forEach((m) => m.setMap(null));
    pendingMarkersRef.current = [];
    setMode("drawPanel");
  }

  function startPlaceTree() {
    setMode("placeTree");
  }

  function cancelMode() {
    setMode("idle");
    pendingCornersRef.current = [];
    pendingMarkersRef.current.forEach((m) => m.setMap(null));
    pendingMarkersRef.current = [];
  }

  function confirmPendingTree() {
    if (!pendingTree) return;
    setTrees((prev) => [...prev, pendingTree]);
    setPendingTree(null);
  }

  function deleteTree(id) {
    setTrees((prev) => prev.filter((t) => t.id !== id));
    if (treeMarkersRef.current[id]) {
      treeMarkersRef.current[id].setMap(null);
      delete treeMarkersRef.current[id];
    }
  }

  function updateTree(id, field, value) {
    setTrees((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function runAnalysis() {
    setValidationError(null);
    if (!panelCorners) {
      setValidationError("Draw a panel footprint first.");
      return;
    }
    const tilt = parseFloat(panelTilt);
    if (!panelTilt || isNaN(tilt) || tilt <= 0) {
      setValidationError("Panel tilt must be a positive number.");
      return;
    }
    Streamlit.setComponentValue({
      run_analysis: true,
      analysis_request_id: genId(),
      year,
      panel_corners: panelCorners,
      panel_tilt_deg: tilt,
      trees,
    });
  }

  function exportConfig() {
    const config = {
      version: "1.0.0",
      year,
      panelCorners: panelCorners || [],
      panelTiltDeg: parseFloat(panelTilt) || 22,
      trees,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solar-shadow-config.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importConfig(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target.result);
        const required = ["version", "panelCorners", "panelTiltDeg", "trees"];
        for (const f of required) {
          if (!(f in cfg)) throw new Error(`Missing field: ${f}`);
        }
        if (!Array.isArray(cfg.panelCorners) || cfg.panelCorners.length !== 4) {
          throw new Error("panelCorners must be an array of 4 corners");
        }
        const corners = ensureClockwise(cfg.panelCorners);
        setPanelCorners(corners);
        if (mapInstanceRef.current) drawPolygon(corners, mapInstanceRef.current);
        setPanelTilt(String(cfg.panelTiltDeg));
        setTrees(cfg.trees || []);
        setImportError(null);
      } catch (err) {
        setImportError("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Chart rendering ───────────────────────────────────────────────────────
  function renderChart(figJson) {
    if (!figJson) return null;
    return (
      <PlotlyEmbed figJson={figJson} key={figJson.slice(0, 40)} />
    );
  }

  // ── Panel metadata ────────────────────────────────────────────────────────
  const panelMeta = results
    ? {
        azimuth: results.panel_azimuth_deg?.toFixed(1),
        area: results.panel_area_m2?.toFixed(1),
      }
    : null;

  const modeLabel =
    mode === "drawPanel"
      ? `Click 4 corners… (${pendingCornersRef.current?.length ?? 0}/4)`
      : mode === "placeTree"
      ? "Click map to place tree…"
      : null;

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>☀ Solar Shadow Study</div>
        <div style={S.sidebarScroll}>
          {/* Address search */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Search Location</div>
            <div ref={searchContainerRef} style={{ width: "100%" }} />
          </div>

          {/* Panel Array */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Panel Array</div>
            {mode === "drawPanel" ? (
              <div>
                <div style={S.infoBox}>{modeLabel}</div>
                <button style={{ ...S.btn, ...S.btnDanger, width: "100%" }} onClick={cancelMode}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                style={{ ...S.btn, ...S.btnSecondary, width: "100%", marginBottom: 8 }}
                onClick={startDrawPanel}
              >
                {panelCorners ? "Redraw Panel" : "Draw Panel Footprint"}
              </button>
            )}
            {panelCorners && (
              <div style={{ marginBottom: 8 }}>
                <div style={S.panelMeta}>
                  {results ? (
                    <>
                      <div><b>Azimuth:</b> {results.panel_azimuth_deg?.toFixed(1)}°</div>
                      <div><b>Area:</b> {results.panel_area_m2?.toFixed(1)} m²</div>
                    </>
                  ) : (
                    <div style={{ color: "#64748b" }}>Panel drawn — run analysis to compute metrics</div>
                  )}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>Panel Tilt (°)</label>
              <input
                style={S.input}
                type="number"
                min="1"
                max="90"
                value={panelTilt}
                onChange={(e) => setPanelTilt(e.target.value)}
              />
            </div>
          </div>

          {/* Trees */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Trees</div>
            {mode === "placeTree" ? (
              <div>
                <div style={S.infoBox}>Click map to place a tree…</div>
                <button style={{ ...S.btn, ...S.btnDanger, width: "100%" }} onClick={cancelMode}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                style={{ ...S.btn, ...S.btnSecondary, width: "100%", marginBottom: 8 }}
                onClick={startPlaceTree}
              >
                + Place Tree
              </button>
            )}

            {pendingTree && (
              <PendingTreeForm
                tree={pendingTree}
                onChange={(f, v) => setPendingTree((t) => ({ ...t, [f]: v }))}
                onConfirm={confirmPendingTree}
                onCancel={() => setPendingTree(null)}
              />
            )}

            {trees.map((tree) => (
              <TreeCard
                key={tree.id}
                tree={tree}
                expanded={expandedTree === tree.id}
                onToggle={() => setExpandedTree((id) => (id === tree.id ? null : tree.id))}
                onChange={(f, v) => updateTree(tree.id, f, v)}
                onDelete={() => deleteTree(tree.id)}
              />
            ))}
          </div>

          {/* Config */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Config</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <button style={{ ...S.btn, ...S.btnSecondary, flex: 1 }} onClick={exportConfig}>
                Export
              </button>
              <label style={{ ...S.btn, ...S.btnSecondary, flex: 1, cursor: "pointer", justifyContent: "center" }}>
                Import
                <input type="file" accept=".json" style={{ display: "none" }} onChange={importConfig} />
              </label>
            </div>
            {importError && <div style={S.errorBox}>{importError}</div>}
          </div>
        </div>

        <div style={S.sidebarFooter}>
          {validationError && <div style={S.errorBox}>{validationError}</div>}
          {serverError && <div style={S.errorBox}>{serverError}</div>}
          <button
            style={{ ...S.btn, ...S.btnPrimary }}
            onClick={runAnalysis}
          >
            Run Analysis
          </button>
          {heatmapStatus === "running" && (
            <div style={{ ...S.infoBox, marginTop: 8, marginBottom: 0 }}>
              Computing planting-impact heatmap…
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={S.mapContainer}>
        {!apiKey && (
          <div style={{ ...S.infoBox, position: "absolute", top: 16, left: 16, zIndex: 50, maxWidth: 300 }}>
            Set GOOGLE_MAPS_API_KEY environment variable to enable the map.
          </div>
        )}
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* Results floating panel */}
        {results && (
          <div style={S.resultsPanel}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Analysis Results</div>

            <div style={S.statGrid}>
              <div style={S.statCard}>
                <div style={S.statLabel}>Irradiance-Weighted</div>
                <div style={S.statValue}>{results.annual_shade_pct_irradiance?.toFixed(1)}</div>
                <div style={S.statUnit}>% annual shading</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statLabel}>Raw Hours Shaded</div>
                <div style={S.statValue}>{results.annual_shade_pct_raw?.toFixed(1)}</div>
                <div style={S.statUnit}>% of daylight hours</div>
              </div>
            </div>

            <div style={S.panelMeta}>
              <span><b>Azimuth:</b> {results.panel_azimuth_deg?.toFixed(1)}° </span>
              <span><b>Area:</b> {results.panel_area_m2?.toFixed(1)} m² </span>
              <span><b>Year:</b> {year}</span>
            </div>

            <div style={S.tabs}>
              {["monthly", "hourly", "per_tree"].map((t) => (
                <button
                  key={t}
                  style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }}
                  onClick={() => setActiveTab(t)}
                >
                  {t === "per_tree" ? "Per Tree" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {charts && activeTab === "monthly" && renderChart(charts.monthly)}
            {charts && activeTab === "hourly" && renderChart(charts.hourly)}
            {charts && activeTab === "per_tree" && renderChart(charts.per_tree)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PendingTreeForm({ tree, onChange, onConfirm, onCancel }) {
  return (
    <div style={{ ...S.treeCard, borderColor: "#fcd34d", marginBottom: 10 }}>
      <div style={{ padding: "10px 10px 12px", background: "#fffbeb" }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: "#92400e" }}>New Tree</div>
        <label style={S.label}>Name</label>
        <input style={{ ...S.input, marginBottom: 6 }} value={tree.name}
          onChange={(e) => onChange("name", e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
          <div>
            <label style={S.label}>Height (m)</label>
            <input style={S.input} type="number" min="1" value={tree.height_m}
              onChange={(e) => onChange("height_m", parseFloat(e.target.value) || 1)} />
          </div>
          <div>
            <label style={S.label}>Canopy radius (m)</label>
            <input style={S.input} type="number" min="0.5" value={tree.canopy_radius_m}
              onChange={(e) => onChange("canopy_radius_m", parseFloat(e.target.value) || 0.5)} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          <div>
            <label style={S.label}>Shape</label>
            <select style={S.input} value={tree.shape} onChange={(e) => onChange("shape", e.target.value)}>
              <option value="cylinder">Cylinder</option>
              <option value="cone">Cone</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Type</label>
            <select style={S.input} value={tree.deciduous ? "deciduous" : "evergreen"}
              onChange={(e) => onChange("deciduous", e.target.value === "deciduous")}>
              <option value="evergreen">Evergreen</option>
              <option value="deciduous">Deciduous</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ ...S.btn, ...S.btnPrimary, flex: 1 }} onClick={onConfirm}>Add Tree</button>
          <button style={{ ...S.btn, ...S.btnSecondary, flex: 1 }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function TreeCard({ tree, expanded, onToggle, onChange, onDelete }) {
  return (
    <div style={S.treeCard}>
      <div style={S.treeCardHeader} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>{tree.deciduous ? "🌿" : "🌲"}</span>
          <span style={{ fontWeight: 500 }}>{tree.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={S.metaTag}>{tree.height_m}m</span>
          <button
            style={{ ...S.btn, ...S.btnDanger, padding: "3px 7px", fontSize: 11 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >✕</button>
        </div>
      </div>
      {expanded && (
        <div style={S.treeCardBody}>
          <label style={S.label}>Name</label>
          <input style={{ ...S.input, marginBottom: 6 }} value={tree.name}
            onChange={(e) => onChange("name", e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <div>
              <label style={S.label}>Height (m)</label>
              <input style={S.input} type="number" min="1" value={tree.height_m}
                onChange={(e) => onChange("height_m", parseFloat(e.target.value) || 1)} />
            </div>
            <div>
              <label style={S.label}>Canopy radius (m)</label>
              <input style={S.input} type="number" min="0.5" value={tree.canopy_radius_m}
                onChange={(e) => onChange("canopy_radius_m", parseFloat(e.target.value) || 0.5)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div>
              <label style={S.label}>Shape</label>
              <select style={S.input} value={tree.shape} onChange={(e) => onChange("shape", e.target.value)}>
                <option value="cylinder">Cylinder</option>
                <option value="cone">Cone</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Type</label>
              <select style={S.input} value={tree.deciduous ? "deciduous" : "evergreen"}
                onChange={(e) => onChange("deciduous", e.target.value === "deciduous")}>
                <option value="evergreen">Evergreen</option>
                <option value="deciduous">Deciduous</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Plotly chart renderer via iframe postMessage approach (avoids loading Plotly in main bundle)
function PlotlyEmbed({ figJson }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const doc = ref.current.contentDocument || ref.current.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html><head>
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"><\/script>
<style>body{margin:0;padding:0;background:white;}#chart{width:100%;height:260px;}</style>
</head><body>
<div id="chart"></div>
<script>
  var fig = ${figJson};
  Plotly.newPlot('chart', fig.data, Object.assign({}, fig.layout, {
    autosize: true,
    margin: {l:50, r:20, t:40, b:50},
  }), {responsive: true, displayModeBar: false});
<\/script>
</body></html>`);
    doc.close();
  }, [figJson]);
  return <iframe ref={ref} style={{ width: "100%", height: 280, border: "none" }} title="chart" />;
}

export default withStreamlitConnection(SolarShadowApp);

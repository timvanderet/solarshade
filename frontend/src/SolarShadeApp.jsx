import React, { useEffect, useRef, useState, useCallback } from "react";
import { Streamlit } from "streamlit-component-lib";

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

function toRad(d) { return d * Math.PI / 180; }

function gpsToLocal(lat, lon, originLat, originLon) {
  const R = 6371000;
  const x = toRad(lon - originLon) * R * Math.cos(toRad(originLat));
  const y = toRad(lat - originLat) * R;
  return [x, y];
}

function computePanelMeta(corners) {
  if (!corners || corners.length !== 4) return null;
  const origin = corners[0];
  const local = corners.map(([lat, lon]) => gpsToLocal(lat, lon, origin[0], origin[1]));

  let area = 0;
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = local[i];
    const [x1, y1] = local[(i + 1) % 4];
    area += x0 * y1 - x1 * y0;
  }
  area = Math.abs(area) / 2;

  const edges = local.map((pt, i) => {
    const nxt = local[(i + 1) % 4];
    const dx = nxt[0] - pt[0], dy = nxt[1] - pt[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    const bearing = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    return { len, bearing };
  });

  const pair02 = edges[0].len + edges[2].len;
  const pair13 = edges[1].len + edges[3].len;
  const longBearing = pair02 >= pair13 ? edges[0].bearing : edges[1].bearing;

  const cand1 = (longBearing + 90) % 360;
  const cand2 = (longBearing - 90 + 360) % 360;
  const inSouthern = (b) => b > 90 && b <= 270;
  let azimuth;
  if (inSouthern(cand1) && !inSouthern(cand2)) azimuth = cand1;
  else if (inSouthern(cand2) && !inSouthern(cand1)) azimuth = cand2;
  else azimuth = Math.abs(cand1 - 270) <= Math.abs(cand2 - 270) ? cand1 : cand2;

  const widthM = (edges[0].len + edges[2].len) / 2;
  const heightM = (edges[1].len + edges[3].len) / 2;

  return {
    azimuth: Math.round(azimuth * 10) / 10,
    area: Math.round(area * 10) / 10,
    widthM: Math.round(widthM * 10) / 10,
    heightM: Math.round(heightM * 10) / 10,
  };
}

function ensureClockwise(corners) {
  let area = 0;
  const n = corners.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = corners[i];
    const [x1, y1] = corners[(i + 1) % n];
    area += x0 * y1 - x1 * y0;
  }
  if (area > 0) return [...corners].reverse();
  return corners;
}

// ── Main Component ───────────────────────────────────────────────────────────
function SolarShadeApp() {
  const [streamlitArgs, setStreamlitArgs] = useState({});
  const {
    google_maps_api_key: apiKey = "",
    results = null,
    charts = null,
    heatmap_grid: heatmapGrid = null,
    heatmap_status: heatmapStatus = "idle",
    last_processed_request_id: lastProcessedId = null,
    error: serverError = null,
  } = streamlitArgs;

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const panelPolygonsRef = useRef({});   // panelId → Polygon
  const pendingCornersRef = useRef([]);
  const pendingMarkersRef = useRef([]);
  const treeMarkersRef = useRef({});
  const pendingMarkerRef = useRef(null);
  const heatmapOverlayRef = useRef(null);
  const searchContainerRef = useRef(null);
  const canvasOverlayRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | drawPanel | placeTree
  const [pendingCount, setPendingCount] = useState(0);

  // Multi-panel state
  const [panels, setPanels] = useState([]); // [{id, name, corners, tilt_deg, height_m}]
  const [drawingPanelId, setDrawingPanelId] = useState(null);
  const [expandedPanel, setExpandedPanel] = useState(null);

  const [trees, setTrees] = useState([]);
  const [expandedTree, setExpandedTree] = useState(null);
  const [pendingTree, setPendingTree] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [activeTab, setActiveTab] = useState("monthly");
  const [year, setYear] = useState(2025);
  const [importError, setImportError] = useState(null);

  // Connect to Streamlit
  useEffect(() => {
    const onRender = (event) => {
      setStreamlitArgs(event.detail?.args || {});
    };
    Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);
    Streamlit.setComponentReady();
    const t1 = setTimeout(() => Streamlit.setComponentReady(), 150);
    const t2 = setTimeout(() => Streamlit.setComponentReady(), 600);
    const t3 = setTimeout(() => Streamlit.setComponentReady(), 2000);
    const setHeight = () => Streamlit.setFrameHeight(window.innerHeight);
    setHeight();
    window.addEventListener("resize", setHeight);
    return () => {
      Streamlit.events.removeEventListener(Streamlit.RENDER_EVENT, onRender);
      window.removeEventListener("resize", setHeight);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (!apiKey || window._googleMapsLoading) return;
    if (window.google?.maps?.Map) { setMapLoaded(true); return; }
    window._googleMapsLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`;
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

    if (searchContainerRef.current) {
      const input = document.createElement("input");
      input.placeholder = "Search address…";
      input.style.cssText = [
        "width:100%", "padding:7px 10px", "border:1px solid #e2e8f0",
        "border-radius:5px", "font-size:13px", "font-family:inherit",
        "color:#1e293b", "background:#fff", "outline:none", "box-sizing:border-box",
      ].join(";");
      searchContainerRef.current.appendChild(input);
      const ac = new window.google.maps.places.Autocomplete(input, {
        fields: ["geometry", "name"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place.geometry?.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else if (place.geometry?.location) {
          map.panTo(place.geometry.location);
          map.setZoom(19);
        }
      });
    }
  }, [mapLoaded]);

  // Cursor: crosshair when drawing or placing
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const cursor = (mode === "drawPanel" || mode === "placeTree") ? "crosshair" : "";
    mapInstanceRef.current.setOptions({ draggableCursor: cursor });
  }, [mode, mapLoaded]);

  // Map click handler
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const listener = map.addListener("click", (e) => {
      const { latLng } = e;
      const lat = latLng.lat(), lng = latLng.lng();

      if (mode === "drawPanel" && drawingPanelId) {
        const corners = [...pendingCornersRef.current, [lat, lng]];
        pendingCornersRef.current = corners;
        setPendingCount(corners.length);

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
          pendingMarkersRef.current.forEach((m) => m.setMap(null));
          pendingMarkersRef.current = [];
          pendingCornersRef.current = [];
          setPendingCount(0);

          const ordered = ensureClockwise(corners);
          const pid = drawingPanelId;
          setPanels((prev) => prev.map((p) => p.id === pid ? { ...p, corners: ordered } : p));
          drawPanelPolygon(pid, ordered, map);
          setMode("idle");
          setDrawingPanelId(null);
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
  }, [mapLoaded, mode, drawingPanelId, trees.length]);

  function drawPanelPolygon(panelId, corners, map) {
    if (panelPolygonsRef.current[panelId]) {
      panelPolygonsRef.current[panelId].setMap(null);
    }
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
    panelPolygonsRef.current[panelId] = poly;

    const updateCorners = () => {
      const pts = poly.getPath().getArray().map((p) => [p.lat(), p.lng()]);
      const pid = panelId;
      setPanels((prev) => prev.map((p) => p.id === pid ? { ...p, corners: ensureClockwise(pts) } : p));
    };
    window.google.maps.event.addListener(poly.getPath(), "set_at", updateCorners);
    window.google.maps.event.addListener(poly.getPath(), "insert_at", updateCorners);
  }

  // Sync pending tree marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;
    if (!pendingTree) {
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.setMap(null);
        pendingMarkerRef.current = null;
      }
      return;
    }
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.setPosition({ lat: pendingTree.lat, lng: pendingTree.lon });
    } else {
      pendingMarkerRef.current = new window.google.maps.Marker({
        position: { lat: pendingTree.lat, lng: pendingTree.lon },
        map,
        title: pendingTree.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#fbbf24",
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
    }
  }, [pendingTree, mapLoaded]);

  // Sync tree markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const currentIds = new Set(trees.map((t) => t.id));
    Object.entries(treeMarkersRef.current).forEach(([id, m]) => {
      if (!currentIds.has(id)) { m.setMap(null); delete treeMarkersRef.current[id]; }
    });
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

  // Planting-impact heatmap overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;
    if (canvasOverlayRef.current) {
      canvasOverlayRef.current.setMap(null);
      canvasOverlayRef.current = null;
    }
    if (!heatmapGrid || heatmapGrid.length === 0) return;

    const maxShade = Math.max(...heatmapGrid.map((p) => p.shade_pct), 0.001);
    if (maxShade === 0) return;

    function heatColor(t) {
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

  function addPanel() {
    const newPanel = {
      id: genId(),
      name: `Panel ${panels.length + 1}`,
      corners: null,
      tilt_deg: "22",
      height_m: "1.0",
    };
    pendingCornersRef.current = [];
    pendingMarkersRef.current.forEach((m) => m.setMap(null));
    pendingMarkersRef.current = [];
    setPendingCount(0);
    setPanels((prev) => [...prev, newPanel]);
    setDrawingPanelId(newPanel.id);
    setMode("drawPanel");
  }

  function redrawPanel(panelId) {
    if (panelPolygonsRef.current[panelId]) {
      panelPolygonsRef.current[panelId].setMap(null);
      delete panelPolygonsRef.current[panelId];
    }
    setPanels((prev) => prev.map((p) => p.id === panelId ? { ...p, corners: null } : p));
    pendingCornersRef.current = [];
    pendingMarkersRef.current.forEach((m) => m.setMap(null));
    pendingMarkersRef.current = [];
    setPendingCount(0);
    setDrawingPanelId(panelId);
    setMode("drawPanel");
  }

  function deletePanel(id) {
    if (panelPolygonsRef.current[id]) {
      panelPolygonsRef.current[id].setMap(null);
      delete panelPolygonsRef.current[id];
    }
    setPanels((prev) => prev.filter((p) => p.id !== id));
    if (drawingPanelId === id) {
      setDrawingPanelId(null);
      setMode("idle");
      pendingCornersRef.current = [];
      pendingMarkersRef.current.forEach((m) => m.setMap(null));
      pendingMarkersRef.current = [];
      setPendingCount(0);
    }
  }

  function updatePanel(id, field, value) {
    setPanels((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }

  function cancelMode() {
    setMode("idle");
    setDrawingPanelId(null);
    setPendingCount(0);
    pendingCornersRef.current = [];
    pendingMarkersRef.current.forEach((m) => m.setMap(null));
    pendingMarkersRef.current = [];
  }

  function startPlaceTree() {
    setMode("placeTree");
  }

  function confirmPendingTree() {
    if (!pendingTree) return;
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.setMap(null);
      pendingMarkerRef.current = null;
    }
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
    if (panels.length === 0) {
      setValidationError("Add at least one panel footprint.");
      return;
    }
    const undrawn = panels.filter((p) => !p.corners);
    if (undrawn.length > 0) {
      setValidationError(`Panel "${undrawn[0].name}" has no drawn footprint.`);
      return;
    }
    for (const p of panels) {
      const tilt = parseFloat(p.tilt_deg);
      if (isNaN(tilt) || tilt <= 0) {
        setValidationError(`Panel "${p.name}": tilt must be a positive number.`);
        return;
      }
    }
    Streamlit.setComponentValue({
      run_analysis: true,
      analysis_request_id: genId(),
      year,
      panels: panels.map((p) => ({
        id: p.id,
        name: p.name,
        corners: p.corners,
        tilt_deg: parseFloat(p.tilt_deg),
        height_m: parseFloat(p.height_m) || 1.0,
      })),
      trees,
    });
  }

  function exportConfig() {
    const config = {
      version: "1.1.0",
      year,
      panels: panels.map((p) => ({
        id: p.id,
        name: p.name,
        corners: p.corners || [],
        tilt_deg: parseFloat(p.tilt_deg) || 22,
        height_m: parseFloat(p.height_m) || 1.0,
      })),
      trees,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solarshade-config.json";
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
        let importedPanels;
        if (Array.isArray(cfg.panels) && cfg.panels.length > 0) {
          // v1.1.0 multi-panel format
          importedPanels = cfg.panels.map((p) => ({
            id: p.id || genId(),
            name: p.name || "Panel",
            corners: Array.isArray(p.corners) && p.corners.length === 4
              ? ensureClockwise(p.corners) : null,
            tilt_deg: String(p.tilt_deg ?? 22),
            height_m: String(p.height_m ?? 1.0),
          }));
        } else if (Array.isArray(cfg.panelCorners)) {
          // v1.0.0 single-panel format
          if (cfg.panelCorners.length !== 4) throw new Error("panelCorners must have 4 corners");
          importedPanels = [{
            id: genId(),
            name: "Panel 1",
            corners: ensureClockwise(cfg.panelCorners),
            tilt_deg: String(cfg.panelTiltDeg ?? 22),
            height_m: "1.0",
          }];
        } else {
          throw new Error("Missing panels or panelCorners field");
        }
        // Clear existing polygons
        Object.values(panelPolygonsRef.current).forEach((poly) => poly.setMap(null));
        panelPolygonsRef.current = {};
        setPanels(importedPanels);
        if (mapInstanceRef.current) {
          importedPanels.forEach((p) => {
            if (p.corners) drawPanelPolygon(p.id, p.corners, mapInstanceRef.current);
          });
        }
        setTrees(cfg.trees || []);
        if (typeof cfg.year === "number") setYear(cfg.year);
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
    return <PlotlyEmbed figJson={figJson} key={figJson.slice(0, 40)} />;
  }

  const modeLabel =
    mode === "drawPanel"
      ? `Click 4 corners… (${pendingCount}/4)`
      : mode === "placeTree"
      ? "Click map to place tree…"
      : null;

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sidebarHeader}>☀ SolarShade</div>
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
              <div style={{ marginBottom: 8 }}>
                <div style={S.infoBox}>{modeLabel}</div>
                <button style={{ ...S.btn, ...S.btnDanger, width: "100%" }} onClick={cancelMode}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                style={{ ...S.btn, ...S.btnSecondary, width: "100%", marginBottom: 8 }}
                onClick={addPanel}
              >
                + Add Panel
              </button>
            )}
            {panels.map((panel) => (
              <PanelCard
                key={panel.id}
                panel={panel}
                expanded={expandedPanel === panel.id}
                onToggle={() => setExpandedPanel((id) => (id === panel.id ? null : panel.id))}
                onChange={(f, v) => updatePanel(panel.id, f, v)}
                onRedraw={() => redrawPanel(panel.id)}
                onDelete={() => deletePanel(panel.id)}
              />
            ))}
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
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={runAnalysis}>
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
              {panels.length > 1
                ? <span><b>{panels.length} panels</b> &nbsp;</span>
                : <span><b>Azimuth:</b> {results.panel_azimuth_deg?.toFixed(1)}° &nbsp;</span>
              }
              <span><b>Area:</b> {results.panel_area_m2?.toFixed(1)} m² &nbsp;</span>
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

function PanelCard({ panel, expanded, onToggle, onChange, onRedraw, onDelete }) {
  const meta = computePanelMeta(panel.corners);
  return (
    <div style={S.treeCard}>
      <div style={S.treeCardHeader} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>◼</span>
          <span style={{ fontWeight: 500 }}>{panel.name}</span>
          {!panel.corners && (
            <span style={{ color: "#94a3b8", fontSize: 11 }}>not drawn</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {meta && <span style={S.metaTag}>{meta.area.toFixed(1)} m²</span>}
          <button
            style={{ ...S.btn, ...S.btnDanger, padding: "3px 7px", fontSize: 11 }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >✕</button>
        </div>
      </div>
      {expanded && (
        <div style={S.treeCardBody}>
          <label style={S.label}>Name</label>
          <input
            style={{ ...S.input, marginBottom: 6 }}
            value={panel.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <div>
              <label style={S.label}>Tilt (°)</label>
              <input
                style={S.input}
                type="number"
                min="1"
                max="90"
                value={panel.tilt_deg}
                onChange={(e) => onChange("tilt_deg", e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Height above ground (m)</label>
              <input
                style={S.input}
                type="number"
                min="0"
                step="0.1"
                value={panel.height_m}
                onChange={(e) => onChange("height_m", e.target.value)}
              />
            </div>
          </div>
          {meta && (
            <div style={{ ...S.panelMeta, marginBottom: 8, fontSize: 11 }}>
              <b>Azimuth:</b> {meta.azimuth.toFixed(1)}° &nbsp;
              <b>Area:</b> {meta.area.toFixed(1)} m² &nbsp;
              <b>Dims:</b> ~{meta.widthM.toFixed(1)} × {meta.heightM.toFixed(1)} m
            </div>
          )}
          <button
            style={{ ...S.btn, ...S.btnSecondary, width: "100%" }}
            onClick={onRedraw}
          >
            {panel.corners ? "Redraw Footprint" : "Draw Footprint"}
          </button>
        </div>
      )}
    </div>
  );
}

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
            <label style={S.label}>Latitude</label>
            <input style={S.input} type="number" step="0.000001" value={tree.lat}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange("lat", v); }} />
          </div>
          <div>
            <label style={S.label}>Longitude</label>
            <input style={S.input} type="number" step="0.000001" value={tree.lon}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange("lon", v); }} />
          </div>
        </div>
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
              <label style={S.label}>Latitude</label>
              <input style={S.input} type="number" step="0.000001" value={tree.lat}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange("lat", v); }} />
            </div>
            <div>
              <label style={S.label}>Longitude</label>
              <input style={S.input} type="number" step="0.000001" value={tree.lon}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange("lon", v); }} />
            </div>
          </div>
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

export default SolarShadeApp;

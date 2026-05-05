import { useState, useCallback, useMemo } from "react";
import WaferCanvas from "./components/WaferCanvas";
import Wafer3D from "./components/Wafer3D";
import Histogram from "./components/Histogram";
import { generateWaferData } from "./data/generateWaferData";
import "./index.css";

/* ==== DATASET CONFIGURATIONS ==== */
const DATASETS = [
  { label: "750 Devices (30×30)", total: 750, gridX: 30, gridY: 30 },
  { label: "1000 Devices (35×35)", total: 1000, gridX: 35, gridY: 35 },
  { label: "200 Devices (20×20)", total: 200, gridX: 20, gridY: 20 },
  { label: "500 Devices (25×25)", total: 500, gridX: 25, gridY: 25 },
];

function computeMetrics(bins, totalPossible) {
  const entries = Object.values(bins);
  const total = entries.length; // Active filtered dies
  const pass = entries.filter((b) => b.binCategory === "Pass").length;
  const failLow = entries.filter((b) => b.binCategory === "Fail-Low").length;
  const failHigh = entries.filter((b) => b.binCategory === "Fail-High").length;
  
  // Yield is based on the currently filtered total vs pass
  const yieldPct = total > 0 ? ((pass / total) * 100).toFixed(2) : "0.00";
  return { total, pass, failLow, failHigh, yieldPct };
}

export default function App() {
  const [datasetIdx, setDatasetIdx] = useState(0);
  const [waferData, setWaferData] = useState(() => {
    const d = DATASETS[0];
    return generateWaferData(d.total, d.gridX, d.gridY);
  });

  // Filter and View state
  const [filterMode, setFilterMode] = useState("all"); // 'all', 'pass', 'fail'
  const [failSubMode, setFailSubMode] = useState("all"); // 'all', 'low', 'high'
  const [viewMode, setViewMode] = useState("3D"); // '2D' or '3D'

  const handleDatasetChange = useCallback((e) => {
    const idx = Number(e.target.value);
    setDatasetIdx(idx);
    const d = DATASETS[idx];
    setWaferData(generateWaferData(d.total, d.gridX, d.gridY));
  }, []);

  const handleRegenerate = useCallback(() => {
    const d = DATASETS[datasetIdx];
    setWaferData(generateWaferData(d.total, d.gridX, d.gridY));
  }, [datasetIdx]);

  // Derive filtered bins
  const filteredBins = useMemo(() => {
    const filtered = {};
    for (const [key, bin] of Object.entries(waferData.bins)) {
      if (filterMode === "all") {
        filtered[key] = bin;
      } else if (filterMode === "pass") {
        if (bin.binCategory === "Pass") filtered[key] = bin;
      } else if (filterMode === "fail") {
        if (failSubMode === "all" && bin.binCategory !== "Pass") {
          filtered[key] = bin;
        } else if (failSubMode === "low" && bin.binCategory === "Fail-Low") {
          filtered[key] = bin;
        } else if (failSubMode === "high" && bin.binCategory === "Fail-High") {
          filtered[key] = bin;
        }
      }
    }
    return filtered;
  }, [waferData.bins, filterMode, failSubMode]);

  // Compute metrics based on FILTERED bins
  const { total, pass, failLow, failHigh, yieldPct } = computeMetrics(filteredBins);

  return (
    <div className="app-root">
      {/* HEADER */}
      <header className="top-header">
        <div className="header-content">
          <h1>Wafer Yield Analytics</h1>
          <p className="subtitle">
            Semiconductor wafer test visualization with spatial defect simulation
          </p>
        </div>
      </header>

      {/* BODY */}
      <div className="content">
        {/* LEFT PANEL */}
        <aside className="sidebar">
          <h2>Overview</h2>
          <p className="muted">
            Realistic wafer-level bin map with edge effects, cluster defects, and
            gradient variation.
          </p>

          {/* DATASET SELECTOR */}
          <div className="metric-card">
            <div className="metric-label">WAFER DATASET</div>
            <select
              className="input-file-select"
              value={datasetIdx}
              onChange={handleDatasetChange}
            >
              {DATASETS.map((d, i) => (
                <option key={i} value={i}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <button className="regen-btn" onClick={handleRegenerate}>
            🔄 Regenerate Data
          </button>

          {/* FILTER CONTROLS */}
          <div className="filter-section">
            <div className="metric-label">DIE FILTER</div>
            <div className="filter-btn-group">
              <button 
                className={`filter-btn ${filterMode === "all" ? "active" : ""}`}
                onClick={() => setFilterMode("all")}
              >All</button>
              <button 
                className={`filter-btn pass-btn ${filterMode === "pass" ? "active" : ""}`}
                onClick={() => setFilterMode("pass")}
              >Pass</button>
              <button 
                className={`filter-btn fail-btn ${filterMode === "fail" ? "active" : ""}`}
                onClick={() => setFilterMode("fail")}
              >Fail</button>
            </div>

            {/* FAIL SUB-FILTERS */}
            {filterMode === "fail" && (
              <div className="filter-btn-group sub-filters">
                <button 
                  className={`filter-btn sub-btn ${failSubMode === "all" ? "active" : ""}`}
                  onClick={() => setFailSubMode("all")}
                >All Fails</button>
                <button 
                  className={`filter-btn sub-btn low-btn ${failSubMode === "low" ? "active" : ""}`}
                  onClick={() => setFailSubMode("low")}
                >Fail-Low</button>
                <button 
                  className={`filter-btn sub-btn high-btn ${failSubMode === "high" ? "active" : ""}`}
                  onClick={() => setFailSubMode("high")}
                >Fail-High</button>
              </div>
            )}
          </div>

          <h3>Key Metrics</h3>

          <div className="metrics-summary">
            <div className="metric-card">
              <div className="metric-label">Wafer Size</div>
              <div className="metric-value">{waferData.wafer}"</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Visible Dies</div>
              <div className="metric-value">{total}</div>
            </div>
          </div>

          <div className="metrics-grid">
            <div className={`metric-card pass-card ${filterMode !== "all" && filterMode !== "pass" ? "dimmed" : ""}`}>
              <div className="metric-label">PASS</div>
              <div className="metric-value">{pass}</div>
            </div>

            <div className={`metric-card fail-low-card ${(filterMode === "pass" || (filterMode === "fail" && failSubMode === "high")) ? "dimmed" : ""}`}>
              <div className="metric-label">FAIL-LOW</div>
              <div className="metric-value">{failLow}</div>
            </div>

            <div className={`metric-card fail-high-card ${(filterMode === "pass" || (filterMode === "fail" && failSubMode === "low")) ? "dimmed" : ""}`}>
              <div className="metric-label">FAIL-HIGH</div>
              <div className="metric-value">{failHigh}</div>
            </div>

            <div className="metric-card yield-card">
              <div className="metric-label">YIELD (Visible)</div>
              <div className="metric-value">{yieldPct}%</div>
            </div>
          </div>

          <div className="legend">
            <h4>Legend</h4>
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#10b981" }}
              ></span>
              Pass (20 ≤ v ≤ 70)
            </div>
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#ef4444" }}
              ></span>
              Fail-Low (v &lt; 20)
            </div>
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "#f59e0b" }}
              ></span>
              Fail-High (v &gt; 70)
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="main-panel">
          <div className="viz-container">
            <div className="wafer-card" style={{ position: 'relative' }}>
              
              {/* 2D / 3D Toggle */}
              <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10, display: 'flex' }}>
                <button 
                  className={`filter-btn ${viewMode === '2D' ? 'active' : ''}`}
                  onClick={() => setViewMode('2D')}
                  style={{ padding: '6px 12px', borderRadius: '6px 0 0 6px', borderRight: 'none', margin: 0 }}
                >2D</button>
                <button 
                  className={`filter-btn ${viewMode === '3D' ? 'active' : ''}`}
                  onClick={() => setViewMode('3D')}
                  style={{ padding: '6px 12px', borderRadius: '0 6px 6px 0', margin: 0 }}
                >3D</button>
              </div>

              {viewMode === '2D' ? (
                <WaferCanvas waferData={{ ...waferData, bins: filteredBins }} />
              ) : (
                <Wafer3D waferData={{ ...waferData, bins: filteredBins }} />
              )}
              
              <div className="wafer-caption">
                {viewMode === '2D' 
                  ? "Die-level bin map • Tap or hover to inspect dies" 
                  : "Interactive 3D map • Drag to rotate • Scroll to zoom"
                }
              </div>
            </div>

            <div className="histogram-card">
              {/* Pass the filtered bins to Histogram */}
              <Histogram bins={filteredBins} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

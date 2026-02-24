import { useState } from "react";
import WaferCanvas from "./components/WaferCanvas";
import "./index.css";

/* ==== IMPORT REAL API FILES ==== */
import waferApi1 from "./data/waferApi1";
import waferApi2 from "./data/waferApi2";
import waferApi3 from "./data/waferApi3";
import waferApi4 from "./data/waferApi4";
import waferApi5 from "./data/waferApi5";
import waferApi6 from "./data/waferApi6";
import waferApi7 from "./data/waferApi7";
import waferApi8 from "./data/waferApi8";

/* ==== HARDCODED FILE → API MAP (AS PER SAI ANNA) ==== */
const FILE_MAP = {
  "input_file1.std": waferApi1,
  "input_file2.std": waferApi2,
  "input_file3.std": waferApi3,
  "input_file4.std": waferApi4,
  "input_file5.std": waferApi5, // 1000 devices
  "input_file6.std": waferApi6, // 1000 devices
  "input_file7.std": waferApi7, // 200 devices
  "input_file8.std": waferApi8, // 200 devices
};

export default function App() {
  const [selectedFile, setSelectedFile] = useState("input_file1.std");

  const waferData = FILE_MAP[selectedFile];

  /* ==== METRICS ==== */
  const totalDevices = Object.keys(waferData.bins).length;
  const pass = Object.values(waferData.bins).filter(
    (b) => b.sbin === 1 && b.hbin === 1
  ).length;
  const fail = totalDevices - pass;
  const yieldPercent = ((pass / totalDevices) * 100).toFixed(2);

  return (
    <div className="app-root">
      {/* HEADER */}
      <header className="top-header">
        <h1>Wafer Yield Analytics</h1>
        <p>Semiconductor wafer test visualization dashboard</p>
      </header>

      {/* BODY */}
      <div className="content">
        {/* LEFT PANEL */}
        <aside className="sidebar">
          <h2>Overview</h2>
          <p className="muted">
            Wafer-level bin map visualization for yield and failure analysis.
          </p>

          {/* DATASET SELECTOR */}
          <div className="metric-card">
            <div className="metric-label">WAFER DATASET</div>
            <select
              className="input-file-select"
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
            >
              <option value="input_file1.std">750 Devices</option>
              <option value="input_file2.std">750 Devices</option>
              <option value="input_file3.std">750 Devices</option>
              <option value="input_file4.std">750 Devices</option>
              <option value="input_file5.std">1000 Devices</option>
              <option value="input_file6.std">1000 Devices</option>
              <option value="input_file7.std">200 Devices</option>
              <option value="input_file8.std">200 Devices</option>
            </select>
          </div>

          <h3>Key Metrics</h3>

          <div className="metric-card">
            <div className="metric-label">Wafer Size</div>
            <div className="metric-value">{waferData.wafer}"</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Devices</div>
            <div className="metric-value">{totalDevices}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">PASS</div>
            <div className="metric-value">{pass}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">FAIL</div>
            <div className="metric-value">{fail}</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Yield</div>
            <div className="metric-value">{yieldPercent}%</div>
          </div>

          <div className="legend">
            <h4>Legend</h4>
            <div>🟢 Pass Die</div>
            <div>🔴 Fail Die</div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="main-panel">
          <div className="wafer-card">
            <WaferCanvas waferData={waferData} />
            <div className="wafer-caption">
              Die-level bin map • Hover to inspect dies
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

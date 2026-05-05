/**
 * Realistic Wafer Data Generator with Spatial Defect Patterns
 *
 * Generates measurement values based on die position (X,Y) to simulate
 * realistic physical semiconductor manufacturing behavior:
 *   1. Center: strong pass (values close to 45, low variance)
 *   2. Mid region: slight variation (marginal pass)
 *   3. Edge: high variance and mean drift (fails low or high)
 *   4. Clusters: localized hotspots of extreme values
 */

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Gaussian random via Box-Muller (mean=0, std=1) */
function gaussRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate a physically realistic value for a die based on its position.
 */
function generateRadialValue(x, y, gridX, gridY, clusters) {
  const cx = gridX / 2;
  const cy = gridY / 2;
  const maxR = Math.min(gridX, gridY) / 2;
  
  // Radial distance from center (0 = exact center, 1 = wafer edge)
  const dist = Math.hypot(x - cx, y - cy);
  const normDist = clamp(dist / maxR, 0, 1);

  // 1. Radial Variance: 
  // Center is highly stable (stdDev = 4). Edges are highly unstable (stdDev = 20).
  // We use a power curve so the center stays good, and it degrades sharply near the edge.
  const stdDev = 4 + Math.pow(normDist, 2.5) * 16;

  // 2. Radial Mean Drift (Gradient):
  // Real wafers often have a gradient due to gas flow or spin coating.
  // We calculate the angle and create a drift that pulls values slightly high on one side
  // and slightly low on the opposite side.
  const angle = Math.atan2(y - cy, x - cx);
  const meanDrift = Math.cos(angle) * 12 * normDist; // drifts up to +/- 12 at edges
  
  // 3. Cluster Defects:
  // If near a cluster hotspot, the mean shifts massively and variance spikes.
  let clusterImpact = 0;
  for (const c of clusters) {
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < c.radius) {
      // Exponential falloff from cluster center
      const strength = Math.pow(1 - d / c.radius, 2);
      clusterImpact += strength * c.severity; // severity determines if it fails low or high
    }
  }

  // Base ideal target is 45.
  const mean = 45 + meanDrift + clusterImpact;
  
  // Final calculation
  let value = mean + gaussRandom() * stdDev;

  // Small uniform noise to avoid perfect symmetry
  const noise = (Math.random() - 0.5) * 3;
  value += noise;

  return clamp(value, 0, 100);
}

export function generateWaferData(totalDies, gridX = 30, gridY = 30, waferSize = 12) {
  const bins = {};
  
  const cx = gridX / 2;
  const cy = gridY / 2;
  const waferRadius = Math.min(gridX, gridY) / 2 - 1;

  // ── Create 2-3 random defect clusters ──
  const numClusters = 2 + Math.floor(Math.random() * 2);
  const clusters = [];
  for (let i = 0; i < numClusters; i++) {
    // Determine if this cluster pulls values wildly low (-35) or wildly high (+40)
    const severity = (Math.random() < 0.5 ? -1 : 1) * (25 + Math.random() * 15);
    clusters.push({
      x: cx + (Math.random() - 0.5) * gridX * 0.7,
      y: cy + (Math.random() - 0.5) * gridY * 0.7,
      radius: 2 + Math.random() * 3, // hotspot size
      severity: severity,
    });
  }

  // ── Collect all valid positions inside the wafer circle ──
  const validPositions = [];
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      if (Math.hypot(x - cx, y - cy) <= waferRadius) {
        validPositions.push({ x, y });
      }
    }
  }

  // Shuffle positions to simulate random testing order (optional, but good for taking a slice)
  for (let i = validPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
  }

  // Take only the number of dies requested
  const selected = validPositions.slice(0, Math.min(totalDies, validPositions.length));

  // ── Generate values ──
  for (let idx = 0; idx < selected.length; idx++) {
    const { x, y } = selected[idx];
    const key = `${x},${y}`;

    const rawValue = generateRadialValue(x, y, gridX, gridY, clusters);
    const value = parseFloat(rawValue.toFixed(2));

    // Existing Binning Logic:
    // < 20 -> Fail-Low
    // 20-70 -> Pass
    // > 70 -> Fail-High
    let binCategory, sbin, hbin;
    if (value < 20) {
      binCategory = "Fail-Low";
      sbin = 2;
      hbin = 2;
    } else if (value > 70) {
      binCategory = "Fail-High";
      sbin = 3;
      hbin = 3;
    } else {
      binCategory = "Pass";
      sbin = 1;
      hbin = 1;
    }

    bins[key] = { sbin, hbin, value, binCategory };
  }

  return {
    type: "bin_map",
    wafer: waferSize,
    die_size: { x: gridX, y: gridY },
    bins,
    clusters, // exposed for optional debug overlays
  };
}

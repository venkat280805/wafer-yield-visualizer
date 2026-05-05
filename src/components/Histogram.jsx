import { useRef, useEffect } from "react";

const BAR_COLORS = {
  fail_low: "#e74c3c",
  pass: "#2ecc71",
  fail_high: "#e67e22",
};

/**
 * Histogram of die parameter values (0–100), bucketised into 10-unit bins.
 */
function Histogram({ bins }) {
  const canvasRef = useRef(null);
  
  // Base logical dimensions (sized close to display size so fonts scale correctly)
  const logicalW = 500;
  const logicalH = 300;
  
  // Use a device pixel ratio multiplier for high-DPI (Retina) displays
  const scaleMultiplier = 3;
  
  const W = logicalW * scaleMultiplier;
  const H = logicalH * scaleMultiplier;

  // Scale internal padding coordinates
  const PAD_L = 40 * scaleMultiplier;
  const PAD_B = 30 * scaleMultiplier;
  const PAD_T = 34 * scaleMultiplier; // Increased to make room for LSL/USL labels
  const PAD_R = 20 * scaleMultiplier;

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    // ── Bucket values into 10 bins of width 10 ──
    const buckets = new Array(10).fill(0);
    const entries = Object.values(bins);
    for (const die of entries) {
      const idx = Math.min(Math.floor(die.value / 10), 9);
      buckets[idx]++;
    }

    // Add 15% headroom so the tallest bar doesn't touch the top and leaves room for its label
    const maxCount = Math.max(...buckets, 1) * 1.15;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    const barW = chartW / 10;

    // ── Grid lines ──
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1 * scaleMultiplier;
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = PAD_T + (chartH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(W - PAD_R, y);
      ctx.stroke();
    }

    // ── Specification Limits (LSL / USL) ──
    const LSL_VALUE = 20;
    const USL_VALUE = 70;
    
    // Calculate X coordinate for limits (each bucket represents 10 units)
    const lslX = PAD_L + (LSL_VALUE / 100) * chartW;
    const uslX = PAD_L + (USL_VALUE / 100) * chartW;

    ctx.save();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)"; // Subtle red dashed line
    ctx.lineWidth = 1 * scaleMultiplier;
    ctx.setLineDash([6 * scaleMultiplier, 4 * scaleMultiplier]);
    
    // Draw LSL
    ctx.beginPath();
    ctx.moveTo(lslX, PAD_T - (8 * scaleMultiplier)); // Start slightly below the label
    ctx.lineTo(lslX, H - PAD_B);
    ctx.stroke();
    
    // Draw USL
    ctx.beginPath();
    ctx.moveTo(uslX, PAD_T - (8 * scaleMultiplier));
    ctx.lineTo(uslX, H - PAD_B);
    ctx.stroke();
    
    ctx.restore();

    // Limit Labels
    ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
    ctx.font = `600 ${11 * scaleMultiplier}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("LSL (20)", lslX, PAD_T - (16 * scaleMultiplier)); // Positioned cleanly above
    ctx.fillText("USL (70)", uslX, PAD_T - (16 * scaleMultiplier));

    // ── Y-axis labels ──
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    // Use a larger logical font size so it's readable
    ctx.font = `${13 * scaleMultiplier}px Inter, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= gridSteps; i++) {
      const y = PAD_T + (chartH / gridSteps) * i;
      const label = Math.round(maxCount * (1 - i / gridSteps));
      ctx.fillText(label, PAD_L - (10 * scaleMultiplier), y);
    }

    // ── Bars ──
    for (let i = 0; i < 10; i++) {
      const x = PAD_L + i * barW;
      const h = (buckets[i] / maxCount) * chartH;
      const y = PAD_T + chartH - h;

      // Bar fill (3D Gradient effect)
      ctx.beginPath();
      
      const gap = 6 * scaleMultiplier; // Gap between bars
      const barDrawW = barW - gap;
      const barX = x + gap / 2;

      // Create a 3D-style left-to-right gradient
      const grad = ctx.createLinearGradient(barX, 0, barX + barDrawW, 0);
      
      // We need to parse the hex or rgba color to make darker/lighter variants, 
      // but a quick trick is to draw the solid color, then overlay a black/white gradient.
      // Alternatively, we can construct the gradients manually for each type:
      if (i < 2) { // Fail Low
        grad.addColorStop(0, "#f87171"); // Lighter left
        grad.addColorStop(0.5, "#ef4444"); // Solid mid
        grad.addColorStop(1, "#b91c1c"); // Darker right
      } else if (i < 7) { // Pass
        grad.addColorStop(0, "#34d399"); 
        grad.addColorStop(0.5, "#10b981"); 
        grad.addColorStop(1, "#047857"); 
      } else { // Fail High
        grad.addColorStop(0, "#fbbf24"); 
        grad.addColorStop(0.5, "#f59e0b"); 
        grad.addColorStop(1, "#b45309"); 
      }

      ctx.fillStyle = grad;
      ctx.roundRect(
        barX, 
        y, 
        barDrawW, 
        h, 
        [4 * scaleMultiplier, 4 * scaleMultiplier, 0, 0]
      );
      ctx.fill();

      // Add a tiny specular highlight at the very top edge of the bar
      ctx.beginPath();
      ctx.moveTo(barX + (4 * scaleMultiplier), y);
      ctx.lineTo(barX + barDrawW - (4 * scaleMultiplier), y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5 * scaleMultiplier;
      ctx.stroke();

      // Count label above bar
      if (buckets[i] > 0) {
        const labelText = buckets[i].toString();
        ctx.font = `600 ${10 * scaleMultiplier}px Inter, sans-serif`;
        const textWidth = ctx.measureText(labelText).width;
        
        // Skip label if it completely overlaps neighboring bars (unlikely with 10 bins, but safe)
        if (textWidth < barW * 1.5) {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.textAlign = "center";
          // Offset 10px logically above the bar
          ctx.fillText(labelText, x + barW / 2, y - (10 * scaleMultiplier));
        }
      }

      // X-axis label
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `${13 * scaleMultiplier}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${i * 10}`, x + barW / 2, H - PAD_B + (12 * scaleMultiplier));
    }

    // ── Axes ──
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5 * scaleMultiplier;
    ctx.beginPath();
    ctx.moveTo(PAD_L, PAD_T);
    ctx.lineTo(PAD_L, H - PAD_B);
    ctx.lineTo(W - PAD_R, H - PAD_B);
    ctx.stroke();
  }, [bins]);

  return (
    <div className="histogram-wrapper">
      <h4 className="histogram-title">Value Distribution</h4>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ 
          width: "100%", 
          height: "auto", 
          display: "block",
          aspectRatio: `${logicalW} / ${logicalH}`
        }}
      />
      <div className="histogram-axis-label">Parameter Value →</div>
    </div>
  );
}

export default Histogram;

import { useRef, useEffect, useState } from "react";

const BIN_COLORS = {
  Pass: "#2ecc71",       // Green
  "Fail-Low": "#e74c3c", // Red
  "Fail-High": "#e67e22", // Orange
};

function WaferCanvas({ waferData }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  // Internal resolution (high enough for crisp rendering)
  const internalWidth = 1000;
  const internalHeight = 1000;

  function handleInteraction(clientX, clientY) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();

    // Calculate scale between displayed size and internal resolution
    const scaleX = internalWidth / rect.width;
    const scaleY = internalHeight / rect.height;

    // Mouse coordinates relative to internal resolution
    const mouseX = (clientX - rect.left) * scaleX;
    const mouseY = (clientY - rect.top) * scaleY;

    const gridX = waferData.die_size.x;
    const gridY = waferData.die_size.y;

    const cellW = internalWidth / gridX;
    const cellH = internalHeight / gridY;

    const x = Math.floor(mouseX / cellW);
    const y = Math.floor(mouseY / cellH);

    const key = `${x},${y}`;
    const bin = waferData.bins[key];

    if (!bin) {
      setHoverInfo(null);
      return;
    }

    setHoverInfo({
      x,
      y,
      value: bin.value,
      binCategory: bin.binCategory,
      // Position tooltip relative to the visible canvas container
      tooltipX: clientX - rect.left,
      tooltipY: clientY - rect.top,
    });
  }

  function onMouseMove(e) {
    handleInteraction(e.clientX, e.clientY);
  }

  function onTouchStart(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleInteraction(touch.clientX, touch.clientY);
    }
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleInteraction(touch.clientX, touch.clientY);
    }
  }

  // Click outside or leave to hide tooltip
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setHoverInfo(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, internalWidth, internalHeight);

    const centerX = internalWidth / 2;
    const centerY = internalHeight / 2;
    const radius = Math.min(internalWidth, internalHeight) / 2 - 20;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    const gridX = waferData.die_size.x;
    const gridY = waferData.die_size.y;

    const cellW = internalWidth / gridX;
    const cellH = internalHeight / gridY;

    for (let y = 0; y < gridY; y++) {
      for (let x = 0; x < gridX; x++) {
        const key = `${x},${y}`;
        const bin = waferData.bins[key];
        if (!bin) continue;

        const px = x * cellW + cellW / 2;
        const py = y * cellH + cellH / 2;

        if (Math.hypot(px - centerX, py - centerY) <= radius) {
          ctx.fillStyle = BIN_COLORS[bin.binCategory] || "#888";
          ctx.fillRect(
            x * cellW + 1,
            y * cellH + 1,
            cellW - 2,
            cellH - 2
          );
        }
      }
    }

    ctx.restore();

    // Draw wafer outline
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [waferData]);

  return (
    <div ref={containerRef} className="wafer-canvas-container">
      <canvas
        ref={canvasRef}
        width={internalWidth}
        height={internalHeight}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        className="wafer-canvas"
      />

      {hoverInfo && (
        <div
          className="wafer-tooltip"
          style={{
            left: Math.min(hoverInfo.tooltipX + 12, containerRef.current?.offsetWidth - 120 || 0), 
            top: hoverInfo.tooltipY + 12,
            border: `1px solid ${BIN_COLORS[hoverInfo.binCategory] || "#555"}`,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Die ({hoverInfo.x}, {hoverInfo.y})
          </div>
          <div>Value: <b>{hoverInfo.value}</b></div>
          <div>
            Bin:{" "}
            <span style={{ color: BIN_COLORS[hoverInfo.binCategory], fontWeight: 600 }}>
              {hoverInfo.binCategory}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaferCanvas;

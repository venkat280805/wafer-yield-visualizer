import { useRef, useEffect, useState } from "react";

function WaferCanvas({ waferData }) {
  const canvasRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  const width = 500;
  const height = 500;

  function isPass(bin) {
    return bin.sbin === 1 && bin.hbin === 1;
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = waferData.die_size.x;
    const gridY = waferData.die_size.y;

    const cellW = width / gridX;
    const cellH = height / gridY;

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
      sbin: bin.sbin,
      hbin: bin.hbin,
      status: isPass(bin) ? "PASS" : "FAIL",
      mouseX,
      mouseY,
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 10;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    const gridX = waferData.die_size.x;
    const gridY = waferData.die_size.y;

    const cellW = width / gridX;
    const cellH = height / gridY;

    for (let y = 0; y < gridY; y++) {
      for (let x = 0; x < gridX; x++) {
        const key = `${x},${y}`;
        const bin = waferData.bins[key];
        if (!bin) continue;

        const px = x * cellW + cellW / 2;
        const py = y * cellH + cellH / 2;

        if (
          Math.hypot(px - centerX, py - centerY) <= radius
        ) {
          ctx.fillStyle = isPass(bin) ? "#2ecc71" : "#e74c3c";
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

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [waferData]);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        style={{ background: "#2f343a", borderRadius: "14px" }}
      />

      {hoverInfo && (
        <div
          style={{
            position: "absolute",
            left: hoverInfo.mouseX + 12,
            top: hoverInfo.mouseY + 12,
            background: "#000",
            color: "#fff",
            padding: "6px 8px",
            fontSize: "12px",
            borderRadius: "6px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <div>
            x: {hoverInfo.x}, y: {hoverInfo.y}
          </div>
          <div>SBIN: {hoverInfo.sbin}</div>
          <div>HBIN: {hoverInfo.hbin}</div>
          <div>Status: {hoverInfo.status}</div>
        </div>
      )}
    </div>
  );
}

export default WaferCanvas;

function generateBins(total, passRatio, maxX, maxY) {
  const bins = {};
  const used = new Set();

  const passCount = Math.floor(total * passRatio);
  let count = 0;

  while (count < total) {
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    const key = `${x},${y}`;

    if (used.has(key)) continue;
    used.add(key);

    if (count < passCount) {
      bins[key] = { sbin: 1, hbin: 1 }; // PASS
    } else {
      bins[key] = { sbin: 2, hbin: 3 }; // FAIL
    }

    count++;
  }

  return bins;
}


const waferData = {
  type: "bin_map",
  wafer: 12, // 👈 12 inch wafer
  die_size: { x: 30, y: 30 }, // temporary
  bins: generateBins(750, 0.75, 30, 30)

};

export default waferData;

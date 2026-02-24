function generateBins(total, maxX, maxY) {
  const bins = {};
  const used = new Set();

  while (Object.keys(bins).length < total) {
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    const key = `${x},${y}`;

    if (used.has(key)) continue;
    used.add(key);

    bins[key] =
      Math.random() < 0.6
        ? { sbin: 1, hbin: 1 }   // PASS
        : { sbin: 5, hbin: 2 };  // FAIL
  }

  return bins;
}

const waferApi6 = {
  type: "bin_map",
  wafer: 12,
  die_size: { x: 40, y: 40 },
  bins: generateBins(1000, 40, 40),
};

export default waferApi6;

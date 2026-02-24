function generateBins(total, maxX, maxY) {
  const bins = {};
  const used = new Set();

  while (Object.keys(bins).length < total) {
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    const key = `${x},${y}`;

    if (used.has(key)) continue;
    used.add(key);

    // Pass / Fail logic
    bins[key] =
      Math.random() < 0.75
        ? { sbin: 1, hbin: 1 }   // PASS
        : { sbin: 2, hbin: 3 };  // FAIL
  }

  return bins;
}

const waferApi5 = {
  type: "bin_map",
  wafer: 12,
  die_size: { x: 40, y: 40 }, // supports up to 1600 positions
  bins: generateBins(1000, 40, 40),
};

export default waferApi5;

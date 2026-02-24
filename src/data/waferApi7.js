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
      Math.random() < 0.8
        ? { sbin: 1, hbin: 1 }   // PASS
        : { sbin: 3, hbin: 2 };  // FAIL
  }

  return bins;
}

const waferApi7 = {
  type: "bin_map",
  wafer: 12,
  die_size: { x: 20, y: 20 }, // supports up to 400 positions
  bins: generateBins(200, 20, 20),
};

export default waferApi7;

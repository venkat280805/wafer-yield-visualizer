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

    bins[key] =
      count < passCount
        ? { sbin: 1, hbin: 1 }
        : { sbin: 2, hbin: 3 };

    count++;
  }
  return bins;
}
const bins = generateBins(750, 1 , 30, 30);

const waferData = {
  type: "bin_map",
  wafer: 12,
  die_size: { x: 30, y: 30 },
  bins: bins,
};

export default waferData;

const productionToEggs = (stacks, crates, looseEggs) => {
  const s = parseInt(stacks) || 0;
  const c = parseInt(crates) || 0;
  const e = parseInt(looseEggs) || 0;
  
  return (s * 360) + (c * 30) + e;
};

const eggsToProduction = (totalEggs) => {
  const eggs = parseInt(totalEggs) || 0;
  
  const stacks = Math.floor(eggs / 360);
  const remainingAfterStacks = eggs % 360;
  const crates = Math.floor(remainingAfterStacks / 30);
  const looseEggs = remainingAfterStacks % 30;
  
  return {
    stacks,
    crates,
    looseEggs,
    formatted: `${stacks}.${crates}.${looseEggs}`
  };
};

const feedToGrams = (quantity, unit, bagWeightKg = 50) => {
  const conversions = {
    'bags': quantity * bagWeightKg * 1000,
    'kg': quantity * 1000,
    'grams': quantity,
    'tons': quantity * 1000000
  };
  
  return conversions[unit] || 0;
};

const calculateFCR = (feedInGrams, totalBirds) => {
  if (!totalBirds || totalBirds === 0) return 0;
  return parseFloat((feedInGrams / totalBirds).toFixed(2));
};

const calculateProductionRate = (totalEggs, totalBirds) => {
  if (!totalBirds || totalBirds === 0) return 0;
  const rate = (totalEggs / totalBirds) * 100;
  return parseFloat(Math.min(rate, 100).toFixed(2));
};

const calculateMortalityRate = (totalDied, totalBirds) => {
  if (!totalBirds || totalBirds === 0) return 0;
  return parseFloat(((totalDied / totalBirds) * 100).toFixed(2));
};

const calculateProfitMargin = (revenue, expenses) => {
  if (!revenue || revenue === 0) return 0;
  return parseFloat((((revenue - expenses) / revenue) * 100).toFixed(2));
};

const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

module.exports = {
  productionToEggs,
  eggsToProduction,
  feedToGrams,
  calculateFCR,
  calculateProductionRate,
  calculateMortalityRate,
  calculateProfitMargin,
  calculatePercentageChange
};
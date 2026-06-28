const DailyProduction = require('../models/DailyProduction');
const Flock = require('../models/Flock');
const FarmSettings = require('../models/FarmSettings');

// Helper function to calculate production values
function calculateProductionValues(data) {
  const stacks = data.stacks || 0;
  const crates = data.crates || 0;
  const looseEggs = data.looseEggs || 0;
  const totalEggs = (stacks * 360) + (crates * 30) + looseEggs;
  const brokenEggs = data.brokenEggs || 0;
  const goodEggs = Math.max(0, totalEggs - brokenEggs);
  const diedHens = data.diedHens || 0;
  const culledHens = data.culledHens || 0;
  const totalMortality = diedHens + culledHens;
  
  // Feed conversion
  const feedQuantity = data.feedQuantity || 0;
  const feedUnit = data.feedUnit || 'kg';
  const feedConversions = {
    'bags': feedQuantity * 50000,
    'kg': feedQuantity * 1000,
    'grams': feedQuantity,
    'tons': feedQuantity * 1000000
  };
  const feedInGrams = feedConversions[feedUnit] || 0;
  
  return {
    totalEggs,
    goodEggs,
    totalMortality,
    diedHens,
    culledHens,
    feedInGrams,
    feedQuantity,
    feedUnit
  };
}

class ProductionService {
  
  async createProduction(data) {
    // Check for duplicate date
    const existingDate = await DailyProduction.findOne({ 
      date: new Date(data.date) 
    });
    
    if (existingDate) {
      throw new Error(`Production record already exists for ${new Date(data.date).toDateString()}`);
    }
    
    // Calculate all values
    const calculated = calculateProductionValues(data);
    
    // Get total birds for FCR
    const activeFlocks = await Flock.find({ status: 'active' });
    let totalBirds = 0;
    activeFlocks.forEach(flock => { totalBirds += flock.currentBirds; });
    
    if (totalBirds === 0) {
      const settings = await FarmSettings.findOne();
      totalBirds = settings ? settings.initialHens : 1000;
    }
    
    // Calculate metrics
    let fcrPerHen = 0;
    let eggsPerHen = 0;
    let productionRate = 0;
    
    if (totalBirds > 0) {
      fcrPerHen = parseFloat((calculated.feedInGrams / totalBirds).toFixed(2));
      eggsPerHen = parseFloat((calculated.goodEggs / totalBirds).toFixed(4));
      productionRate = parseFloat(((calculated.goodEggs / totalBirds) * 100).toFixed(2));
      if (productionRate > 100) productionRate = 100;
    }
    
    // Create production with all calculated values
    const production = await DailyProduction.create({
      ...data,
      totalEggs: calculated.totalEggs,
      goodEggs: calculated.goodEggs,
      totalMortality: calculated.totalMortality,
      feedInGrams: calculated.feedInGrams,
      fcrPerHen,
      eggsPerHen,
      productionRate
    });
    
    // Update flock
    if (production.flockId) {
      const flock = await Flock.findById(production.flockId);
      if (flock) {
        flock.totalEggsProduced += calculated.goodEggs;
        flock.totalFeedConsumed += calculated.feedInGrams;
        flock.currentBirds -= calculated.totalMortality;
        if (flock.currentBirds < 0) flock.currentBirds = 0;
        await flock.save();
        console.log(`✅ CREATE - Flock "${flock.flockName}": currentBirds=${flock.currentBirds} (decreased by ${calculated.totalMortality})`);
      }
    }
    
    if (production.flockId) {
      await production.populate('flockId', 'flockName breed currentBirds');
    }
    
    return production;
  }
  
  async getAllProductions({ page = 1, limit = 30, startDate, endDate, sortBy = 'date', order = 'desc' }) {
    const query = {};
    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
    
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };
    
    const totalRecords = await DailyProduction.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);
    
    const productions = await DailyProduction.find(query)
      .populate('flockId', 'flockName breed currentBirds')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { productions, currentPage: page, totalPages, totalRecords, hasMore: page < totalPages };
  }
  
  async getProductionById(id) {
    const production = await DailyProduction.findById(id)
      .populate('flockId', 'flockName breed currentBirds');
    if (!production) throw new Error('Production record not found');
    return production;
  }
  
  async updateProduction(id, data) {
    console.log('\n═══════════════════════════════════════');
    console.log('🔄 UPDATE PRODUCTION - ID:', id);
    console.log('═══════════════════════════════════════');
    
    // STEP 1: Get OLD record
    const oldRecord = await DailyProduction.findById(id);
    if (!oldRecord) throw new Error('Production record not found');
    
    // STEP 2: Calculate OLD values
    const oldCalc = calculateProductionValues({
      stacks: oldRecord.stacks,
      crates: oldRecord.crates,
      looseEggs: oldRecord.looseEggs,
      brokenEggs: oldRecord.brokenEggs,
      diedHens: oldRecord.diedHens,
      culledHens: oldRecord.culledHens,
      feedQuantity: oldRecord.feedQuantity,
      feedUnit: oldRecord.feedUnit
    });
    
    console.log('\n📋 OLD VALUES:');
    console.log('  diedHens:', oldCalc.diedHens);
    console.log('  culledHens:', oldCalc.culledHens);
    console.log('  totalMortality:', oldCalc.totalMortality);
    console.log('  goodEggs:', oldCalc.goodEggs);
    console.log('  feedInGrams:', oldCalc.feedInGrams);
    console.log('  flockId:', oldRecord.flockId);
    
    // STEP 3: Calculate NEW values from incoming data
    const newCalc = calculateProductionValues({
      stacks: data.stacks !== undefined ? data.stacks : oldRecord.stacks,
      crates: data.crates !== undefined ? data.crates : oldRecord.crates,
      looseEggs: data.looseEggs !== undefined ? data.looseEggs : oldRecord.looseEggs,
      brokenEggs: data.brokenEggs !== undefined ? data.brokenEggs : oldRecord.brokenEggs,
      diedHens: data.diedHens !== undefined ? data.diedHens : oldRecord.diedHens,
      culledHens: data.culledHens !== undefined ? data.culledHens : oldRecord.culledHens,
      feedQuantity: data.feedQuantity !== undefined ? data.feedQuantity : oldRecord.feedQuantity,
      feedUnit: data.feedUnit !== undefined ? data.feedUnit : oldRecord.feedUnit
    });
    
    console.log('\n📋 NEW VALUES:');
    console.log('  diedHens:', newCalc.diedHens);
    console.log('  culledHens:', newCalc.culledHens);
    console.log('  totalMortality:', newCalc.totalMortality);
    console.log('  goodEggs:', newCalc.goodEggs);
    console.log('  feedInGrams:', newCalc.feedInGrams);
    
    // STEP 4: Calculate DIFFERENCES (New - Old)
    // For mortality: if old=2, new=1, diff=-1 (birds should INCREASE by 1)
    const diff = {
      goodEggs: newCalc.goodEggs - oldCalc.goodEggs,
      feedInGrams: newCalc.feedInGrams - oldCalc.feedInGrams,
      totalMortality: newCalc.totalMortality - oldCalc.totalMortality,
      diedHens: newCalc.diedHens - oldCalc.diedHens,
      culledHens: newCalc.culledHens - oldCalc.culledHens
    };
    
    console.log('\n📊 DIFFERENCES (New - Old):');
    console.log('  goodEggs:', diff.goodEggs);
    console.log('  feedInGrams:', diff.feedInGrams);
    console.log('  totalMortality:', diff.totalMortality);
    console.log('  diedHens:', diff.diedHens);
    console.log('  culledHens:', diff.culledHens);
    
    // STEP 5: Get total birds for FCR
    const activeFlocks = await Flock.find({ status: 'active' });
    let totalBirds = 0;
    activeFlocks.forEach(flock => { totalBirds += flock.currentBirds; });
    if (totalBirds === 0) {
      const settings = await FarmSettings.findOne();
      totalBirds = settings ? settings.initialHens : 1000;
    }
    
    // Calculate new FCR and production rate
    let fcrPerHen = 0;
    let eggsPerHen = 0;
    let productionRate = 0;
    if (totalBirds > 0) {
      fcrPerHen = parseFloat((newCalc.feedInGrams / totalBirds).toFixed(2));
      eggsPerHen = parseFloat((newCalc.goodEggs / totalBirds).toFixed(4));
      productionRate = parseFloat(((newCalc.goodEggs / totalBirds) * 100).toFixed(2));
      if (productionRate > 100) productionRate = 100;
    }
    
    // STEP 6: Update the production record directly with findByIdAndUpdate
    const updatedRecord = await DailyProduction.findByIdAndUpdate(
      id,
      {
        ...data,
        totalEggs: newCalc.totalEggs,
        goodEggs: newCalc.goodEggs,
        totalMortality: newCalc.totalMortality,
        feedInGrams: newCalc.feedInGrams,
        fcrPerHen,
        eggsPerHen,
        productionRate
      },
      { new: true, runValidators: true }
    ).populate('flockId', 'flockName breed currentBirds');
    
    // STEP 7: Update Flock - THIS IS THE KEY PART
    const flockId = data.flockId || oldRecord.flockId;
    
    if (flockId) {
      const flock = await Flock.findById(flockId);
      
      if (flock) {
        console.log('\n🐔 FLOCK BEFORE UPDATE:');
        console.log('  Name:', flock.flockName);
        console.log('  currentBirds:', flock.currentBirds);
        console.log('  totalEggsProduced:', flock.totalEggsProduced);
        console.log('  totalFeedConsumed:', flock.totalFeedConsumed);
        
        // Apply differences
        // NOTE: For mortality, flock.currentBirds DECREASES when totalMortality INCREASES
        // So: currentBirds = currentBirds - mortalityDiff
        // Example: old mortality=2, new mortality=1, diff=-1
        // currentBirds = 1000 - (-1) = 1001 ✅ Birds go UP
        flock.totalEggsProduced += diff.goodEggs;
        flock.totalFeedConsumed += diff.feedInGrams;
        flock.currentBirds -= diff.totalMortality;  // THIS IS CORRECT
        
        // Safety checks
        if (flock.currentBirds < 0) flock.currentBirds = 0;
        if (flock.currentBirds > flock.quantity) flock.currentBirds = flock.quantity;
        if (flock.totalEggsProduced < 0) flock.totalEggsProduced = 0;
        if (flock.totalFeedConsumed < 0) flock.totalFeedConsumed = 0;
        
        await flock.save();
        
        console.log('\n🐔 FLOCK AFTER UPDATE:');
        console.log('  Name:', flock.flockName);
        console.log('  currentBirds:', flock.currentBirds);
        console.log('  totalEggsProduced:', flock.totalEggsProduced);
        console.log('  totalFeedConsumed:', flock.totalFeedConsumed);
        
        if (diff.totalMortality !== 0) {
          console.log(`\n✅ MORTALITY CHANGE: ${oldCalc.totalMortality} → ${newCalc.totalMortality}`);
          console.log(`✅ BIRDS ADJUSTED BY: ${-diff.totalMortality} (${flock.currentBirds + diff.totalMortality} → ${flock.currentBirds})`);
        }
      } else {
        console.log('⚠️ Flock not found:', flockId);
      }
    }
    
    console.log('═══════════════════════════════════════\n');
    
    return updatedRecord;
  }
  
  async deleteProduction(id) {
    const production = await DailyProduction.findById(id);
    if (!production) throw new Error('Production record not found');
    
    // Reverse flock changes
    if (production.flockId) {
      const flock = await Flock.findById(production.flockId);
      if (flock) {
        const calc = calculateProductionValues({
          stacks: production.stacks,
          crates: production.crates,
          looseEggs: production.looseEggs,
          brokenEggs: production.brokenEggs,
          diedHens: production.diedHens,
          culledHens: production.culledHens,
          feedQuantity: production.feedQuantity,
          feedUnit: production.feedUnit
        });
        
        console.log('🗑️ DELETE - Reversing flock changes');
        console.log('   Before: currentBirds =', flock.currentBirds);
        
        flock.totalEggsProduced -= calc.goodEggs;
        flock.totalFeedConsumed -= calc.feedInGrams;
        flock.currentBirds += calc.totalMortality;
        
        if (flock.currentBirds > flock.quantity) flock.currentBirds = flock.quantity;
        if (flock.totalEggsProduced < 0) flock.totalEggsProduced = 0;
        if (flock.totalFeedConsumed < 0) flock.totalFeedConsumed = 0;
        
        await flock.save();
        console.log('   After: currentBirds =', flock.currentBirds);
      }
    }
    
    await DailyProduction.findByIdAndDelete(id);
    return production;
  }
  
  async getProductionTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const productions = await DailyProduction.find({ date: { $gte: startDate } }).sort({ date: 1 });
    
    const trends = productions.map(p => ({
      date: p.date,
      totalEggs: p.totalEggs,
      goodEggs: p.goodEggs,
      brokenEggs: p.brokenEggs,
      fcrPerHen: p.fcrPerHen,
      productionRate: p.productionRate,
      diedHens: p.diedHens,
      culledHens: p.culledHens,
      feedInGrams: p.feedInGrams
    }));
    
    const averages = {
      avgEggs: trends.length > 0 ? (trends.reduce((sum, t) => sum + t.totalEggs, 0) / trends.length).toFixed(0) : 0,
      avgFCR: trends.length > 0 ? (trends.reduce((sum, t) => sum + t.fcrPerHen, 0) / trends.length).toFixed(2) : 0,
      avgProductionRate: trends.length > 0 ? (trends.reduce((sum, t) => sum + t.productionRate, 0) / trends.length).toFixed(2) : 0,
      totalDied: trends.reduce((sum, t) => sum + (t.diedHens || 0), 0),
      totalCulled: trends.reduce((sum, t) => sum + (t.culledHens || 0), 0),
      bestDay: trends.length > 0 ? trends.reduce((max, t) => t.totalEggs > max.totalEggs ? t : max) : null,
      worstDay: trends.length > 0 ? trends.reduce((min, t) => t.totalEggs < min.totalEggs ? t : min) : null
    };
    
    return { trends, averages, days };
  }
  
  async getProductionComparison() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayProduction = await DailyProduction.findOne({
      date: { $gte: new Date(today.setHours(0,0,0,0)), $lt: new Date(today.setHours(23,59,59,999)) }
    });
    
    const yesterdayProduction = await DailyProduction.findOne({
      date: { $gte: new Date(yesterday.setHours(0,0,0,0)), $lt: new Date(yesterday.setHours(23,59,59,999)) }
    });
    
    return {
      today: todayProduction,
      yesterday: yesterdayProduction,
      comparison: todayProduction && yesterdayProduction ? {
        eggsChange: todayProduction.totalEggs - yesterdayProduction.totalEggs,
        eggsChangePercent: yesterdayProduction.totalEggs > 0 
          ? ((todayProduction.totalEggs - yesterdayProduction.totalEggs) / yesterdayProduction.totalEggs * 100).toFixed(2) : 0,
        fcrChange: todayProduction.fcrPerHen - yesterdayProduction.fcrPerHen,
        mortalityChange: todayProduction.totalMortality - yesterdayProduction.totalMortality
      } : null
    };
  }
  
  async getTodayProduction() {
    const today = new Date();
    return await DailyProduction.findOne({
      date: { $gte: new Date(today.setHours(0,0,0,0)), $lt: new Date(today.setHours(23,59,59,999)) }
    }).populate('flockId', 'flockName breed currentBirds');
  }
}

module.exports = new ProductionService();
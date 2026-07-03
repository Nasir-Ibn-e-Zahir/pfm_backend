const DailyProduction = require('../models/DailyProduction');
const FarmSettings = require('../models/FarmSettings');

class ProductionService {
  
  async createProduction(data) {
    const existingDate = await DailyProduction.findOne({ date: new Date(data.date) });
    if (existingDate) {
      throw new Error(`Production record already exists for ${new Date(data.date).toDateString()}`);
    }
    
    const production = await DailyProduction.create(data);
    return production;
  }
  
  async getAllProductions({ page = 1, limit = 30, startDate, endDate, sortBy = 'date', order = 'desc' }) {
    const query = {};
    if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
    if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
    
    const sortOrder = order === 'asc' ? 1 : -1;
    const totalRecords = await DailyProduction.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);
    
    const productions = await DailyProduction.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { productions, currentPage: page, totalPages, totalRecords, hasMore: page < totalPages };
  }
  
  async getProductionById(id) {
    const production = await DailyProduction.findById(id);
    if (!production) throw new Error('Production record not found');
    return production;
  }
  
  async updateProduction(id, data) {
    const oldProduction = await DailyProduction.findById(id);
    if (!oldProduction) throw new Error('Production record not found');
    
    // Store old mortality
    const oldTotalMortality = (oldProduction.diedHens || 0) + (oldProduction.culledHens || 0);
    
    // Update the record
    const updated = await DailyProduction.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    
    // Calculate new mortality
    const newTotalMortality = (updated.diedHens || 0) + (updated.culledHens || 0);
    const mortalityDiff = newTotalMortality - oldTotalMortality;
    
    // Adjust FarmSettings if mortality changed
    if (mortalityDiff !== 0) {
      const settings = await FarmSettings.findOne();
      if (settings) {
        settings.initialHens = Math.max(0, settings.initialHens - mortalityDiff);
        await settings.save();
        console.log(`✅ FarmSettings adjusted: ${mortalityDiff > 0 ? '-' : '+'}${Math.abs(mortalityDiff)} birds, remaining: ${settings.initialHens}`);
      }
    }
    
    return updated;
  }
  
  async deleteProduction(id) {
    const production = await DailyProduction.findById(id);
    if (!production) throw new Error('Production record not found');
    
    // Restore birds to FarmSettings
    const totalMortality = (production.diedHens || 0) + (production.culledHens || 0);
    if (totalMortality > 0) {
      const settings = await FarmSettings.findOne();
      if (settings) {
        settings.initialHens += totalMortality;
        await settings.save();
        console.log(`✅ FarmSettings restored: +${totalMortality} birds, now: ${settings.initialHens}`);
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
      feedInGrams: p.feedInGrams,
    }));
    
    const averages = {
      avgEggs: trends.length > 0 ? (trends.reduce((sum, t) => sum + t.totalEggs, 0) / trends.length).toFixed(0) : 0,
      avgFCR: trends.length > 0 ? (trends.reduce((sum, t) => sum + t.fcrPerHen, 0) / trends.length).toFixed(2) : 0,
      avgProductionRate: trends.length > 0 ? (trends.reduce((sum, t) => sum + t.productionRate, 0) / trends.length).toFixed(2) : 0,
      totalDied: trends.reduce((sum, t) => sum + (t.diedHens || 0), 0),
      totalCulled: trends.reduce((sum, t) => sum + (t.culledHens || 0), 0),
      bestDay: trends.length > 0 ? trends.reduce((max, t) => t.totalEggs > max.totalEggs ? t : max) : null,
      worstDay: trends.length > 0 ? trends.reduce((min, t) => t.totalEggs < min.totalEggs ? t : min) : null,
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
        mortalityChange: todayProduction.totalMortality - yesterdayProduction.totalMortality,
      } : null
    };
  }
  
  async getTodayProduction() {
    const today = new Date();
    return await DailyProduction.findOne({
      date: { $gte: new Date(today.setHours(0,0,0,0)), $lt: new Date(today.setHours(23,59,59,999)) }
    });
  }
}

module.exports = new ProductionService();
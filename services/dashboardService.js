const DailyProduction = require('../models/DailyProduction');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Medicine = require('../models/Medicine');
const FarmSettings = require('../models/FarmSettings');

const getDashboard = async (period = 'all') => {
  try {
    let dateFilter = {};
    const today = new Date();
    
    if (period === 'today') {
      dateFilter = { date: { $gte: new Date(today.setHours(0,0,0,0)), $lt: new Date(today.setHours(23,59,59,999)) } };
    } else if (period === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { date: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { date: { $gte: monthAgo } };
    }

    const productions = await DailyProduction.find(dateFilter).sort({ date: -1 });
    const sales = await Sale.find(dateFilter).populate('customerId', 'name phone');
    const expenses = await Expense.find(dateFilter);
    const settings = await FarmSettings.findOne();
    
    // Active birds from FarmSettings
    const totalBirds = settings ? settings.initialHens : 0;
    
    // Production stats
    let totalEggsProduced = 0, totalBrokenEggs = 0, totalDied = 0, totalCulled = 0;
    productions.forEach(p => {
      totalEggsProduced += p.totalEggs;
      totalBrokenEggs += p.brokenEggs;
      totalDied += p.diedHens;
      totalCulled += p.culledHens;
    });
    
    // Sales stats
    let totalStacksSold = 0, totalLooseEggsSold = 0, totalEggsSold = 0;
    let totalRevenue = 0, totalPaid = 0;
    sales.forEach(s => {
      totalStacksSold += s.stacksSold || 0;
      totalLooseEggsSold += s.looseEggsSold || 0;
      totalEggsSold += s.totalEggsInSale || 0;
      totalRevenue += s.totalAmount;
      totalPaid += s.paidAmount;
    });
    
    // Expense stats
    let totalExpenses = 0;
    const expensesByCategory = {};
    expenses.forEach(e => {
      totalExpenses += e.amount;
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });
    
    // Stock calculation
    const currentStock = totalEggsProduced - totalEggsSold - totalBrokenEggs;
    
    // Today
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    
    const todayProduction = await DailyProduction.findOne({ date: { $gte: todayStart, $lt: todayEnd } });
    const todaySales = await Sale.find({ date: { $gte: todayStart, $lt: todayEnd } });
    
    let todayEggs = todayProduction ? todayProduction.totalEggs : 0;
    let todayRevenue = 0;
    todaySales.forEach(s => todayRevenue += s.totalAmount);
    
    const todayExpenses = await Expense.find({ date: { $gte: todayStart, $lt: todayEnd } });
    let todayExpenseAmount = 0;
    todayExpenses.forEach(e => todayExpenseAmount += e.amount);
    
    // Trends
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendProductions = await DailyProduction.find({ date: { $gte: thirtyDaysAgo } }).sort({ date: 1 });
    
    const productionTrend = trendProductions.map(p => ({
      date: p.date,
      totalEggs: p.totalEggs,
      fcr: p.fcrPerHen,
      productionRate: p.productionRate,
      diedHens: p.diedHens,
    }));
    
    // Averages
    const avgFCR = productions.length > 0 ? (productions.reduce((sum, p) => sum + p.fcrPerHen, 0) / productions.length).toFixed(2) : 0;
    const avgProductionRate = productions.length > 0 ? (productions.reduce((sum, p) => sum + p.productionRate, 0) / productions.length).toFixed(2) : 0;
    
    const bestDay = productions.length > 0 ? productions.reduce((max, p) => p.totalEggs > max.totalEggs ? p : max) : null;
    const worstDay = productions.length > 0 ? productions.reduce((min, p) => p.totalEggs < min.totalEggs ? p : min) : null;
    
    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0;
    
    const lowStockMeds = await Medicine.find({ status: 'low_stock' });
    const expiredMeds = await Medicine.find({ status: 'expired' });
    
    return {
      overview: {
        totalBirds,
        totalEggsProduced,
        totalEggsSold,
        currentStock,
        totalRevenue,
        totalPaid,
        totalReceivable: totalRevenue - totalPaid,
        totalExpenses,
        grossProfit,
        profitMargin,
        totalStacksSold,
        totalLooseEggsSold,
      },
      mortality: {
        totalDied,
        totalCulled,
        mortalityRate: settings && settings.initialHens > 0 ? ((totalDied / (settings.initialHens + totalDied)) * 100).toFixed(2) : 0,
      },
      production: {
        totalEggsProduced,
        totalBrokenEggs,
        averageFCR: avgFCR,
        averageProductionRate: avgProductionRate,
        bestDay,
        worstDay,
        trend: productionTrend,
      },
      sales: { totalRevenue, totalStacksSold, totalEggsSold },
      expenses: { totalExpenses, byCategory: expensesByCategory },
      today: {
        eggsProduced: todayEggs,
        revenue: todayRevenue,
        expenses: todayExpenseAmount,
        profit: todayRevenue - todayExpenseAmount,
      },
      alerts: {
        lowStockMeds: lowStockMeds.length,
        expiredMeds: expiredMeds.length,
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = { getDashboard };
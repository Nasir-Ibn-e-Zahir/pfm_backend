const dashboardService = require('../services/dashboardService');

const getDashboard = async (req, res, next) => {
  try {
    const { period } = req.query;
    const data = await dashboardService.getDashboard(period);
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
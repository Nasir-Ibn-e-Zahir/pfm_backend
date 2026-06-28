const productionService = require('../services/productionService');

const createProduction = async (req, res, next) => {
  try {
    const production = await productionService.createProduction(req.body);
    res.status(201).json({
      success: true,
      data: production,
      message: 'Production record created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Production record already exists for this date'
      });
    }
    next(error);
  }
};

const getAllProductions = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, startDate, endDate, sortBy = 'date', order = 'desc' } = req.query;
    
    const result = await productionService.getAllProductions({
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      sortBy,
      order
    });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const getProductionById = async (req, res, next) => {
  try {
    const production = await productionService.getProductionById(req.params.id);
    res.status(200).json({
      success: true,
      data: production
    });
  } catch (error) {
    if (error.message === 'Production record not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const updateProduction = async (req, res, next) => {
  try {
    const production = await productionService.updateProduction(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: production,
      message: 'Production record updated successfully'
    });
  } catch (error) {
    if (error.message === 'Production record not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const deleteProduction = async (req, res, next) => {
  try {
    await productionService.deleteProduction(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Production record deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Production record not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const getProductionTrends = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const trends = await productionService.getProductionTrends(parseInt(days));
    
    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

const getProductionComparison = async (req, res, next) => {
  try {
    const comparison = await productionService.getProductionComparison();
    
    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
};

const getTodayProduction = async (req, res, next) => {
  try {
    const todayProduction = await productionService.getTodayProduction();
    
    res.status(200).json({
      success: true,
      data: todayProduction
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduction,
  getAllProductions,
  getProductionById,
  updateProduction,
  deleteProduction,
  getProductionTrends,
  getProductionComparison,
  getTodayProduction
};
const FarmSettings = require('../models/FarmSettings');

const getFarmSettings = async (req, res, next) => {
  try {
    const settings = await FarmSettings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

const createOrUpdateFarm = async (req, res, next) => {
  try {
    const existing = await FarmSettings.findOne();
    let settings;
    
    if (existing) {
      settings = await FarmSettings.findByIdAndUpdate(
        existing._id,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      settings = await FarmSettings.create(req.body);
    }
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Farm settings saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFarmSettings, createOrUpdateFarm };
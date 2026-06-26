const Flock = require('../models/Flock');

const createFlock = async (req, res, next) => {
  try {
    const flock = await Flock.create(req.body);
    res.status(201).json({
      success: true,
      data: flock,
      message: 'Flock created successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getAllFlocks = async (req, res, next) => {
  try {
    const flocks = await Flock.find().sort({ arrivalDate: -1 });
    res.status(200).json({
      success: true,
      data: flocks
    });
  } catch (error) {
    next(error);
  }
};

const getFlockById = async (req, res, next) => {
  try {
    const flock = await Flock.findById(req.params.id);
    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found'
      });
    }
    res.status(200).json({
      success: true,
      data: flock
    });
  } catch (error) {
    next(error);
  }
};

const updateFlock = async (req, res, next) => {
  try {
    const flock = await Flock.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found'
      });
    }
    res.status(200).json({
      success: true,
      data: flock,
      message: 'Flock updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteFlock = async (req, res, next) => {
  try {
    const flock = await Flock.findByIdAndDelete(req.params.id);
    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Flock deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFlock,
  getAllFlocks,
  getFlockById,
  updateFlock,
  deleteFlock
};
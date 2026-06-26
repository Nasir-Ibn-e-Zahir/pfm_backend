const express = require('express');
const router = express.Router();
const MedicineLog = require('../models/MedicineLog');

router.post('/', async (req, res, next) => {
  try {
    const log = await MedicineLog.create(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const logs = await MedicineLog.find()
      .populate('medicineId', 'name type')
      .populate('flockId', 'flockName')
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const farmSettingsController = require('../controllers/farmSettingsController');

const farmValidation = [
  body('farmName').notEmpty().withMessage('Farm name is required'),
  body('ownerName').notEmpty().withMessage('Owner name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('initialHens').isInt({ min: 0 }).withMessage('Initial hens required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  validate
];

router.get('/', farmSettingsController.getFarmSettings);
router.post('/', farmValidation, farmSettingsController.createOrUpdateFarm);

module.exports = router;
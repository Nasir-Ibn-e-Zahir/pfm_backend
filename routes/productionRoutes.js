const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const productionController = require('../controllers/productionController');

const productionValidation = [
  body('date').notEmpty().withMessage('Date is required').isISO8601().toDate(),
  body('stacks').optional().isInt({ min: 0, max: 1000 }).withMessage('Stacks must be 0-1000'),
  body('crates').optional().isInt({ min: 0, max: 100 }).withMessage('Crates must be 0-100'),
  body('looseEggs').optional().isInt({ min: 0, max: 29 }).withMessage('Loose eggs must be 0-29'),
  body('feedQuantity').isFloat({ min: 0 }).withMessage('Feed quantity required'),
  body('feedUnit').isIn(['bags', 'kg', 'grams', 'tons']).withMessage('Invalid feed unit'),
  body('diedHens').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('culledHens').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('brokenEggs').optional().isInt({ min: 0 }).withMessage('Must be positive'),
  body('weather').optional().isIn(['sunny', 'cloudy', 'rainy', 'hot', 'cold', 'normal', 'windy', 'humid']),
  validate
];

router.post('/', productionValidation, productionController.createProduction);
router.get('/', productionController.getAllProductions);
router.get('/trends', productionController.getProductionTrends);
router.get('/comparison', productionController.getProductionComparison);
router.get('/today', productionController.getTodayProduction);
router.get('/:id', productionController.getProductionById);
router.put('/:id', productionValidation, productionController.updateProduction);
router.delete('/:id', productionController.deleteProduction);

module.exports = router;
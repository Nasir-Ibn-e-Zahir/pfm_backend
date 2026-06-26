const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const salesController = require('../controllers/salesController');

const saleValidation = [
  body('date').notEmpty().withMessage('Date is required'),
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('pricePerStack').isFloat({ min: 0 }).withMessage('Price per stack is required'),
  body('stacksSold').optional().isFloat({ min: 0 }).withMessage('Stacks sold must be 0 or more'),
  body('looseEggsSold').optional().isInt({ min: 0 }).withMessage('Loose eggs must be 0 or more'),
  body('pricePerEgg').optional().isFloat({ min: 0 }).withMessage('Price per egg must be 0 or more'),
  body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be 0 or more'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
  body('paymentMethod').optional().isIn(['cash', 'bank_transfer', 'credit', 'cheque', 'upi', 'other']),
  body('notes').optional().isString(),
  validate
];

router.post('/', saleValidation, salesController.createSale);
router.get('/', salesController.getAllSales);
router.get('/ledger/:customerId', salesController.getCustomerLedger);
router.get('/:id', salesController.getSaleById);
router.put('/:id', saleValidation, salesController.updateSale);
router.delete('/:id', salesController.deleteSale);

module.exports = router;
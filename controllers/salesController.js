const Sale = require('../models/Sale');

const createSale = async (req, res, next) => {
  try {
    const sale = await Sale.create(req.body);
    await sale.populate('customerId', 'name phone');
    
    res.status(201).json({
      success: true,
      data: sale,
      message: 'Sale recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getAllSales = async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate('customerId', 'name phone')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customerId', 'name phone');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId', 'name phone');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: sale,
      message: 'Sale updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    // Update customer balance after deletion
    const Customer = require('../models/Customer');
    const customer = await Customer.findById(sale.customerId);
    if (customer) {
      customer.currentBalance -= sale.remainingAmount;
      customer.totalPurchases -= sale.totalAmount;
      customer.totalPaid -= sale.paidAmount;
      if (customer.currentBalance < 0) customer.currentBalance = 0;
      if (customer.totalPurchases < 0) customer.totalPurchases = 0;
      if (customer.totalPaid < 0) customer.totalPaid = 0;
      await customer.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerLedger = async (req, res, next) => {
  try {
    const sales = await Sale.find({ customerId: req.params.customerId })
      .populate('customerId', 'name phone')
      .sort({ date: -1 });
    
    let totalAmount = 0;
    let totalPaid = 0;
    let totalStacks = 0;
    let totalLooseEggs = 0;
    
    sales.forEach(sale => {
      totalAmount += sale.totalAmount;
      totalPaid += sale.paidAmount;
      totalStacks += sale.stacksSold;
      totalLooseEggs += sale.looseEggsSold;
    });
    
    res.status(200).json({
      success: true,
      data: {
        customer: sales.length > 0 ? sales[0].customerId : null,
        summary: {
          totalSales: sales.length,
          totalStacks,
          totalLooseEggs,
          totalEggsSold: (totalStacks * 360) + totalLooseEggs,
          totalAmount,
          totalPaid,
          remainingBalance: totalAmount - totalPaid
        },
        transactions: sales
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  getCustomerLedger
};
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');

// Helper: Calculate sale amounts
function calculateSaleAmounts(data) {
  const stacksSold = data.stacksSold || 0;
  const pricePerStack = data.pricePerStack || 0;
  const looseEggsSold = data.looseEggsSold || 0;
  const pricePerEgg = data.pricePerEgg || 0;
  const discount = data.discount || 0;
  const paidAmount = data.paidAmount || 0;
  
  const totalStackAmount = stacksSold * pricePerStack;
  const totalEggAmount = looseEggsSold * pricePerEgg;
  const subtotal = totalStackAmount + totalEggAmount;
  const totalAmount = Math.max(0, subtotal - discount);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const totalEggsInSale = (stacksSold * 360) + looseEggsSold;
  
  let paymentStatus = 'pending';
  if (paidAmount >= totalAmount) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  }
  
  return {
    totalStackAmount,
    totalEggAmount,
    subtotal,
    totalAmount,
    remainingAmount,
    paymentStatus,
    totalEggsInSale
  };
}

// Helper: Update customer balance
async function recalculateCustomerBalance(customerId) {
  const allSales = await Sale.find({ customerId });
  
  let totalPurchases = 0;
  let totalPaid = 0;
  let currentBalance = 0;
  
  allSales.forEach(sale => {
    totalPurchases += sale.totalAmount;
    totalPaid += sale.paidAmount;
    currentBalance += sale.remainingAmount;
  });
  
  await Customer.findByIdAndUpdate(customerId, {
    currentBalance: currentBalance,
    totalPurchases: totalPurchases,
    totalPaid: totalPaid,
    lastPurchaseDate: allSales.length > 0 ? allSales[allSales.length - 1].date : null
  });
  
  console.log(`📊 Customer balance recalculated: Purchases=${totalPurchases}, Paid=${totalPaid}, Balance=${currentBalance}`);
}

const createSale = async (req, res, next) => {
  try {
    console.log('\n🆕 ========== CREATE SALE ==========');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Calculate all amounts
    const calculated = calculateSaleAmounts(req.body);
    
    // Create sale with calculated values
    const sale = await Sale.create({
      ...req.body,
      ...calculated
    });
    
    await sale.populate('customerId', 'name phone');
    
    // Update customer balance
    await recalculateCustomerBalance(sale.customerId);
    
    console.log('✅ Sale created:', sale.invoiceNumber);
    console.log('   Stacks:', sale.stacksSold, '| Eggs:', sale.looseEggsSold);
    console.log('   Total Eggs:', sale.totalEggsInSale);
    console.log('   Total Amount:', sale.totalAmount);
    console.log('   Remaining:', sale.remainingAmount);
    console.log('====================================\n');
    
    res.status(201).json({
      success: true,
      data: sale,
      message: 'Sale recorded successfully'
    });
  } catch (error) {
    console.error('❌ Create sale error:', error);
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
      count: sales.length,
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
    console.log('\n🔄 ========== UPDATE SALE ==========');
    console.log('Sale ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    // Find the old sale
    const oldSale = await Sale.findById(req.params.id);
    
    if (!oldSale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    console.log('\n📋 OLD SALE VALUES:');
    console.log('  stacksSold:', oldSale.stacksSold);
    console.log('  looseEggsSold:', oldSale.looseEggsSold);
    console.log('  totalEggsInSale:', oldSale.totalEggsInSale);
    console.log('  totalAmount:', oldSale.totalAmount);
    console.log('  paidAmount:', oldSale.paidAmount);
    console.log('  remainingAmount:', oldSale.remainingAmount);
    console.log('  customerId:', oldSale.customerId);
    
    // Store old customer ID in case it changes
    const oldCustomerId = oldSale.customerId;
    
    // Calculate new values
    const calculated = calculateSaleAmounts({
      stacksSold: req.body.stacksSold !== undefined ? req.body.stacksSold : oldSale.stacksSold,
      pricePerStack: req.body.pricePerStack !== undefined ? req.body.pricePerStack : oldSale.pricePerStack,
      looseEggsSold: req.body.looseEggsSold !== undefined ? req.body.looseEggsSold : oldSale.looseEggsSold,
      pricePerEgg: req.body.pricePerEgg !== undefined ? req.body.pricePerEgg : oldSale.pricePerEgg,
      discount: req.body.discount !== undefined ? req.body.discount : oldSale.discount,
      paidAmount: req.body.paidAmount !== undefined ? req.body.paidAmount : oldSale.paidAmount,
    });
    
    console.log('\n📋 NEW CALCULATED VALUES:');
    console.log('  totalEggsInSale:', calculated.totalEggsInSale);
    console.log('  totalAmount:', calculated.totalAmount);
    console.log('  remainingAmount:', calculated.remainingAmount);
    console.log('  paymentStatus:', calculated.paymentStatus);
    
    // Calculate stock changes
    const oldEggsSold = oldSale.totalEggsInSale || 0;
    const newEggsSold = calculated.totalEggsInSale;
    const eggsDifference = newEggsSold - oldEggsSold;
    
    console.log('\n📊 STOCK CHANGE:');
    console.log('  Old eggs sold:', oldEggsSold);
    console.log('  New eggs sold:', newEggsSold);
    console.log('  Difference:', eggsDifference, eggsDifference > 0 ? '(MORE sold - stock decreased)' : eggsDifference < 0 ? '(LESS sold - stock increased)' : '(No change)');
    
    // Update the sale
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...calculated
      },
      { new: true, runValidators: true }
    ).populate('customerId', 'name phone');
    
    console.log('✅ Sale updated:', updatedSale.invoiceNumber);
    
    // Update old customer balance if customer changed
    if (oldCustomerId.toString() !== (req.body.customerId || oldCustomerId.toString())) {
      console.log('👤 Customer changed - updating both old and new customer balances');
      await recalculateCustomerBalance(oldCustomerId);
    }
    
    // Update new customer balance
    await recalculateCustomerBalance(updatedSale.customerId);
    
    console.log('====================================\n');
    
    res.status(200).json({
      success: true,
      data: updatedSale,
      message: 'Sale updated successfully'
    });
  } catch (error) {
    console.error('❌ Update sale error:', error);
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    console.log('\n🗑️ ========== DELETE SALE ==========');
    console.log('Sale ID:', req.params.id);
    
    // Find the sale before deleting
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }
    
    console.log('\n📋 SALE BEING DELETED:');
    console.log('  Invoice:', sale.invoiceNumber);
    console.log('  stacksSold:', sale.stacksSold);
    console.log('  looseEggsSold:', sale.looseEggsSold);
    console.log('  totalEggsInSale:', sale.totalEggsInSale, '(These eggs will return to stock)');
    console.log('  totalAmount:', sale.totalAmount);
    console.log('  remainingAmount:', sale.remainingAmount);
    console.log('  customerId:', sale.customerId);
    
    const customerId = sale.customerId;
    const eggsReturned = sale.totalEggsInSale || 0;
    
    // Delete the sale
    await Sale.findByIdAndDelete(req.params.id);
    
    // Update customer balance
    await recalculateCustomerBalance(customerId);
    
    console.log('✅ Sale deleted successfully');
    console.log('📦 Eggs returned to stock:', eggsReturned);
    console.log('====================================\n');
    
    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully',
      data: {
        eggsReturnedToStock: eggsReturned,
        stacksReturned: Math.floor(eggsReturned / 360),
        cratesReturned: Math.floor((eggsReturned % 360) / 30),
        looseEggsReturned: eggsReturned % 30
      }
    });
  } catch (error) {
    console.error('❌ Delete sale error:', error);
    next(error);
  }
};

const getCustomerLedger = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const sales = await Sale.find({ customerId })
      .sort({ date: -1 });
    
    let totalStacks = 0;
    let totalLooseEggs = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    
    const transactions = sales.map(sale => {
      totalStacks += sale.stacksSold || 0;
      totalLooseEggs += sale.looseEggsSold || 0;
      totalAmount += sale.totalAmount;
      totalPaid += sale.paidAmount;
      
      return {
        _id: sale._id,
        date: sale.date,
        invoiceNumber: sale.invoiceNumber,
        stacksSold: sale.stacksSold,
        pricePerStack: sale.pricePerStack,
        looseEggsSold: sale.looseEggsSold,
        pricePerEgg: sale.pricePerEgg,
        totalEggsInSale: sale.totalEggsInSale,
        totalAmount: sale.totalAmount,
        paidAmount: sale.paidAmount,
        remainingAmount: sale.remainingAmount,
        paymentStatus: sale.paymentStatus,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes,
        createdAt: sale.createdAt
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          currentBalance: customer.currentBalance,
          totalPurchases: customer.totalPurchases
        },
        summary: {
          totalTransactions: sales.length,
          totalStacksSold: totalStacks,
          totalLooseEggsSold: totalLooseEggs,
          totalEggsSold: (totalStacks * 360) + totalLooseEggs,
          totalAmount: totalAmount,
          totalPaid: totalPaid,
          remainingBalance: totalAmount - totalPaid
        },
        transactions: transactions
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
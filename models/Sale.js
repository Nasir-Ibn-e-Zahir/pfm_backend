const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Sale date is required'],
    default: Date.now
  },
  invoiceNumber: {
    type: String,
    unique: true,
    default: function() {
      return 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  
  // === STACK SALES (1 Stack = 360 Eggs) ===
  stacksSold: {
    type: Number,
    default: 0,
    min: [0, 'Stacks sold cannot be negative']
  },
  pricePerStack: {
    type: Number,
    required: [true, 'Price per stack is required'],
    min: [0, 'Price cannot be negative']
  },
  
  // === LOOSE EGG SALES ===
  looseEggsSold: {
    type: Number,
    default: 0,
    min: [0, 'Loose eggs cannot be negative']
  },
  pricePerEgg: {
    type: Number,
    default: 0,
    min: [0, 'Price per egg cannot be negative']
  },
  
  // === CALCULATED AMOUNTS ===
  totalStackAmount: {
    type: Number,
    default: 0
  },
  totalEggAmount: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  
  // === PAYMENT DETAILS ===
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partial', 'pending', 'overdue'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit', 'cheque', 'upi', 'other'],
    default: 'cash'
  },
  paymentReference: {
    type: String,
    trim: true
  },
  
  // === DELIVERY DETAILS ===
  deliveryStatus: {
    type: String,
    enum: ['pending', 'dispatched', 'delivered', 'cancelled'],
    default: 'delivered'
  },
  
  // === ADDITIONAL INFO ===
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes too long']
  }
}, { 
  timestamps: true 
});

// Virtual for total eggs sold
saleSchema.virtual('totalEggsSold').get(function() {
  return (this.stacksSold * 360) + this.looseEggsSold;
});

// Pre-save middleware
saleSchema.pre('save', async function(next) {
  try {
    // Calculate amounts
    this.totalStackAmount = this.stacksSold * this.pricePerStack;
    this.totalEggAmount = this.looseEggsSold * this.pricePerEgg;
    this.subtotal = this.totalStackAmount + this.totalEggAmount;
    this.totalAmount = this.subtotal - this.discount;
    if (this.totalAmount < 0) this.totalAmount = 0;
    
    // Calculate remaining amount
    this.remainingAmount = this.totalAmount - this.paidAmount;
    
    // Set payment status
    if (this.paidAmount >= this.totalAmount) {
      this.paymentStatus = 'paid';
    } else if (this.paidAmount > 0) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'pending';
    }
    
    // Update customer balance if this is a new sale
    if (this.isNew) {
      const Customer = mongoose.model('Customer');
      const customer = await Customer.findById(this.customerId);
      
      if (customer) {
        customer.currentBalance += this.remainingAmount;
        customer.totalPurchases += this.totalAmount;
        customer.totalPaid += this.paidAmount;
        customer.lastPurchaseDate = this.date;
        await customer.save();
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-update middleware for customer balance
saleSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const Customer = mongoose.model('Customer');
      const allSales = await mongoose.model('Sale').find({ customerId: doc.customerId });
      
      let totalBalance = 0;
      let totalPurchases = 0;
      let totalPaid = 0;
      
      allSales.forEach(sale => {
        totalBalance += sale.remainingAmount;
        totalPurchases += sale.totalAmount;
        totalPaid += sale.paidAmount;
      });
      
      await Customer.findByIdAndUpdate(doc.customerId, {
        currentBalance: totalBalance,
        totalPurchases: totalPurchases,
        totalPaid: totalPaid,
        lastPurchaseDate: allSales.length > 0 ? allSales[allSales.length - 1].date : null
      });
    } catch (error) {
      console.error('Error updating customer after sale update:', error);
    }
  }
});

// Indexes
saleSchema.index({ date: -1 });
saleSchema.index({ customerId: 1, date: -1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model("Sale", saleSchema);
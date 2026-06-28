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
  
  // STACK SALES (1 Stack = 360 Eggs)
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
  
  // LOOSE EGG SALES
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
  
  // CALCULATED AMOUNTS
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
  
  // PAYMENT DETAILS
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
  
  // DELIVERY
  deliveryStatus: {
    type: String,
    enum: ['pending', 'dispatched', 'delivered', 'cancelled'],
    default: 'delivered'
  },
  
  // TOTAL EGGS IN THIS SALE
  totalEggsInSale: {
    type: Number,
    default: 0
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes too long']
  }
}, { 
  timestamps: true 
});

// Indexes
saleSchema.index({ date: -1 });
saleSchema.index({ customerId: 1, date: -1 });
saleSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Sale", saleSchema);
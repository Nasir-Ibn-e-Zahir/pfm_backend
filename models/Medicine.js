const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    minlength: [2, 'Name too short'],
    maxlength: [100, 'Name too long']
  },
  type: {
    type: String,
    enum: [
      'vaccine', 'antibiotic', 'vitamin', 'supplement', 
      'dewormer', 'disinfectant', 'probiotic', 'hormone', 'other'
    ],
    required: [true, 'Medicine type is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description too long']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true,
    required: [true, 'Batch number is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    enum: ['ml', 'litre', 'gm', 'kg', 'tablet', 'capsule', 'bottle', 'vial', 'packet', 'dose', 'sachet'],
    required: [true, 'Unit is required']
  },
  costPerUnit: {
    type: Number,
    required: [true, 'Cost per unit is required'],
    min: [0, 'Cost cannot be negative']
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(expiryDate) {
        return expiryDate > this.purchaseDate;
      },
      message: 'Expiry date must be after purchase date'
    }
  },
  supplier: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true }
  },
  currentStock: {
    type: Number,
    default: function() { return this.quantity; },
    min: 0
  },
  minimumStockLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'low_stock', 'out_of_stock', 'expired', 'expiring_soon'],
    default: 'available'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes too long']
  }
}, { 
  timestamps: true 
});

// Pre-save middleware
medicineSchema.pre('save', function(next) {
  this.totalCost = this.quantity * this.costPerUnit;
  
  if (this.expiryDate < new Date()) {
    this.status = 'expired';
  } else if (this.currentStock === 0) {
    this.status = 'out_of_stock';
  } else if (this.currentStock <= this.minimumStockLevel) {
    this.status = 'low_stock';
  } else {
    const daysUntilExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30) {
      this.status = 'expiring_soon';
    } else {
      this.status = 'available';
    }
  }
  
  next();
});

// Indexes
medicineSchema.index({ status: 1 });
medicineSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("Medicine", medicineSchema);
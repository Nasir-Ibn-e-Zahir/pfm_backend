const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: [2, 'Name too short'],
    maxlength: [100, 'Name too long']
  },
  category: {
    type: String,
    enum: [
      'crate', 'feeder', 'drinker', 'nest_box', 
      'lighting', 'heater', 'cooler', 'ventilation',
      'cleaning', 'egg_tray', 'packaging', 'equipment',
      'spare_parts', 'safety_gear', 'other'
    ],
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description too long']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    enum: ['piece', 'set', 'packet', 'box', 'roll', 'litre', 'kg', 'meter', 'unit'],
    default: 'piece'
  },
  unitCost: {
    type: Number,
    required: [true, 'Unit cost is required'],
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
  supplier: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true }
  },
  warrantyUntil: {
    type: Date
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
  location: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['new', 'good', 'fair', 'poor', 'damaged'],
    default: 'new'
  },
  status: {
    type: String,
    enum: ['available', 'low_stock', 'out_of_stock', 'damaged', 'disposed'],
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
inventorySchema.pre('save', function(next) {
  this.totalCost = this.quantity * this.unitCost;
  
  if (this.currentStock === 0) {
    this.status = 'out_of_stock';
  } else if (this.currentStock <= this.minimumStockLevel) {
    this.status = 'low_stock';
  } else if (this.condition === 'damaged') {
    this.status = 'damaged';
  } else {
    this.status = 'available';
  }
  
  next();
});

// Indexes
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
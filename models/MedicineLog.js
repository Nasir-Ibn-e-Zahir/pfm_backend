const mongoose = require("mongoose");

const medicineLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine is required']
  },
  flockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flock',
    required: false
  },
  dosage: {
    type: Number,
    required: [true, 'Dosage is required'],
    min: [0, 'Dosage cannot be negative']
  },
  dosageUnit: {
    type: String,
    enum: ['ml', 'gm', 'mg', 'tablet', 'capsule', 'drop', 'dose'],
    required: true
  },
  quantityUsed: {
    type: Number,
    required: [true, 'Quantity used is required'],
    min: [0, 'Quantity cannot be negative']
  },
  administrationMethod: {
    type: String,
    enum: ['drinking_water', 'feed_mix', 'injection', 'oral', 'spray', 'eye_drop', 'other'],
    default: 'drinking_water'
  },
  administeredBy: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [300, 'Reason too long']
  },
  withdrawalPeriod: {
    type: Number,
    default: 0
  },
  effectiveness: {
    type: String,
    enum: ['excellent', 'good', 'moderate', 'poor', 'none', 'unknown'],
    default: 'unknown'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes too long']
  }
}, { 
  timestamps: true 
});

// Post-save middleware to update medicine stock
medicineLogSchema.post('save', async function(doc) {
  try {
    const Medicine = mongoose.model('Medicine');
    const medicine = await Medicine.findById(doc.medicineId);
    
    if (medicine) {
      medicine.currentStock = Math.max(0, medicine.currentStock - doc.quantityUsed);
      await medicine.save();
      console.log(`Updated medicine stock: ${medicine.name} - ${medicine.currentStock} remaining`);
    }
  } catch (error) {
    console.error('Error updating medicine stock:', error.message);
  }
});

// Indexes
medicineLogSchema.index({ date: -1 });
medicineLogSchema.index({ medicineId: 1, date: -1 });
medicineLogSchema.index({ flockId: 1, date: -1 });

module.exports = mongoose.model("MedicineLog", medicineLogSchema);
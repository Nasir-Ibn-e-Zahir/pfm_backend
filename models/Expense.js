const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  category: {
    type: String,
    enum: [
      'feed', 'medicine', 'vaccination', 'labor',
      'electricity', 'water', 'gas', 'transport',
      'maintenance', 'repair', 'packaging', 'marketing',
      'insurance', 'tax', 'rent', 'equipment',
      'chicks', 'bedding', 'cleaning', 'miscellaneous', 'other'
    ],
    required: [true, 'Expense category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [300, 'Description too long']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  quantity: {
    type: Number,
    min: 0
  },
  unit: {
    type: String,
    trim: true
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'cheque', 'upi', 'other'],
    default: 'cash'
  },
  supplier: {
    name: { type: String, trim: true },
    contact: { type: String, trim: true }
  },
  receiptNumber: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: null
  },
  taxDeductible: {
    type: Boolean,
    default: false
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
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
const mongoose = require("mongoose");

const flockSchema = new mongoose.Schema({
  flockName: {
    type: String,
    required: [true, 'Flock/Batch name is required'],
    trim: true,
    minlength: [2, 'Flock name must be at least 2 characters'],
    maxlength: [50, 'Flock name cannot exceed 50 characters']
  },
  breed: {
    type: String,
    required: [true, 'Breed is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    max: [50000, 'Quantity cannot exceed 50,000']
  },
  arrivalDate: {
    type: Date,
    required: [true, 'Arrival date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Arrival date cannot be in the future'
    }
  },
  initialAgeInWeeks: {
    type: Number,
    default: 18,
    min: [0, 'Age cannot be negative'],
    max: [100, 'Age cannot exceed 100 weeks']
  },
  source: {
    type: String,
    trim: true,
    maxlength: [100, 'Source name too long']
  },
  costPerBird: {
    type: Number,
    required: [true, 'Cost per bird is required'],
    min: [0, 'Cost cannot be negative']
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'culled', 'completed', 'quarantine'],
    default: 'active'
  },
  currentBirds: {
    type: Number,
    default: function() { 
      return this.quantity; 
    },
    min: 0
  },
  totalEggsProduced: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFeedConsumed: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { 
  timestamps: true 
});

// Pre-save middleware
flockSchema.pre('save', function(next) {
  if (this.isNew) {
    this.currentBirds = this.quantity;
    this.totalCost = this.quantity * this.costPerBird;
  }
  
  if (this.currentBirds < 0) {
    this.currentBirds = 0;
  }
  
  next();
});

// Indexes
flockSchema.index({ status: 1 });
flockSchema.index({ arrivalDate: -1 });

module.exports = mongoose.model("Flock", flockSchema);
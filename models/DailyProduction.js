const mongoose = require("mongoose");

const dailyProductionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    unique: [true, 'Production record already exists for this date'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Production date cannot be in the future'
    }
  },
  stacks: {
    type: Number,
    default: 0,
    min: [0, 'Stacks cannot be negative'],
    max: [1000, 'Stacks cannot exceed 1000']
  },
  crates: {
    type: Number,
    default: 0,
    min: [0, 'Crates cannot be negative'],
    max: [100, 'Crates cannot exceed 100']
  },
  looseEggs: {
    type: Number,
    default: 0,
    min: [0, 'Loose eggs cannot be negative'],
    max: [29, 'Loose eggs cannot exceed 29']
  },
  totalEggs: {
    type: Number,
    default: 0,
    min: [0, 'Total eggs cannot be negative']
  },
  brokenEggs: {
    type: Number,
    default: 0,
    min: [0, 'Broken eggs cannot be negative']
  },
  goodEggs: {
    type: Number,
    default: 0,
    min: 0
  },
  feedQuantity: {
    type: Number,
    required: [true, 'Feed quantity is required'],
    min: [0, 'Feed quantity cannot be negative'],
    max: [10000, 'Feed quantity seems too high']
  },
  feedUnit: {
    type: String,
    enum: ['bags', 'kg', 'grams', 'tons'],
    required: [true, 'Feed unit is required']
  },
  feedInGrams: {
    type: Number,
    default: 0,
    min: 0
  },
  diedHens: {
    type: Number,
    default: 0,
    min: [0, 'Died hens cannot be negative'],
    max: [1000, 'Died hens count seems too high']
  },
  culledHens: {
    type: Number,
    default: 0,
    min: [0, 'Culled hens cannot be negative']
  },
  totalMortality: {
    type: Number,
    default: 0,
    min: 0
  },
  fcrPerHen: {
    type: Number,
    default: 0,
    min: 0
  },
  productionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  weather: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'hot', 'cold', 'normal', 'windy', 'humid'],
    default: 'normal'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { 
  timestamps: true 
});

// Pre-save for NEW records only
dailyProductionSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  try {
    // Calculate total eggs
    this.totalEggs = (this.stacks * 360) + (this.crates * 30) + this.looseEggs;
    this.goodEggs = Math.max(0, this.totalEggs - this.brokenEggs);
    this.totalMortality = this.diedHens + this.culledHens;
    
    // Convert feed to grams
    const conversions = {
      'bags': this.feedQuantity * 50000,
      'kg': this.feedQuantity * 1000,
      'grams': this.feedQuantity,
      'tons': this.feedQuantity * 1000000
    };
    this.feedInGrams = conversions[this.feedUnit] || 0;
    
    // Get active birds from FarmSettings
    const FarmSettings = mongoose.model('FarmSettings');
    const settings = await FarmSettings.findOne();
    const totalBirds = settings ? settings.initialHens : 1000;
    
    // Calculate FCR
    if (totalBirds > 0) {
      this.fcrPerHen = parseFloat((this.feedInGrams / totalBirds).toFixed(2));
      this.productionRate = parseFloat(((this.goodEggs / totalBirds) * 100).toFixed(2));
      if (this.productionRate > 100) this.productionRate = 100;
    }
    
    // SUBTRACT died hens from FarmSettings initialHens
    if (settings && this.totalMortality > 0) {
      settings.initialHens = Math.max(0, settings.initialHens - this.totalMortality);
      await settings.save();
      console.log(`✅ FarmSettings updated: -${this.totalMortality} birds, remaining: ${settings.initialHens}`);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

dailyProductionSchema.index({ date: -1 });

module.exports = mongoose.model("DailyProduction", dailyProductionSchema);
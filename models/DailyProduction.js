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
  flockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flock',
    required: false
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
  doubleYolkEggs: {
    type: Number,
    default: 0,
    min: [0, 'Double yolk eggs cannot be negative']
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
    enum: {
      values: ['bags', 'kg', 'grams', 'tons'],
      message: '{VALUE} is not a valid feed unit'
    },
    required: [true, 'Feed unit is required']
  },
  feedInGrams: {
    type: Number,
    default: 0,
    min: 0
  },
  feedCostPerUnit: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFeedCost: {
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
  eggsPerHen: {
    type: Number,
    default: 0,
    min: 0
  },
  previousDayEggs: {
    type: Number,
    default: 0
  },
  productionChange: {
    type: Number,
    default: 0
  },
  productionChangePercent: {
    type: Number,
    default: 0
  },
  weather: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'hot', 'cold', 'normal', 'windy', 'humid'],
    default: 'normal'
  },
  temperatureCelsius: {
    type: Number,
    min: [-10, 'Temperature too low'],
    max: [50, 'Temperature too high']
  },
  humidityPercent: {
    type: Number,
    min: 0,
    max: 100
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
dailyProductionSchema.pre('save', async function(next) {
  try {
    // Calculate total eggs
    this.totalEggs = (this.stacks * 360) + (this.crates * 30) + this.looseEggs;
    
    // Calculate good eggs
    this.goodEggs = this.totalEggs - this.brokenEggs;
    if (this.goodEggs < 0) this.goodEggs = 0;
    
    // Calculate total mortality
    this.totalMortality = this.diedHens + this.culledHens;
    
    // Convert feed to grams
    const conversions = {
      'bags': this.feedQuantity * 50000,
      'kg': this.feedQuantity * 1000,
      'grams': this.feedQuantity,
      'tons': this.feedQuantity * 1000000
    };
    this.feedInGrams = conversions[this.feedUnit] || 0;
    
    // Calculate total feed cost
    this.totalFeedCost = this.feedQuantity * this.feedCostPerUnit;
    
    // Get total active birds
    const Flock = mongoose.model('Flock');
    const activeFlocks = await Flock.find({ status: 'active' });
    let totalBirds = 0;
    activeFlocks.forEach(flock => {
      totalBirds += flock.currentBirds;
    });
    
    // If no flocks, use farm initial hens
    if (totalBirds === 0) {
      const FarmSettings = mongoose.model('FarmSettings');
      const settings = await FarmSettings.findOne();
      totalBirds = settings ? settings.initialHens : 1000;
    }
    
    // Calculate FCR and production rate
    if (totalBirds > 0) {
      this.fcrPerHen = parseFloat((this.feedInGrams / totalBirds).toFixed(2));
      this.eggsPerHen = parseFloat((this.goodEggs / totalBirds).toFixed(4));
      this.productionRate = parseFloat(((this.goodEggs / totalBirds) * 100).toFixed(2));
      
      if (this.productionRate > 100) this.productionRate = 100;
    }
    
    // Compare with previous day
    if (this.isNew || this.isModified('totalEggs')) {
      const yesterday = new Date(this.date);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      
      const prevProduction = await this.constructor.findOne({
        date: { $gte: yesterday, $lte: yesterdayEnd }
      });
      
      if (prevProduction) {
        this.previousDayEggs = prevProduction.totalEggs;
        this.productionChange = this.totalEggs - prevProduction.totalEggs;
        
        if (prevProduction.totalEggs > 0) {
          this.productionChangePercent = parseFloat(
            ((this.productionChange / prevProduction.totalEggs) * 100).toFixed(2)
          );
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes
dailyProductionSchema.index({ date: -1 });
dailyProductionSchema.index({ flockId: 1, date: -1 });

module.exports = mongoose.model("DailyProduction", dailyProductionSchema);
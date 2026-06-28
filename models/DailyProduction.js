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

// NO PRE-SAVE MIDDLEWARE AT ALL
// All calculations are handled in the service layer

// Indexes
dailyProductionSchema.index({ date: -1 });
dailyProductionSchema.index({ flockId: 1, date: -1 });

module.exports = mongoose.model("DailyProduction", dailyProductionSchema);
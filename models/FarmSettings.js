const mongoose = require("mongoose");

const farmSettingsSchema = new mongoose.Schema({
  farmName: {
    type: String,
    required: [true, 'Farm name is required'],
    trim: true,
    minlength: [2, 'Farm name must be at least 2 characters'],
    maxlength: [100, 'Farm name cannot exceed 100 characters']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true,
    minlength: [2, 'Owner name must be at least 2 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9+\-\s()]{10,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  initialHens: {
    type: Number,
    required: [true, 'Initial number of hens is required'],
    min: [0, 'Initial hens cannot be negative'],
    max: [100000, 'Initial hens cannot exceed 100,000']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Start date cannot be in the future'
    }
  },
  breed: {
    type: String,
    trim: true,
    default: 'Layer - White Leghorn',
    enum: [
      'Layer - White Leghorn',
      'Layer - Rhode Island Red',
      'Layer - ISA Brown',
      'Layer - Hy-Line Brown',
      'Layer - Bovans',
      'Broiler - Cobb 500',
      'Broiler - Ross 308',
      'Dual Purpose - Australorp',
      'Other'
    ]
  },
  housingType: {
    type: String,
    enum: ['cage', 'deep_litter', 'free_range', 'battery', 'slatted_floor'],
    default: 'cage'
  },
  totalSheds: {
    type: Number,
    default: 1,
    min: [1, 'Must have at least 1 shed'],
    max: [50, 'Cannot exceed 50 sheds']
  },
  bagWeight: {
    type: Number,
    default: 50,
    min: [1, 'Bag weight must be at least 50 kg'],
    max: [100, 'Bag weight cannot exceed 100 kg']
  },
  logo: {
    type: String,
    default: null
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'PKR', 'BDT']
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  }
}, { 
  timestamps: true 
});

// Static method to get or create settings (Singleton pattern)
farmSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      farmName: 'ADNAN Farms',
      ownerName: 'Adnan Khan',
      phone: '+92 317 6033433',
      initialHens: 2600,
      startDate: new Date(),
    });
    console.log('✅ Default farm settings created');
  }
  return settings;
};

// Pre-save middleware
farmSettingsSchema.pre('save', function(next) {
  this.farmName = this.farmName.replace(/\s+/g, ' ').trim();
  this.ownerName = this.ownerName.replace(/\s+/g, ' ').trim();
  next();
});

module.exports = mongoose.model("FarmSettings", farmSettingsSchema);
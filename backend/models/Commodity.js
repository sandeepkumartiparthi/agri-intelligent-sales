const mongoose = require('mongoose');

const CommoditySchema = new mongoose.Schema({
  crop: { 
    type: String, 
    required: true, 
    index: true // Indexing allows for high-speed searching
  },
  price: { 
    type: Number, 
    required: true 
  },
  mandi: { 
    type: String, 
    required: true 
  },
  state: {
    type: String,
    required: false
  },
  source: { 
    type: String, 
    default: 'Agmarknet-Live' 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now,
    expires: 86400 // Optional: Automatically removes docs older than 24h to keep DB clean
  }
});

// Create a composite index to ensure we don't have duplicate entries for the same mandi/crop
CommoditySchema.index({ crop: 1, mandi: 1 });

module.exports = mongoose.model('Commodity', CommoditySchema);

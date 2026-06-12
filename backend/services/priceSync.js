const cron = require('node-cron');
const axios = require('axios');
const Commodity = require('../models/Commodity');

/**
 * Syncs market prices from government/aggregator APIs to your MongoDB.
 * Scheduled to run daily at 6:00 PM (18:00) IST.
 */
const startPriceSyncService = () => {
  cron.schedule('0 18 * * *', async () => {
    console.log('--- Starting Daily Price Sync Service ---');
    try {
      // Example: Replace with your actual aggregator/API endpoints
      // You can chain multiple axios calls here for different sources
      const [agmarknetData, aggregatorData] = await Promise.all([
        axios.get('https://api.agmarknet.gov.in/v1/latest-prices'),
        axios.get('https://api.your-mandi-aggregator.com/prices')
      ]);

      const combinedData = [...agmarknetData.data, ...aggregatorData.data];

      for (const entry of combinedData) {
        // Normalizing data structure to match your schema
        await Commodity.updateOne(
          { crop: entry.cropName, mandi: entry.mandiName },
          { 
            $set: { 
              price: entry.modalPrice, 
              source: entry.sourceName,
              lastUpdated: new Date() 
            } 
          },
          { upsert: true }
        );
      }
      console.log('--- Sync Completed Successfully ---');
    } catch (error) {
      console.error('--- Price Sync Failed ---', error.message);
    }
  });
};

module.exports = startPriceSyncService;

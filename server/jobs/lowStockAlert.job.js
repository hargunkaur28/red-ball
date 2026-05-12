const cron = require('node-cron');
const Inventory = require('../models/Inventory');

// Runs daily at 8:00 AM
const startLowStockAlert = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      const lowStockItems = await Inventory.find({
        $expr: { $lte: ['$currentStock', '$minimumStock'] }
      });

      if (lowStockItems.length > 0) {
        console.log(`⚠️ Low stock alert: ${lowStockItems.length} items`);
        lowStockItems.forEach(item => {
          console.log(`  - ${item.name}: ${item.currentStock} ${item.unit} (min: ${item.minimumStock})`);
        });
        // TODO: Send Brevo email template #8 to manager
      }
    } catch (error) {
      console.error('Low Stock Alert Job Error:', error);
    }
  });
  console.log('⏰ Low stock alert job scheduled (daily 8:00 AM)');
};

module.exports = startLowStockAlert;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNewOrders, markOrdersAsSent } from './supabaseClient';

class OrderPollingService {
  constructor() {
    this.pollingInterval = null;
    this.isPolling = false;
    this.lastSyncTime = new Date(0).toISOString();
  }

  async startPolling(onNewOrders, intervalMs = 5000) {
    if (this.isPolling) {
      console.log('⚠️ Polling already running');
      return;
    }

    this.isPolling = true;
    console.log('✅ Starting order polling...');

    const stored = await AsyncStorage.getItem('lastSyncTime');
    if (stored) {
      this.lastSyncTime = stored;
    }

    await this.fetchOrders(onNewOrders);

    this.pollingInterval = setInterval(async () => {
      await this.fetchOrders(onNewOrders);
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('🛑 Stopped order polling');
  }

  async fetchOrders(callback) {
    try {
      const deviceId = await AsyncStorage.getItem('deviceToken');
      
      if (!deviceId) {
        console.log('⚠️ No device token configured');
        return;
      }

      const newOrders = await fetchNewOrders(deviceId, this.lastSyncTime);

      if (newOrders && newOrders.length > 0) {
        console.log(`📦 Fetched ${newOrders.length} new orders`);

        this.lastSyncTime = new Date().toISOString();
        await AsyncStorage.setItem('lastSyncTime', this.lastSyncTime);

        const orderIds = newOrders.map(o => o.id);
        await markOrdersAsSent(orderIds);

        const transformedOrders = newOrders.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          transactionKey: order.transaction_key,
          storeCode: order.store_code,
          posCode: order.pos_code,
          items: order.items || [],
          totalAmount: order.total_amount,
          transactionDate: order.transaction_date,
          remarks: order.transaction_remarks,
          status: 'new',
          createdAt: order.created_at,
        }));

        if (callback) {
          callback(transformedOrders);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
    }
  }

  async refreshOrders(callback) {
    console.log('🔄 Manual refresh triggered');
    await this.fetchOrders(callback);
  }
}

export default new OrderPollingService();

import { db } from '../config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getStoreDetails } from './getStoreDetails';
import { orderStatus } from '../enum/status';

/**
 * Retrieves customers for the currently selected store.
 * @param {Object} options - Query options
 * @param {boolean} options.fromOrders - Whether to get customers from orders collection (default: true)
 * @param {Array} options.statusFilter - Filter orders by these statuses (default: all active statuses)
 * @returns {Promise<Array>} Array of unique customers
 */
export const getCustomers = async (options = {}) => {
  try {
    // Get store details first which includes adminId
    const store = await getStoreDetails();
    if (!store || !store.id || !store.adminId) {
      throw new Error('Store information is incomplete or not available');
    }

    // Default options
    const fromOrders = options.fromOrders !== false;
    const statusFilter = options.statusFilter || [
      orderStatus.Completed, 
      orderStatus.Collected, 
      orderStatus.Pending, 
      orderStatus.Ready, 
      orderStatus.Ironing
    ];

    const uniqueCustomers = new Map();

    // First try to get customers from the orders collection
    if (fromOrders) {
      const ordersRef = collection(db, 'pos_orders', store.adminId, 'stores', store.id, 'orders');
      const q = query(ordersRef, where('status', 'in', statusFilter));
      const querySnapshot = await getDocs(q);

      console.log('get custoemr ', querySnapshot);
      

      querySnapshot.forEach((doc) => {
        const data = doc.data();
              console.log('get custoemr ', data);

        if (data.customer && data.customer.id) {
          uniqueCustomers.set(data.customer.id, {
            id: data.customer.id,
            name: data.customer.name || '',
            email: data.customer.email || '',
            phone: data.customer.phone || '',
            address: data.customer.address || ''
          });
        }
      });
    }

    // If we didn't find any customers in orders or if requested, get from customers collection
    if (uniqueCustomers.size === 0 || !fromOrders) {
      const customersRef = collection(db, 'customers', store.adminId, 'all');
      const customersSnapshot = await getDocs(customersRef);

      customersSnapshot.forEach((doc) => {
        const data = doc.data();
        uniqueCustomers.set(doc.id, {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      });
    }

    return Array.from(uniqueCustomers.values());
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};
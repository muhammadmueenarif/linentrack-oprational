import { db } from '../config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getStoreDetails } from './getStoreDetails';

/**
 * Retrieves orders for the currently selected store.
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by single status (optional)
 * @param {Array} options.statusIn - Filter by multiple statuses (optional)
 * @param {Array} options.customFilters - Array of additional where clauses (optional)
 * @param {number} options.limit - Maximum number of orders to return (optional)
 * @param {string} options.orderBy - Field to order by (default: 'dates.createdAt')
 * @param {string} options.orderDirection - Direction to order ('asc' or 'desc', default: 'desc')
 * * @returns {Promise<Object>} Object containing orders array and store info
 */
export const getStoreOrders = async (options = {}) => {

  console.log('option ',options);
  
  try {
    // Get store details first which includes adminId
    const store = await getStoreDetails();
    if (!store || !store.id || !store.adminId) {
      throw new Error('Store information is incomplete or not available');
    }

    // Reference to orders collection for this store
    const ordersRef = collection(
      db,
      'pos_orders',
      store.adminId,
      'stores',
      store.id,
      'orders'
    );

    // Build the query constraints
    const queryConstraints = [];

    // Add status filter if provided
    if (options.status) {
      queryConstraints.push(where('status', '==', options.status));
    }

    // Add statusIn filter if provided (multiple statuses)
    if (options.statusIn && Array.isArray(options.statusIn) && options.statusIn.length > 0) {
      queryConstraints.push(where('status', 'in', options.statusIn));
    }

    // Add any custom filters
    if (options.customFilters && Array.isArray(options.customFilters)) {
      queryConstraints.push(...options.customFilters);
    }

    // Add ordering
    const orderByField = options.orderBy || 'dates.createdAt';
    const orderDirection = options.orderDirection || 'desc';
    queryConstraints.push(orderBy(orderByField, orderDirection));

    // Add limit if provided
    if (options.limit && Number.isInteger(options.limit)) {
      queryConstraints.push(limit(options.limit));
    }

    // Execute query with all constraints
    const ordersQuery = query(ordersRef, ...queryConstraints);
    const querySnapshot = await getDocs(ordersQuery);

    // Process the results
    const orders = [];
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      
      // Add the document ID to the order data
      orders.push({
        id: doc.id,
        ...orderData,
        // Ensuring timestamps are handled properly
        dates: {
          ...(orderData.dates || {}),
          createdAt: orderData.dates?.createdAt || null,
          cleanedDateTime: orderData.dates?.cleanedDateTime || null
        }
      });
    });

    return {
      orders,
      storeId: store.id,
      adminId: store.adminId
    };
  } catch (error) {
    console.error('Error fetching store orders:', error);
    throw error;
  }
};
import { db } from '../config';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Retrieves the complete store data for the selected store ID including address information.
 * @returns {Promise<Object>} An object containing the full store document including its ID and address info.
 */
export const getStoreDetails = async () => {
  try {
    const storeId = localStorage.getItem('selectedStoreId');
    if (!storeId) {
      throw new Error('No store selected. Please select a store first.');
    }

    // Reference to the store document
    const storeRef = doc(db, 'stores', storeId);
    const storeDoc = await getDoc(storeRef);

    if (!storeDoc.exists()) {
      throw new Error('Store not found.');
    }

    const data = storeDoc.data();
    
    // Build formatted address from store data
    const addressInfo = {
      storeName: data.storeName || 'Company Name',
      address: data.address || '',
      city: data.city || '',
      zipCode: data.zipCode || '',
      country: data.country || '',
      phoneNumber: data.phoneNumber || '',
      // Format full address for display
      fullAddress: `${data.address || ''}\n${data.city || ''}\n${data.city || ''}, ${data.zipCode || ''}, ${data.country || ''}`,
    };

    // Return full store data including the document ID and address info
    return { 
      id: storeDoc.id,
      ...data,
      addressInfo
    };
  } catch (error) {
    console.error('Error fetching store data:', error);
    throw error;
  }
};
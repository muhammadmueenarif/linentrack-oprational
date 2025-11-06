// storeSettingsUtil.js
import { db } from '../config';
import { doc, getDoc } from 'firebase/firestore';

export const getStoreSettings = async () => {
  try {
    const storeId = localStorage.getItem('selectedStoreId');
    
    if (!storeId) {
      throw new Error('No store selected. Please select a store first.');
    }
    const storeSettingsRef = doc(db, 'storeSettings', storeId);
    const storeDoc = await getDoc(storeSettingsRef);
    
    if (!storeDoc.exists()) {
      throw new Error('Store settings not found.');
    }
    return {
      id: storeDoc.id,
      ...storeDoc.data()
    };
  } catch (error) {
    console.error('Error fetching store settings:', error);
    throw error;
  }
};

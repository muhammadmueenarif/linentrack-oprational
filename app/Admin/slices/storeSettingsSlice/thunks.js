import { createAsyncThunk } from '@reduxjs/toolkit';

// Base API URL
const API_URL = 'http://localhost:3005/api/store-settings';

// Helper function for handling API errors
const handleApiError = async (response) => {
  const data = await response.json();
  throw new Error(data.message || 'An error occurred with the request');
};

// Create new store
export const createNewStore = createAsyncThunk(
  'storeSettings/createStore',
  async ({ adminId, storeData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/stores/${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeData.storeName || '',
          address: storeData.address || '',
          city: storeData.city || '',
          country: storeData.country || '',
          zipCode: storeData.zipCode || '',
          plan: storeData.plan || '',
          period: storeData.period || '',
          phoneNumber: storeData.phoneNumber || ''
        }),
      });
      
      if (!response.ok) {
        return handleApiError(response);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Delete store
export const deleteExistingStore = createAsyncThunk(
  'storeSettings/deleteStore',
  async ({ adminId, storeId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/stores/${adminId}/${storeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return handleApiError(response);
      }
      
      const data = await response.json();
      return { storeId, message: data.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch all stores for an admin
export const fetchAllStores = createAsyncThunk(
  'storeSettings/fetchAllStores',
  async (adminId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/stores/${adminId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return handleApiError(response);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch store settings
export const fetchStoreSettings = createAsyncThunk(
  'storeSettings/fetchStoreSettings',
  async ({ adminId, storeId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/${adminId}/${storeId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return handleApiError(response);
      }
      
      const data = await response.json();
      return { storeId, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update store settings
export const updateStoreSettings = createAsyncThunk(
  'storeSettings/updateStoreSettings',
  async ({ adminId, storeId, updatedData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/${adminId}/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        return handleApiError(response);
      }
      
      const data = await response.json();
      return {
        storeId,
        settings: data.settings,
        message: data.message
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update basic store info
export const updateStoreInfo = createAsyncThunk(
  'storeSettings/updateStoreInfo',
  async ({ adminId, storeId, storeData }, { rejectWithValue }) => {
    try {
      // Prepare basic store info update
      const basicStoreData = {
        storeName: storeData.storeName,
        address: storeData.address,
        city: storeData.city,
        country: storeData.country,
        zipCode: storeData.zipCode,
        plan: storeData.plan,
        period: storeData.period,
        phoneNumber: storeData.phoneNumber
      };

      const response = await fetch(`${API_URL}/${adminId}/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicStoreData),
      });
      
      if (!response.ok) {
        return handleApiError(response);
      }
      
      const data = await response.json();
      return {
        storeId,
        ...data
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
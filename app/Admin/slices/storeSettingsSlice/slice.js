import { createSlice } from '@reduxjs/toolkit';
import {
  createNewStore,
  deleteExistingStore,
  fetchAllStores,
  fetchStoreSettings,
  updateStoreSettings,
  updateStoreInfo
} from './thunks';

// Initial state structure
const initialState = {
  stores: [],
  selectedStoreId: null,
  status: {
    stores: 'idle',
    storeInfo: 'idle',
    servicesOffered: 'idle',
    tax: 'idle',
    security: 'idle'
  },
  errors: {
    stores: null,
    storeInfo: null,
    servicesOffered: null,
    tax: null,
    security: null
  },
  lastUpdated: null
};

const storeSettingsSlice = createSlice({
  name: 'storeSettings',
  initialState,
  reducers: {
    setSelectedStore: (state, action) => {
      state.selectedStoreId = action.payload;
      if (typeof window !== "undefined" && localStorage) {
        localStorage.setItem('selectedStoreId', action.payload);
      }
    },
    clearError: (state, action) => {
      state.errors[action.payload] = null;
    },
    resetAll: () => initialState,
    resetSection: (state, action) => {
      const { storeId, section } = action.payload;
      const storeIndex = state.stores.findIndex(store => store.id === storeId);
      if (storeIndex !== -1) {
        switch(section) {
          case 'storeInfo':
            state.stores[storeIndex] = {
              ...state.stores[storeIndex],
              storeName: '',
              address: '',
              city: '',
              country: '',
              zipCode: '',
              plan: '',
              period: '',
              phoneNumber: ''
            };
            break;
          case 'servicesOffered':
            state.stores[storeIndex].servicesOffered = {
              pickupDelivery: false,
              lockers: false,
              inStoreOrders: false,
              carOrders: false,
              logo: {
                url: '',
                showOnEmail: false,
                showOnNav: false,
                showOnInvoice: false
              }
            };
            break;
          case 'tax':
            state.stores[storeIndex].tax = {
              salesTaxType: '',
              tax1: { name: '', rate: '' },
              tax2: { name: '', rate: '' },
              tax3: { name: '', rate: '' },
              taxVatNumber: '',
              customIdForReports: ''
            };
            break;
          case 'security':
            state.stores[storeIndex].security = {
              ipRestrictions: { enabled: false, addresses: [] },
              pinSettings: { inactivityTimeout: 0, required: false },
              clockInSettings: {
                requireAdminClockIn: false,
              },
              twoFactorAuth: { enabled: false, requiredForAdmin: false },
              orderEditRestrictions: {
                enabled: false,
                dateRange: { start: null, end: null }
              }
            };
            break;
        }
      }
      state.status[section] = 'idle';
      state.errors[section] = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Store
      .addCase(createNewStore.pending, (state) => {
        state.status.stores = 'loading';
      })
      .addCase(createNewStore.fulfilled, (state, action) => {
        state.stores.push(action.payload);
        state.status.stores = 'succeeded';
        if (!state.selectedStoreId) {
          state.selectedStoreId = action.payload.id;
          localStorage.setItem('selectedStoreId', action.payload.id);
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createNewStore.rejected, (state, action) => {
        state.status.stores = 'failed';
        state.errors.stores = action.payload;
      })

      // Delete Store
      .addCase(deleteExistingStore.pending, (state) => {
        state.status.stores = 'loading';
      })
      .addCase(deleteExistingStore.fulfilled, (state, action) => {
        state.stores = state.stores.filter(store => store.id !== action.payload.storeId);
        if (state.selectedStoreId === action.payload.storeId) {
          state.selectedStoreId = state.stores[0]?.id || null;
          localStorage.setItem('selectedStoreId', state.selectedStoreId || '');
        }
        state.status.stores = 'succeeded';
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteExistingStore.rejected, (state, action) => {
        state.status.stores = 'failed';
        state.errors.stores = action.payload;
      })

      // Fetch All Stores
      .addCase(fetchAllStores.pending, (state) => {
        state.status.stores = 'loading';
      })
      .addCase(fetchAllStores.fulfilled, (state, action) => {
        state.stores = action.payload;
        if (!state.selectedStoreId && state.stores.length > 0) {
          state.selectedStoreId = state.stores[0].id;
          localStorage.setItem('selectedStoreId', state.stores[0].id);
        }
        state.status.stores = 'succeeded';
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAllStores.rejected, (state, action) => {
        state.status.stores = 'failed';
        state.errors.stores = action.payload;
      })

      // Fetch Store Settings
      .addCase(fetchStoreSettings.pending, (state) => {
        Object.keys(state.status).forEach(key => {
          state.status[key] = 'loading';
        });
      })
      .addCase(fetchStoreSettings.fulfilled, (state, action) => {
        const { storeId, data } = action.payload;
        const storeIndex = state.stores.findIndex(store => store.id === storeId);
        
        if (storeIndex !== -1) {
          state.stores[storeIndex] = {
            ...state.stores[storeIndex],
            ...data
          };
        }
        
        Object.keys(state.status).forEach(key => {
          state.status[key] = 'succeeded';
          state.errors[key] = null;
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchStoreSettings.rejected, (state, action) => {
        Object.keys(state.status).forEach(key => {
          state.status[key] = 'failed';
          state.errors[key] = action.payload;
        });
      })

      // Update Store Settings
      .addCase(updateStoreSettings.pending, (state) => {
        state.status.storeInfo = 'loading';
      })
      .addCase(updateStoreSettings.fulfilled, (state, action) => {
        const { storeId, settings } = action.payload;
        const storeIndex = state.stores.findIndex(store => store.id === storeId);
        
        if (storeIndex !== -1) {
          state.stores[storeIndex] = {
            ...state.stores[storeIndex],
            ...settings
          };
        }
        
        state.status.storeInfo = 'succeeded';
        state.errors.storeInfo = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateStoreSettings.rejected, (state, action) => {
        state.status.storeInfo = 'failed';
        state.errors.storeInfo = action.payload;
      })

      // Update Store Info
      .addCase(updateStoreInfo.pending, (state) => {
        state.status.storeInfo = 'loading';
      })
      .addCase(updateStoreInfo.fulfilled, (state, action) => {
        const storeIndex = state.stores.findIndex(store => store.id === action.payload.storeId);
        if (storeIndex !== -1) {
          state.stores[storeIndex] = {
            ...state.stores[storeIndex],
            ...action.payload
          };
        }
        state.status.storeInfo = 'succeeded';
        state.errors.storeInfo = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateStoreInfo.rejected, (state, action) => {
        state.status.storeInfo = 'failed';
        state.errors.storeInfo = action.payload;
      });
  }
});

export const {
  setSelectedStore,
  clearError,
  resetAll,
  resetSection
} = storeSettingsSlice.actions;

export default storeSettingsSlice.reducer;
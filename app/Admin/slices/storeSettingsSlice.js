import { backendApi } from '../../apiEndpoints';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  storeInfo: {
    companyName: '',
    streetAddress: '',
    zipCode: '',
    city: '',
    telephone: '',
    timezone: '',
    language: '',
    gpsCoordinates: {
      latitude: '',
      longitude: ''
    }
  },
  servicesOffered: {
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
  },
  tax: {
    salesTaxType: '',
    tax1: { name: '', rate: '' },
    tax2: { name: '', rate: '' },
    tax3: { name: '', rate: '' },
    taxVatNumber: '',
    customIdForReports: ''
  },
  security: {
    ipRestrictions: {
      enabled: false,
      addresses: []
    },
    pinSettings: {
      inactivityTimeout: 0,
      required: false
    },
    clockInSettings: {
      requireAdminClockIn: false
    },
    twoFactorAuth: {
      enabled: false,
      requiredForAdmin: false
    },
    orderEditRestrictions: {
      enabled: false,
      dateRange: {
        start: null,
        end: null
      }
    }
  },
  stores: [],
  groups: [],
  status: {
    storeInfo: 'idle',
    servicesOffered: 'idle',
    tax: 'idle',
    security: 'idle',
    stores: 'idle',
    groups: 'idle'
  },
  errors: {
    storeInfo: null,
    servicesOffered: null,
    tax: null,
    security: null,
    stores: null,
    groups: null
  },
  currentStore: null,
  currentGroup: null,
  lastUpdated: null
};

export const fetchStoreSettings = createAsyncThunk(
  'storeSettings/fetchStoreSettings',
  async (_, { rejectWithValue }) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const adminId = userData?.id;
      if (!adminId) {
        throw new Error('No admin ID found');
      }

      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) {
        throw new Error('No store selected');
      }

      const response = await fetch(`${backendApi}/api/store-settings/${adminId}/${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch store settings');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllStores = createAsyncThunk(
  'storeSettings/fetchAllStores',
  async (_, { rejectWithValue }) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const adminId = userData?.id;
      if (!adminId) {
        throw new Error('No admin ID found');
      }

      const response = await fetch(`${backendApi}/api/store-settings/stores/${adminId}`);
      if (!response.ok) throw new Error('Failed to fetch stores');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNewStore = createAsyncThunk(
  'storeSettings/createStore',
  async ({ storeData }, { rejectWithValue }) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const adminId = userData?.id;
      if (!adminId) {
        throw new Error('No admin ID found');
      }

      const response = await fetch(`${backendApi}/api/store-settings/stores/${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData),
      });
      
      if (!response.ok) throw new Error('Failed to create store');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteExistingStore = createAsyncThunk(
  'storeSettings/deleteStore',
  async ({ storeId }, { rejectWithValue }) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const adminId = userData?.id;
      if (!adminId) {
        throw new Error('No admin ID found');
      }

      const response = await fetch(`${backendApi}/api/store-settings/stores/${adminId}/${storeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete store');
      return storeId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStoreSettings = createAsyncThunk(
  'storeSettings/updateStoreSettings',
  async ({ section, settings }, { rejectWithValue }) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const adminId = userData?.id;
      if (!adminId) {
        throw new Error('No admin ID found');
      }

      const storeId = localStorage.getItem('selectedStoreId');
      if (!storeId) {
        throw new Error('No store selected');
      }

      const response = await fetch(`${backendApi}/api/store-settings/${adminId}/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, settings }),
      });
      
      if (!response.ok) throw new Error('Failed to update store settings');
      const data = await response.json();
      return { section, settings: data.settings || settings };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const storeSettingsSlice = createSlice({
  name: 'storeSettings',
  initialState,
  reducers: {
    setCurrentStore: (state, action) => {
      state.currentStore = action.payload;
      if (action.payload?.id) {
        localStorage.setItem('selectedStoreId', action.payload.id);
      }
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
    addStore: (state, action) => {
      state.stores.push({ id: Date.now(), ...action.payload });
    },
    updateStore: (state, action) => {
      const index = state.stores.findIndex(store => store.id === action.payload.id);
      if (index !== -1) state.stores[index] = action.payload;
    },
    removeStore: (state, action) => {
      state.stores = state.stores.filter(store => store.id !== action.payload);
      if (state.currentStore?.id === action.payload) state.currentStore = null;
    },
    addGroup: (state, action) => {
      state.groups.push({ id: Date.now(), ...action.payload });
    },
    updateGroup: (state, action) => {
      const index = state.groups.findIndex(group => group.id === action.payload.id);
      if (index !== -1) state.groups[index] = action.payload;
    },
    removeGroup: (state, action) => {
      state.groups = state.groups.filter(group => group.id !== action.payload);
      if (state.currentGroup?.id === action.payload) state.currentGroup = null;
    },
    resetSection: (state, action) => {
      const section = action.payload;
      state[section] = initialState[section];
      state.status[section] = 'idle';
      state.errors[section] = null;
    },
    resetAll: () => initialState,
    clearError: (state, action) => {
      state.errors[action.payload] = null;
    }
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchStoreSettings.pending, (state) => {
      Object.keys(state.status).forEach(key => {
        state.status[key] = 'loading';
      });
    })
    .addCase(fetchStoreSettings.fulfilled, (state, action) => {
        const settings = action.payload.settings || {};

        state.storeInfo = {
          companyName: settings.companyName || '',
          streetAddress: settings.streetAddress || '',
          zipCode: settings.zipCode || '',
          city: settings.city || '',
          telephone: settings.telephone || '',
          timezone: settings.timezone || '',
          language: settings.language || '',
          gpsCoordinates: {
            latitude: settings.gpsCoordinates?.latitude || '',
            longitude: settings.gpsCoordinates?.longitude || ''
          }
        };

        state.servicesOffered = {
          pickupDelivery: settings.pickupDelivery || false,
          lockers: settings.lockers || false,
          inStoreOrders: settings.inStoreOrders || false,
          carOrders: settings.carOrders || false,
          logo: {
            url: settings.logo?.url || '',
            showOnEmail: settings.logo?.showOnEmail || false,
            showOnNav: settings.logo?.showOnNav || false,
            showOnInvoice: settings.logo?.showOnInvoice || false
          }
        };

        state.tax = {
          salesTaxType: settings.salesTaxType || '',
          tax1: settings.tax1 || { name: '', rate: '' },
          tax2: settings.tax2 || { name: '', rate: '' },
          tax3: settings.tax3 || { name: '', rate: '' },
          taxVatNumber: settings.taxVatNumber || '',
          customIdForReports: settings.customIdForReports || ''
        };

        state.security = {
          ipRestrictions: settings.ipRestrictions || initialState.security.ipRestrictions,
          pinSettings: settings.pinSettings || initialState.security.pinSettings,
          clockInSettings: settings.clockInSettings || initialState.security.clockInSettings,
          twoFactorAuth: settings.twoFactorAuth || initialState.security.twoFactorAuth,
          orderEditRestrictions: settings.orderEditRestrictions || initialState.security.orderEditRestrictions
        };

        if (Array.isArray(settings.stores)) {
          state.stores = settings.stores.map(store => ({
            id: store.id,
            name: store.name || '',
            address: store.address || '',
            city: store.city || '',
            zipCode: store.zipCode || '',
            plan: store.plan || 'Standard',
            period: store.period || 'M',
            country: store.country || '',
            phoneNumber: store.phoneNumber || ''
          }));
        }

        if (Array.isArray(settings.groups)) {
          state.groups = settings.groups.map(group => ({
            id: group.id,
            name: group.name || '',
            description: group.description || '',
            stores: group.stores || '',
            tier: group.tier || 'Basic'
          }));
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
      .addCase(fetchAllStores.pending, (state) => {
        state.status.stores = 'loading';
      })
      .addCase(fetchAllStores.fulfilled, (state, action) => {
        state.stores = action.payload;
        state.status.stores = 'succeeded';
        state.errors.stores = null;
      })
      .addCase(fetchAllStores.rejected, (state, action) => {
        state.status.stores = 'failed';
        state.errors.stores = action.payload;
      })
      .addCase(createNewStore.pending, (state) => {
        state.status.stores = 'loading';
      })
      .addCase(createNewStore.fulfilled, (state, action) => {
        state.stores.push(action.payload);
        state.status.stores = 'succeeded';
        state.errors.stores = null;
      })
      .addCase(createNewStore.rejected, (state, action) => {
        state.status.stores = 'failed';
        state.errors.stores = action.payload;
      })
      .addCase(deleteExistingStore.pending, (state) => {
        state.status.stores = 'loading';
      })
      .addCase(deleteExistingStore.fulfilled, (state, action) => {
        state.stores = state.stores.filter(store => store.id !== action.payload);
        if (state.currentStore?.id === action.payload) {
          state.currentStore = null;
          localStorage.removeItem('selectedStoreId');
        }
        state.status.stores = 'succeeded';
        state.errors.stores = null;
      })
      .addCase(deleteExistingStore.rejected, (state, action) => {
        state.status.stores = 'failed';
        state.errors.stores = action.payload;
      });
  }
});

export const {
  setCurrentStore,
  setCurrentGroup,
  addStore,
  updateStore,
  removeStore,
  addGroup,
  updateGroup,
  removeGroup,
  resetSection,
  resetAll,
  clearError
} = storeSettingsSlice.actions;

export const selectStoreInfo = (state) => state.storeSettings.storeInfo;
export const selectServicesOffered = (state) => state.storeSettings.servicesOffered;
export const selectTax = (state) => state.storeSettings.tax;
export const selectSecurity = (state) => state.storeSettings.security;
export const selectGroups = (state) => state.storeSettings.groups;
export const selectStatus = (section) => (state) => state.storeSettings.status[section];
export const selectError = (section) => (state) => state.storeSettings.errors[section];
export const selectCurrentGroup = (state) => state.storeSettings.currentGroup;
export const selectLastUpdated = (state) => state.storeSettings.lastUpdated;
export const selectStoreSettings = (state) => state.storeSettings;
export const selectStores = (state) => state.storeSettings.stores;
export const selectCurrentStore = (state) => state.storeSettings.currentStore;

export default storeSettingsSlice.reducer;
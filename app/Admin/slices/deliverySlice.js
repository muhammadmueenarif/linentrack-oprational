import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchDeliverySettings = createAsyncThunk(
  'delivery/fetchDeliverySettings',
  async (adminId, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');

    try {
      const response = await fetch(`http://localhost:3005/api/delivery/${adminId}/${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch delivery settings');
      
      const data = await response.json();
      console.log('Fetched delivery settings:', data);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDeliverySettings = createAsyncThunk(
  'delivery/updateDeliverySettings',
  async ({ adminId, settings }, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');

    try {
      const response = await fetch(`http://localhost:3005/api/delivery/${adminId}/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to update delivery settings');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


const initialState = {
  status: 'idle',
  error: null,
  lastUpdated: null,
  activeTab: 'GeneralSettings',

  generalSettings: {
    priceList: 'default',
    repeatPickupPriceList: 'same',
    excludeDeliveryFee: false,
    preventCustomersFromPlacingOrders: false,
    message: '',
    showPromoCodeBox: false,
    welcomeText: '',
    termsAndConditions: '',
    letCustomersBookRepeatPickupOrders: false,
    pickupSlots: 'default',
    allowPickupsFrom: 'today',
    allowPickupsFromTime: 'anytime',
    allowDeliveryFrom: 'today',
    minHoursBetweenPickupAndDelivery: 24,
    additionalChargesForExpressDelivery: 0,
    expressDeliveryCurrency: '$',
    expressDeliveryTurnaroundTime: 0,
    allowCustomersToEditUntil: 12,
    allowCustomersToEditDeliverySlot: 12,
    assignCustomersToRouteOnSignUp: 'default',
    askForCityOnSignUp: false,
    askForZipCodeOnSignUp: false,
    letCustomersSetTheirLocationByGPS: false,
    customerCanCheckIfAddressIsInGeofence: false
  },

  routes: {
    list: [],
    outOfServiceAreas: [],
    geoFenceData: null
  },

  lockers: {
    list: [],
    selectedLocker: null
  },

  notifications: {
    general: {
      defaultNotifyMethod: 'email',
      rememberPreference: 'Do not remember- use default',
      notifications: {
        orderPlaced: true,
        orderUpdated: true,
        orderCancelled: true,
        orderDelivered: true
      },
      driverNotifications: true,
      monthlySummary: false
    },
    email: {
      sendOrderConfirmation: true,
      sendDeliveryUpdates: true,
      sendPromotionalEmails: false,
      customEmailSignature: '',
      welcomeEmailText: ''
    },
    push: {
      enablePushNotifications: true,
      orderUpdates: true,
      deliveryAlerts: true,
      promotionalNotifications: false,
      smsCredit: 1000
    }
  },

  embedStore: {
    androidAppEnabled: true,
    iOSAppEnabled: true,
    customDomain: '',
    embedCode: ''
  }
};

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    resetDeliverySettings: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    // General Settings
    updateGeneralSettings: (state, action) => {
      state.generalSettings = {
        ...state.generalSettings,
        ...action.payload
      };
    },
    // Routes
    addRoute: (state, action) => {
      state.routes.list.push(action.payload);
    },
    updateRoute: (state, action) => {
      const index = state.routes.list.findIndex(route => route.id === action.payload.id);
      if (index !== -1) {
        state.routes.list[index] = action.payload;
      }
    },
    deleteRoute: (state, action) => {
      state.routes.list = state.routes.list.filter(route => route.id !== action.payload);
    },
    updateGeoFenceData: (state, action) => {
      state.routes.geoFenceData = action.payload;
    },
    // Lockers
    addLocker: (state, action) => {
      state.lockers.list.push(action.payload);
    },
    updateLocker: (state, action) => {
      const index = state.lockers.list.findIndex(locker => locker.id === action.payload.id);
      if (index !== -1) {
        state.lockers.list[index] = action.payload;
      }
    },
    deleteLocker: (state, action) => {
      state.lockers.list = state.lockers.list.filter(locker => locker.id !== action.payload);
    },
    setSelectedLocker: (state, action) => {
      state.lockers.selectedLocker = action.payload;
    },
    // Notifications
    updateNotificationSettings: (state, action) => {
      state.notifications = {
        ...state.notifications,
        ...action.payload
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch delivery settings
      .addCase(fetchDeliverySettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDeliverySettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        Object.keys(action.payload).forEach(key => {
          if (state[key] !== undefined) {
            if (typeof action.payload[key] === 'object' && action.payload[key] !== null) {
              if (Array.isArray(action.payload[key])) {
                state[key] = action.payload[key];
              } else {
                state[key] = {
                  ...state[key],
                  ...action.payload[key]
                };
              }
            } else {
              state[key] = action.payload[key];
            }
          }
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDeliverySettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update delivery settings
      .addCase(updateDeliverySettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateDeliverySettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        Object.keys(action.payload).forEach(key => {
          if (state[key] !== undefined) {
            if (typeof action.payload[key] === 'object' && action.payload[key] !== null) {
              state[key] = {
                ...state[key],
                ...action.payload[key]
              };
            } else {
              state[key] = action.payload[key];
            }
          }
        });
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateDeliverySettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  resetDeliverySettings,
  clearError,
  setActiveTab,
  updateGeneralSettings,
  addRoute,
  updateRoute,
  deleteRoute,
  updateGeoFenceData,
  addLocker,
  updateLocker,
  deleteLocker,
  setSelectedLocker,
  updateNotificationSettings
} = deliverySlice.actions;

// Selectors
export const selectDeliverySettings = (state) => state.delivery;
export const selectActiveTab = (state) => state.delivery.activeTab;
export const selectStatus = (state) => state.delivery.status;
export const selectError = (state) => state.delivery.error;
export const selectLastUpdated = (state) => state.delivery.lastUpdated;

// General Settings Selectors
export const selectGeneralSettings = (state) => state.delivery.generalSettings;

// Routes Selectors
export const selectRoutes = (state) => state.delivery.routes.list;
export const selectOutOfServiceAreas = (state) => state.delivery.routes.outOfServiceAreas;
export const selectGeoFenceData = (state) => state.delivery.routes.geoFenceData;

// Lockers Selectors
export const selectLockers = (state) => state.delivery.lockers.list;
export const selectSelectedLocker = (state) => state.delivery.lockers.selectedLocker;

// Notifications Selectors
export const selectNotifications = (state) => state.delivery.notifications;
export const selectEmailSettings = (state) => state.delivery.notifications.email;
export const selectPushSettings = (state) => state.delivery.notifications.push;
export const selectGeneralNotificationSettings = (state) => state.delivery.notifications.general;

// Embed Store Selectors
export const selectEmbedStore = (state) => state.delivery.embedStore;

export default deliverySlice.reducer;
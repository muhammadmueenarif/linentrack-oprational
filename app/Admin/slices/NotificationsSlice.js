import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch notifications settings
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (adminId, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/notifications/${adminId}/${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch notification settings');
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update notification settings
export const updateNotificationStatusAsync = createAsyncThunk(
  'notifications/updateNotificationStatusAsync',
  async ({ adminId, settings }, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/notifications/${adminId}/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (!response.ok) throw new Error('Failed to update notification settings');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  settings: {
    general: {
      defaultNotifyMethod: 'Default',
      rememberPreference: 'Do not remember- use default',
      notifications: {
        orderCreated: false,
        orderEdited: false,
        orderCleaned: false,
        orderDelivered: false,
        orderPickedUp: false,
        invoicePaid: false
      },
      driverNotifications: false,
      monthlySummary: false
    },
    email: {
      pickupReminder: false,
      emailReminder: false,
      itemizePrices: false,
      digitalReceipt: false,
      showQRBarcode: false,
      additionalInfo: '',
      signupEmail: false,
      welcomeText: ''
    },
    push: {
      usePush: false,
      fallbackToEmail: false,
      smsCredit: 0,
      smsAutoTopup: false,
      smsPickupReminder: false,
      smsDigitalReceipt: false
    }
  },
  status: 'idle',
  error: null,
  lastUpdated: null
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    updateSetting: (state, action) => {
      const { section, key, value } = action.payload;
      state.settings[section][key] = value;
    },
    
    updateNestedSetting: (state, action) => {
      const { section, subsection, key, value } = action.payload;
      state.settings[section][subsection][key] = value;
    },
    
    clearError: (state) => {
      state.error = null;
    },

    resetSettings: () => initialState
  },

  extraReducers: (builder) => {
    builder
      // Fetch notifications settings
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload?.settings) {
          state.settings = action.payload.settings;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update notification settings
      .addCase(updateNotificationStatusAsync.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateNotificationStatusAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload?.settings) {
          state.settings = action.payload.settings;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateNotificationStatusAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  updateSetting,
  updateNestedSetting,
  clearError,
  resetSettings
} = notificationsSlice.actions;

// Selectors
export const selectSettings = (state) => state.notifications.settings;
export const selectNotificationsStatus = (state) => state.notifications.status;
export const selectNotificationsError = (state) => state.notifications.error;
export const selectLastUpdated = (state) => state.notifications.lastUpdated;

// Section specific selectors
export const selectGeneralSettings = (state) => state.notifications.settings.general;
export const selectEmailSettings = (state) => state.notifications.settings.email;
export const selectPushSettings = (state) => state.notifications.settings.push;

export default notificationsSlice.reducer;
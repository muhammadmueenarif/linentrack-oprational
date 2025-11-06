import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch marketing settings from database
export const fetchMarketingSettings = createAsyncThunk(
  'marketing/fetchMarketingSettings',
  async (adminId, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/marketing/${adminId}/${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch marketing settings');
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update marketing settings in database
export const updateMarketingSettingsAsync = createAsyncThunk(
  'marketing/updateMarketingSettingsAsync',
  async ({ adminId, settings }, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/marketing/${adminId}/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to update marketing settings');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  marketingOptIn: {
    isActive: false,
    emailEnabled: false,
    smsEnabled: false
  },
  mailchimp: {
    apiKey: '',
    listId: '',
    isConfigured: false
  },
  status: 'idle',
  error: null,
  lastUpdated: null
};

// Helper function to update state with new data
const updateStateWithNewData = (state, newData) => {
  if (!newData) return;

  Object.keys(newData).forEach(key => {
    if (state[key] !== undefined) {
      if (typeof newData[key] === 'object' && newData[key] !== null) {
        if (Array.isArray(newData[key])) {
          state[key] = newData[key];
        } else {
          state[key] = {
            ...state[key],
            ...newData[key]
          };
        }
      } else {
        state[key] = newData[key];
      }
    }
  });

  state.lastUpdated = new Date().toISOString();
};

const marketingSlice = createSlice({
  name: 'marketing',
  initialState,
  reducers: {
    resetMarketingSettings: () => initialState,
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Marketing Opt-in Settings
    updateMarketingOptIn: (state, action) => {
      state.marketingOptIn = {
        ...state.marketingOptIn,
        ...action.payload
      };
      
      // If main toggle is turned off, disable child toggles
      if (action.payload.hasOwnProperty('isActive') && !action.payload.isActive) {
        state.marketingOptIn.emailEnabled = false;
        state.marketingOptIn.smsEnabled = false;
      }
    },
    
    // Mailchimp Settings
    updateMailchimpSettings: (state, action) => {
      state.mailchimp = {
        ...state.mailchimp,
        ...action.payload,
        isConfigured: Boolean(
          (action.payload.apiKey || state.mailchimp.apiKey) && 
          (action.payload.listId || state.mailchimp.listId)
        )
      };
    },
    
    // Clear Mailchimp Settings
    clearMailchimpSettings: (state) => {
      state.mailchimp = {
        apiKey: '',
        listId: '',
        isConfigured: false
      };
    },
    
    // Update Entire Settings
    updateEntireSettings: (state, action) => {
      updateStateWithNewData(state, action.payload);
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch marketing settings
      .addCase(fetchMarketingSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMarketingSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        updateStateWithNewData(state, action.payload);
      })
      .addCase(fetchMarketingSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update marketing settings
      .addCase(updateMarketingSettingsAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateMarketingSettingsAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        updateStateWithNewData(state, action.payload);
      })
      .addCase(updateMarketingSettingsAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  resetMarketingSettings,
  clearError,
  updateMarketingOptIn,
  updateMailchimpSettings,
  clearMailchimpSettings,
  updateEntireSettings
} = marketingSlice.actions;

// Memoized Selectors
export const selectMarketingSettings = (state) => state.marketing;
export const selectMarketingOptIn = (state) => state.marketing.marketingOptIn;
export const selectMailchimpSettings = (state) => state.marketing.mailchimp;
export const selectMarketingStatus = (state) => state.marketing.status;
export const selectMarketingError = (state) => state.marketing.error;
export const selectLastUpdated = (state) => state.marketing.lastUpdated;

// Additional Selectors for Specific States
export const selectIsMarketingActive = (state) => state.marketing.marketingOptIn.isActive;
export const selectIsEmailEnabled = (state) => state.marketing.marketingOptIn.emailEnabled;
export const selectIsSMSEnabled = (state) => state.marketing.marketingOptIn.smsEnabled;
export const selectIsMailchimpConfigured = (state) => state.marketing.mailchimp.isConfigured;

export default marketingSlice.reducer;
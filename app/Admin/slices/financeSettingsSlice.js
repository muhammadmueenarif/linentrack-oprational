//  filename: financeSettingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch settings from database
export const fetchFinanceSettings = createAsyncThunk(
  'financeSettings/fetchFinanceSettings',
  async (adminId, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');

    try {
      const response = await fetch(`http://localhost:3005/api/finances/${adminId}/${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch finance settings');
      
      const data = await response.json();
      console.log('Fetched finance settings:', data);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update settings in database
export const updateFinanceSettingsAsync = createAsyncThunk(
  'financeSettings/updateFinanceSettingsAsync',
  async ({ adminId, settings }, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/finances/${adminId}/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to update finance settings');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update payment settings in database
export const updatePaymentSettingsAsync = createAsyncThunk(
  'financeSettings/updatePaymentSettingsAsync',
  async ({ adminId, settings }, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/finances/${adminId}/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment: settings })
      });

      if (!response.ok) throw new Error('Failed to update payment settings');
      const data = await response.json();
      return data.payment || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  payment: {
    defaultPaymentMethod: 'Pay on Collection',
    paymentSelectionMethod: 'Popup with Payment Options',
    autoChargeSettings: 'Never',
    cashDiscount: 0,
    allowPartialPayment: false,
    showCheckOption: false,
    showBankWireOption: false,
    stripeConnected: false
  },
  invoices: {
    invoiceToolVersion: '',
    invoiceStyle: '',
    autoInvoicing: 'Off',
    showOrderSummaries: false,
    showOrderNotes: false,
    preventRepeatInvoice: false,
    invoicePrefix: '',
    customerInvoicePaymentDays: 30,
    customerPaymentInstructions: '',
    businessInvoicePaymentDays: 30,
    businessPaymentInstructions: ''
  },
  businessAccounts: [],
  subscription: {
    subscriptions: []
  },
  payroll: {
    weeklyOvertimeLimit: 90,
    overtimeMultiplier: 1.5,
    payrollCycle: 'Never',
    payrollStartDate: '',
    calculateTipsWithPayroll: false
  },
  cashUp: {
    requireStartingCash: false,
    trackDrawerPayouts: false,
    assignDriverCashUp: false
  },
  accountingIntegration: {
    xero: {
      connected: false,
      enabled: false,
      autoSync: '',
      showSendInvoiceButton: false,
      autoUpdatePaidStatus: false
    },
    quickbooks: {
      connected: false,
      autoSync: '',
      showSendInvoiceButton: false
    }
  },
  status: 'idle',
  error: null,
  lastUpdated: null
};

const financeSettingsSlice = createSlice({
  name: 'financeSettings',
  initialState,
  reducers: {
    resetFinanceSettings: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    updatePaymentSettings: (state, action) => {
      state.payment = {
        ...state.payment,
        ...action.payload
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch finance settings
      .addCase(fetchFinanceSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFinanceSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Update each section if it exists in the response
        Object.keys(action.payload).forEach(key => {
          if (state[key] !== undefined) {
              if (typeof action.payload[key] === 'object' && action.payload[key] !== null) {
                  // If it's an array, replace completely
                  if (Array.isArray(action.payload[key])) {
                      state[key] = action.payload[key];
                  } else {
                      // If it's an object, merge
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
      .addCase(fetchFinanceSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update payment settings
      .addCase(updatePaymentSettingsAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updatePaymentSettingsAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (typeof action.payload === 'object' && action.payload !== null) {
          state.payment = {
            ...state.payment,
            ...action.payload
          };
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updatePaymentSettingsAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update finance settings
      .addCase(updateFinanceSettingsAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateFinanceSettingsAsync.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Update each section if it exists in the response
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
      .addCase(updateFinanceSettingsAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions and selectors
export const { 
  resetFinanceSettings, 
  clearError,
  updatePaymentSettings 
} = financeSettingsSlice.actions;

// Selectors
export const selectFinanceSettings = (state) => state.financeSettings;
export const selectPaymentSettings = (state) => state.financeSettings.payment;
export const selectInvoiceSettings = (state) => state.financeSettings.invoices;
export const selectBusinessAccounts = (state) => state.financeSettings.businessAccounts;
export const selectSubscription = (state) => state.financeSettings.subscription;
export const selectPayrollSettings = (state) => state.financeSettings.payroll;
export const selectCashUpSettings = (state) => state.financeSettings.cashUp;
export const selectAccountingIntegration = (state) => state.financeSettings.accountingIntegration;
export const selectFinanceStatus = (state) => state.financeSettings.status;
export const selectFinanceError = (state) => state.financeSettings.error;
export const selectLastUpdated = (state) => state.financeSettings.lastUpdated;

export default financeSettingsSlice.reducer;
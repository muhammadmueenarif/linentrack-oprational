import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  cardDetails: {
    cards: [],
    showAddCard: false,
    activeCardId: null,
    lastUpdated: null,
    lastAction: null // Tracks the last action performed for optimistic updates
  },
  orderDates: {
    changes: []
  },
  staffCreditHistory: {
    records: []
  },
  staffDiscountHistory: {
    records: []
  },
  invoicePayments: {
    undoHistory: []
  },
  billingHistory: {
    transactions: []
  },
  deactivatedCustomers: {
    customers: []
  },
  status: {
    cardDetails: 'idle',
    orderDates: 'idle',
    staffCreditHistory: 'idle',
    staffDiscountHistory: 'idle',
    invoicePayments: 'idle',
    billingHistory: 'idle',
    deactivatedCustomers: 'idle'
  },
  errors: {
    cardDetails: null,
    orderDates: null,
    staffCreditHistory: null,
    staffDiscountHistory: null,
    invoicePayments: null,
    billingHistory: null,
    deactivatedCustomers: null
  },
  activeComponent: null,
  lastUpdated: null,
  trialDaysRemaining: 2
};

// Enhanced Async Thunk for fetching admin tools data
export const fetchAdminTools = createAsyncThunk(
  'adminContent/fetchAdminTools',
  async (adminId, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');

    try {
      const response = await fetch(`http://localhost:3005/api/admin-tools/${adminId}/${storeId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch admin tools');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Enhanced Async Thunk for updating admin tools data
export const updateAdminTools = createAsyncThunk(
  'adminContent/updateAdminTools',
  async ({ adminId, section, data, action = null }, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');

    try {
      const response = await fetch(`http://localhost:3005/api/admin-tools/${adminId}/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          data,
          action // Track the type of update being performed
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update admin tools');
      }

      const result = await response.json();
      return {
        ...result,
        action // Include the action in the response for tracking
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const adminContentSlice = createSlice({
  name: 'adminContent',
  initialState,
  reducers: {
    setActiveComponent: (state, action) => {
      state.activeComponent = action.payload;
    },

    // Enhanced Card Details Actions
    addCard: (state, action) => {
      const newCard = {
        ...action.payload,
        isActive: state.cardDetails.cards.length === 0 // First card is automatically active
      };
      state.cardDetails.cards.push(newCard);
      if (newCard.isActive) {
        state.cardDetails.activeCardId = newCard.id;
      }
      state.cardDetails.lastAction = 'ADD_CARD';
      state.cardDetails.lastUpdated = new Date().toISOString();
    },

    updateCard: (state, action) => {
      const index = state.cardDetails.cards.findIndex(card => card.id === action.payload.id);
      if (index !== -1) {
        state.cardDetails.cards[index] = {
          ...state.cardDetails.cards[index],
          ...action.payload,
          lastUpdated: new Date().toISOString()
        };
      }
      state.cardDetails.lastAction = 'UPDATE_CARD';
    },

    removeCard: (state, action) => {
      const cardId = action.payload;
      const removedCard = state.cardDetails.cards.find(card => card.id === cardId);
      state.cardDetails.cards = state.cardDetails.cards.filter(card => card.id !== cardId);

      // Handle active card removal
      if (removedCard?.isActive && state.cardDetails.cards.length > 0) {
        state.cardDetails.cards[0].isActive = true;
        state.cardDetails.activeCardId = state.cardDetails.cards[0].id;
      } else if (state.cardDetails.cards.length === 0) {
        state.cardDetails.activeCardId = null;
      }

      state.cardDetails.lastAction = 'REMOVE_CARD';
      state.cardDetails.lastUpdated = new Date().toISOString();
    },

    setActiveCard: (state, action) => {
      const cardId = action.payload;
      state.cardDetails.cards = state.cardDetails.cards.map(card => ({
        ...card,
        isActive: card.id === cardId,
        lastUpdated: card.id === cardId ? new Date().toISOString() : card.lastUpdated
      }));
      state.cardDetails.activeCardId = cardId;
      state.cardDetails.lastAction = 'SET_ACTIVE_CARD';
      state.cardDetails.lastUpdated = new Date().toISOString();
    },

    setShowAddCard: (state, action) => {
      state.cardDetails.showAddCard = action.payload;
    },

    // Backup and Restore Card State (for optimistic updates)
    backupCardState: (state) => {
      state.cardDetails.backup = {
        cards: [...state.cardDetails.cards],
        activeCardId: state.cardDetails.activeCardId
      };
    },

    restoreCardState: (state) => {
      if (state.cardDetails.backup) {
        state.cardDetails.cards = [...state.cardDetails.backup.cards];
        state.cardDetails.activeCardId = state.cardDetails.backup.activeCardId;
        delete state.cardDetails.backup;
      }
    },

    // Keep existing reducers
    addOrderDateChange: (state, action) => {
      state.orderDates.changes.push(action.payload);
    },
    updateOrderDate: (state, action) => {
      const index = state.orderDates.changes.findIndex(change => change.orderId === action.payload.orderId);
      if (index !== -1) state.orderDates.changes[index] = action.payload;
    },

    // Staff Credit History
    addCreditRecord: (state, action) => {
      state.staffCreditHistory.records.push(action.payload);
    },
    updateCreditRecord: (state, action) => {
      const index = state.staffCreditHistory.records.findIndex(record => record.id === action.payload.id);
      if (index !== -1) state.staffCreditHistory.records[index] = action.payload;
    },

    // Staff Discount History
    addDiscountRecord: (state, action) => {
      state.staffDiscountHistory.records.push(action.payload);
    },
    updateDiscountRecord: (state, action) => {
      const index = state.staffDiscountHistory.records.findIndex(record => record.id === action.payload.id);
      if (index !== -1) state.staffDiscountHistory.records[index] = action.payload;
    },

    // Invoice Payments
    addUndoRecord: (state, action) => {
      state.invoicePayments.undoHistory.push(action.payload);
    },
    updateUndoRecord: (state, action) => {
      const index = state.invoicePayments.undoHistory.findIndex(record => record.invoiceId === action.payload.invoiceId);
      if (index !== -1) state.invoicePayments.undoHistory[index] = action.payload;
    },

    // Billing History
    addTransaction: (state, action) => {
      state.billingHistory.transactions.push(action.payload);
    },
    updateTransaction: (state, action) => {
      const index = state.billingHistory.transactions.findIndex(trans => trans.id === action.payload.id);
      if (index !== -1) state.billingHistory.transactions[index] = action.payload;
    },

    // Deactivated Customers
    addDeactivatedCustomer: (state, action) => {
      state.deactivatedCustomers.customers.push(action.payload);
    },
    reactivateCustomer: (state, action) => {
      state.deactivatedCustomers.customers = state.deactivatedCustomers.customers.filter(
        customer => customer.id !== action.payload
      );
    },

    // General actions
    resetSection: (state, action) => {
      state[action.payload] = initialState[action.payload];
      state.status[action.payload] = 'idle';
      state.errors[action.payload] = null;
    },
    clearError: (state, action) => {
      if (action.payload === 'all') {
        Object.keys(state.errors).forEach(key => {
          state.errors[key] = null;
        });
      } else {
        state.errors[action.payload] = null;
      }
    },

    setError: (state, action) => {
      const { section, error } = action.payload;
      state.errors[section] = error;
    },

    // Enhanced Section Reset
    resetSection: (state, action) => {
      const section = action.payload;
      state[section] = {
        ...initialState[section],
        lastUpdated: new Date().toISOString()
      };
      state.status[section] = 'idle';
      state.errors[section] = null;
    },

    resetAll: () => initialState,

    updateTrialDays: (state, action) => {
      state.trialDaysRemaining = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder
      // Handle fetchAdminTools
      .addCase(fetchAdminTools.pending, (state) => {
        Object.keys(state.status).forEach(key => {
          state.status[key] = 'loading';
        });
      })
      .addCase(fetchAdminTools.fulfilled, (state, action) => {
        const data = action.payload;

        // Update all sections with received data
        Object.keys(data).forEach(key => {
          if (state[key] !== undefined) {
            state[key] = {
              ...data[key],
              lastUpdated: new Date().toISOString()
            };
          }
        });

        // Update status and clear errors
        Object.keys(state.status).forEach(key => {
          state.status[key] = 'succeeded';
          state.errors[key] = null;
        });

        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAdminTools.rejected, (state, action) => {
        Object.keys(state.status).forEach(key => {
          state.status[key] = 'failed';
          state.errors[key] = action.payload;
        });
      })

      // Handle updateAdminTools
      .addCase(updateAdminTools.pending, (state, action) => {
        const { section } = action.meta.arg;
        state.status[section] = 'loading';
        // Backup state before update for potential rollback
        if (section === 'cardDetails') {
          state.cardDetails.backup = {
            cards: [...state.cardDetails.cards],
            activeCardId: state.cardDetails.activeCardId
          };
        }
      })
      .addCase(updateAdminTools.fulfilled, (state, action) => {
        const { section, data, action: actionType } = action.payload;

        // Update the specific section with new data
        if (state[section] !== undefined) {
          state[section] = {
            ...data,
            lastUpdated: new Date().toISOString(),
            lastAction: actionType
          };
        }

        state.status[section] = 'succeeded';
        state.errors[section] = null;

        // Clean up backup after successful update
        if (section === 'cardDetails' && state.cardDetails.backup) {
          delete state.cardDetails.backup;
        }

        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateAdminTools.rejected, (state, action) => {
        const { section } = action.meta.arg;
        state.status[section] = 'failed';
        state.errors[section] = action.payload;

        // Restore backup state if update failed
        if (section === 'cardDetails' && state.cardDetails.backup) {
          state.cardDetails.cards = [...state.cardDetails.backup.cards];
          state.cardDetails.activeCardId = state.cardDetails.backup.activeCardId;
          delete state.cardDetails.backup;
        }
      });
  }
});

// Export actions
export const {
  setActiveComponent,
  addCard,
  updateCard,
  removeCard,
  setActiveCard,
  setShowAddCard,
  backupCardState,
  restoreCardState,
  addOrderDateChange,
  updateOrderDate,
  addCreditRecord,
  updateCreditRecord,
  addDiscountRecord,
  updateDiscountRecord,
  addUndoRecord,
  updateUndoRecord,
  addTransaction,
  updateTransaction,
  addDeactivatedCustomer,
  reactivateCustomer,
  resetSection,
  clearError,
  setError,
  resetAll,
  updateTrialDays
} = adminContentSlice.actions;

// Enhanced Selectors
export const selectAdminContent = (state) => state.adminContent;
export const selectActiveComponent = (state) => state.adminContent.activeComponent;
export const selectCardDetails = (state) => state.adminContent.cardDetails;
export const selectActiveCard = (state) => {
  const cardDetails = state.adminContent.cardDetails;
  return cardDetails.cards.find(card => card.id === cardDetails.activeCardId);
};
export const selectOrderDates = (state) => state.adminContent.orderDates;
export const selectStaffCreditHistory = (state) => state.adminContent.staffCreditHistory;
export const selectStaffDiscountHistory = (state) => state.adminContent.staffDiscountHistory;
export const selectInvoicePayments = (state) => state.adminContent.invoicePayments;
export const selectBillingHistory = (state) => state.adminContent.billingHistory;
export const selectDeactivatedCustomers = (state) => state.adminContent.deactivatedCustomers;
export const selectStatus = (section) => (state) => state.adminContent.status[section];
export const selectError = (section) => (state) => state.adminContent.errors[section];
export const selectTrialDaysRemaining = (state) => state.adminContent.trialDaysRemaining;
export const selectLastUpdated = (state) => state.adminContent.lastUpdated;
export const selectCardLastAction = (state) => state.adminContent.cardDetails.lastAction;

export default adminContentSlice.reducer;
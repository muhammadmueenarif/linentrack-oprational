import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Fetch discount settings from database
export const fetchDiscountSettings = createAsyncThunk(
  'discount/fetchDiscountSettings',
  async (adminId, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/discounts/${adminId}/${storeId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      console.log('Fetched discount settings:', data);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Update discount settings in database
export const updateDiscountSettingsAsync = createAsyncThunk(
  'discount/updateDiscountSettingsAsync',
  async ({ adminId, settings }, { rejectWithValue }) => {
    const storeId = localStorage.getItem('selectedStoreId');
    try {
      const response = await fetch(`http://localhost:3005/api/discounts/${adminId}/${storeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to update discount settings');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  loyaltyPoints: {
    isActive: false,
    redemptionPercentage: 5,
    convertToCredit: 500,
    applyToOrder: false
  },
  promoCodes: {
    filter: 'Active',
    codes: [] // Array of promo code objects
  },
  codesAndReferrals: {
    allowCustomerReferral: false
  },
  productDiscountRules: {
    rules: [] // Array of discount rule objects
  },
  promoCarousel: {
    slides: [] // Array of carousel slide objects
  },
  status: 'idle',
  error: null,
  lastUpdated: null,
  activeTab: 'LoyaltyPoints'
};

const discountSlice = createSlice({
  name: 'discount',
  initialState,
  reducers: {
    resetDiscountSettings: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    // Loyalty Points
    updateLoyaltySettings: (state, action) => {
      state.loyaltyPoints = {
        ...state.loyaltyPoints,
        ...action.payload
      };
    },
    // Promo Codes
    addPromoCode: (state, action) => {
      state.promoCodes.codes.push(action.payload);
    },
    updatePromoCodeFilter: (state, action) => {
      state.promoCodes.filter = action.payload;
    },
    // Codes and Referrals
    updateReferralSettings: (state, action) => {
      state.codesAndReferrals = {
        ...state.codesAndReferrals,
        ...action.payload
      };
    },
    // Product Discount Rules
    addDiscountRule: (state, action) => {
      state.productDiscountRules.rules.push(action.payload);
    },
    updateDiscountRule: (state, action) => {
      const index = state.productDiscountRules.rules.findIndex(
        rule => rule.id === action.payload.id
      );
      if (index !== -1) {
        state.productDiscountRules.rules[index] = action.payload;
      }
    },
    deleteDiscountRule: (state, action) => {
      state.productDiscountRules.rules = state.productDiscountRules.rules.filter(
        rule => rule.id !== action.payload
      );
    },
    // In discountSlice.js, add this to the reducers object:
      deletePromoCode: (state, action) => {
        state.promoCodes.codes = state.promoCodes.codes.filter(
            code => code.id !== action.payload
        );
      },
    // Promo Carousel
    addCarouselSlide: (state, action) => {
      state.promoCarousel.slides.push(action.payload);
    },
    updateCarouselSlide: (state, action) => {
      const index = state.promoCarousel.slides.findIndex(
        slide => slide.id === action.payload.id
      );
      if (index !== -1) {
        state.promoCarousel.slides[index] = action.payload;
      }
    },
    deleteCarouselSlide: (state, action) => {
      state.promoCarousel.slides = state.promoCarousel.slides.filter(
        slide => slide.id !== action.payload
      );
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch discount settings
      .addCase(fetchDiscountSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDiscountSettings.fulfilled, (state, action) => {
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
      .addCase(fetchDiscountSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update discount settings
      .addCase(updateDiscountSettingsAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateDiscountSettingsAsync.fulfilled, (state, action) => {
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
      .addCase(updateDiscountSettingsAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  resetDiscountSettings,
  clearError,
  setActiveTab,
  updateLoyaltySettings,
  addPromoCode,
  updatePromoCodeFilter,
  updateReferralSettings,
  addDiscountRule,
  updateDiscountRule,
  deleteDiscountRule,
  addCarouselSlide,
  deletePromoCode,
  updateCarouselSlide,
  deleteCarouselSlide
} = discountSlice.actions;

// Selectors
export const selectDiscountSettings = (state) => state.discount;
export const selectLoyaltyPoints = (state) => state.discount.loyaltyPoints;
export const selectPromoCodes = (state) => state.discount.promoCodes;
export const selectCodesAndReferrals = (state) => state.discount.codesAndReferrals;
export const selectProductDiscountRules = (state) => state.discount.productDiscountRules;
export const selectPromoCarousel = (state) => state.discount.promoCarousel;
export const selectDiscountStatus = (state) => state.discount.status;
export const selectDiscountError = (state) => state.discount.error;
export const selectLastUpdated = (state) => state.discount.lastUpdated;
export const selectActiveTab = (state) => state.discount.activeTab;


export default discountSlice.reducer;
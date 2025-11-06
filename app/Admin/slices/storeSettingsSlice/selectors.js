// storeSettingsSlice/selectors.js
import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
const selectStoreState = state => state.storeSettings;

// Memoized selectors
export const selectStores = createSelector(
    [selectStoreState],
    storeState => storeState.stores
);

export const selectSelectedStoreId = createSelector(
    [selectStoreState],
    storeState => storeState.selectedStoreId
);

export const selectStoreStatus = createSelector(
    [selectStoreState],
    storeState => storeState.status.stores
);

export const selectStoreErrors = createSelector(
    [selectStoreState],
    storeState => storeState.errors.stores
);

export const selectCurrentStore = createSelector(
    [selectStores, selectSelectedStoreId],
    (stores, selectedId) => stores.find(store => store.id === selectedId)
);

export const selectGroups = createSelector(
    [selectStoreState],
    storeState => storeState.groups || []
);

// Section status selectors
export const selectSectionStatus = section => createSelector(
    [selectStoreState],
    storeState => storeState.status[section]
);

export const selectSectionError = section => createSelector(
    [selectStoreState],
    storeState => storeState.errors[section]
);

// Group-related selectors
export const selectGroupsByStoreId = createSelector(
    [selectGroups, (_, storeId) => storeId],
    (groups, storeId) => groups.filter(group => group.storeId === storeId)
);

// Store settings selectors
export const selectStoreSettings = createSelector(
    [selectCurrentStore],
    currentStore => currentStore?.settings
);

// Specific section selectors
export const selectStoreInfo = createSelector(
    [selectCurrentStore],
    currentStore => ({
        storeName: currentStore?.storeName || '',
        address: currentStore?.address || '',
        city: currentStore?.city || '',
        country: currentStore?.country || '',
        zipCode: currentStore?.zipCode || '',
        plan: currentStore?.plan || '',
        period: currentStore?.period || '',
        phoneNumber: currentStore?.phoneNumber || ''
    })
);

export const selectServicesOffered = createSelector(
    [selectCurrentStore],
    currentStore => currentStore?.servicesOffered || {
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
    }
);

export const selectTaxSettings = createSelector(
    [selectCurrentStore],
    currentStore => currentStore?.tax || {
        salesTaxType: '',
        tax1: { name: '', rate: '' },
        tax2: { name: '', rate: '' },
        tax3: { name: '', rate: '' },
        taxVatNumber: '',
        customIdForReports: ''
    }
);

export const selectSecuritySettings = createSelector(
    [selectCurrentStore],
    currentStore => currentStore?.security || {
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
    }
);
// constants.js
export const API_URL = 'http://localhost:3005/api/store-settings';

export const getInitialStoreId = () => {
  if (typeof window !== "undefined" && localStorage) {
    return localStorage.getItem('selectedStoreId') || null;
  }
  return null;
};

export const initialStoreStructure = {
  id: '',
  name: '',
  address: '',
  city: '',
  country: '',
  zipCode: '',
  plan: '',
  period: '',
  phoneNumber: '',
  // Keeping the existing structure as well
  companyName: '',
  streetAddress: '',
  timezone: '',
  language: '',
  gpsCoordinates: {
    latitude: '',
    longitude: ''
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
      requireAdminClockIn: false,
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
  }
};

export const initialState = {
  stores: [],
  selectedStoreId: getInitialStoreId(),
  currentStore: null, // Add this for editing functionality
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
  lastUpdated: null
};
import { backendApi } from '../../apiEndpoints';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchSubscribers = createAsyncThunk('subscriber/fetchSubscribers', async () => {
  const response = await fetch(`${backendApi}/api/clients`);
  if (!response.ok) throw new Error('Failed to fetch subscribers');
  return response.json();
});

export const updateSubscriberType = createAsyncThunk(
  'subscriber/updateSubscriberType',
  async ({ userId, userType }) => {
    const response = await fetch(`${backendApi}/api/clients/${userId}/userType`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer TOKEN`, // Replace TOKEN with actual auth token if needed
      },  
      body: JSON.stringify({ userType }),
    });
    if (!response.ok) throw new Error('Failed to update subscriber type');
    return { userId, userType };
  }
);

export const fetchClientStatistics = createAsyncThunk(
  'subscriber/fetchClientStatistics',
  async () => {
    const response = await fetch(`${backendApi}/api/clients/statistics`);
    if (!response.ok) throw new Error('Failed to fetch client statistics');
    return response.json();
  }
);

const subscriberSlice = createSlice({
  name: 'subscriber',
  initialState: {
    subscribers: [],
    loading: false,
    error: null,
    statistics: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscribers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscribers.fulfilled, (state, action) => {
        state.loading = false;
        state.subscribers = action.payload;
      })
      .addCase(fetchSubscribers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateSubscriberType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubscriberType.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, userType } = action.payload;
        const subscriber = state.subscribers.find(sub => sub.userId === userId);
        if (subscriber) {
          subscriber.userType = userType;
        }
      })
      .addCase(updateSubscriberType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchClientStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchClientStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default subscriberSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../config';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

export const fetchStoreUsers = createAsyncThunk(
  'storeUsers/fetchStoreUsers',
  async (adminId, { rejectWithValue }) => {
    try {
      const usersRef = collection(db, 'StoreUsers');
      const adminDocRef = doc(usersRef, adminId);
      const usersCollectionRef = collection(adminDocRef, 'users');
      const usersSnap = await getDocs(usersCollectionRef);
      
      const users = [];
      usersSnap.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      return users;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadStoreUsers = createAsyncThunk(
  'storeUsers/uploadStoreUsers',
  async ({ adminId, users }, { rejectWithValue }) => {
    try {
      const usersRef = collection(db, 'StoreUsers');
      const adminDocRef = doc(usersRef, adminId);
      const usersCollectionRef = collection(adminDocRef, 'users');

      const batch = writeBatch(db);
      users.forEach((userData) => {
        const userDocRef = doc(usersCollectionRef);
        batch.set(userDocRef, {
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      return { usersCount: users.length };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  status: 'idle',
  error: null,
  uploadStatus: 'idle',
  uploadError: null,
  lastUpdated: null
};

const storeUsersSlice = createSlice({
  name: 'storeUsers',
  initialState,
  reducers: {
    resetUploadStatus: (state) => {
      state.uploadStatus = 'idle';
      state.uploadError = null;
    },
    clearError: (state) => {
      state.error = null;
      state.uploadError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStoreUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchStoreUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(uploadStoreUsers.pending, (state) => {
        state.uploadStatus = 'uploading';
        state.uploadError = null;
      })
      .addCase(uploadStoreUsers.fulfilled, (state) => {
        state.uploadStatus = 'succeeded';
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(uploadStoreUsers.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.uploadError = action.payload;
      });
  }
});

export const { resetUploadStatus, clearError } = storeUsersSlice.actions;
export const selectAllUsers = (state) => state.storeUsers.users;
export const selectStatus = (state) => state.storeUsers.status;
export const selectError = (state) => state.storeUsers.error;
export const selectUploadStatus = (state) => state.storeUsers.uploadStatus;
export const selectUploadError = (state) => state.storeUsers.uploadError;
export const selectLastUpdated = (state) => state.storeUsers.lastUpdated;

export default storeUsersSlice.reducer;
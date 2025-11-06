"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { db } from '../config'; // Assuming db config path is correct
// Import necessary Firestore functions
import { collection, query, where, getDocs, doc, getDoc, addDoc, Timestamp, limit } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('Admin'); // State for selected tab: Admin, POS, Operations
  const [focusedField, setFocusedField] = useState(null); // Track which field is focused

  // Redirect if already logged in - Operations specific redirect
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    const storeId = localStorage.getItem('selectedStoreId'); // Check if store is selected
    if (token && userData && storeId) {
        // Check user permissions and redirect accordingly
        try {
            const parsedData = JSON.parse(userData);
            if (parsedData.roleType === 'Staff' &&
                (parsedData.accessMode === 'operations' || parsedData.accessMode === 'operation')) {
              router.push('/');
            } else {
              router.push('/Login');
            }
        } catch (e) {
            console.error("Error parsing userData on redirect:", e);
            router.push('/Login');
        }
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Updated trackLogin function
  const trackLogin = async (userId, userType, storeId, storeName) => {
    try {
      let ip = "unknown";
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ip = ipData.ip;
        } else {
           console.warn("Failed to fetch IP from ipify API.");
        }
      } catch (apiError){
          console.error("Error fetching IP from ipify:", apiError);
      }

      const userAgent = navigator.userAgent || "unknown";

      await addDoc(collection(db, 'user_logins'), {
        userId: userId || "unknown_user",
        userType: userType || "unknown", // Admin, POS, Operations
        storeId: storeId || "unknown",   // Added Store ID
        storeName: storeName || "unknown", // Added Store Name
        ip,
        timestamp: Timestamp.now(),
        userAgent,
      });

    } catch (error) {
      console.error("Failed to track login:", error);
      // Optional: Add fallback logging here if needed
    }
  };

  // Add this new function to check if an IP is blocked
  const checkIfIpIsBlocked = async (ip) => {
    try {
      if (!ip || ip === "unknown") return false;
      
      const blockIpRef = collection(db, 'blockip');
      const q = query(blockIpRef, where('ip', '==', ip));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking blocked IP:", error);
      return false; // Default to not blocked on error to avoid locking out users
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Clear previous selections on new login attempt
    localStorage.removeItem('selectedStoreId');
    localStorage.removeItem('selectedStore');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');

    let userDoc = null;
    let userData = null;
    let collectionName = '';
    let redirectPath = '';
    let roleType = ''; // To distinguish between Admin (client) and Staff
    let selectedStoreId = null;
    let selectedStoreData = null;
    let usedFallbackStaffAdmin = false;

    
    try {
      // Get the IP first before proceeding with login
      let ip = "unknown";
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ip = ipData.ip;
          
          // Check if IP is blocked
          const isBlocked = await checkIfIpIsBlocked(ip);
          if (isBlocked) {
            throw new Error('Access denied: Your IP address has been blocked by an administrator. Please contact support for assistance.');
          }
        }
      } catch (apiError) {
        if (apiError.message.includes('Access denied: Your IP address has been blocked')) {
          throw apiError; // Re-throw the blocked IP error
        }
        console.error("Error fetching IP or checking block status:", apiError);
      }

      // Continue with the rest of the existing login flow...
      if (!formData.email || !formData.password) {
        throw new Error('Please provide email and password');
      }

      const rawEmail = formData.email.trim();
      const email = rawEmail.toLowerCase();
      const password = formData.password;

      console.info('[Login] Attempt start', { loginType, email, rawEmailDifferent: rawEmail !== email });

      // 1. Authenticate User and Determine Role (with Admin fallback)
      if (loginType === 'Admin') {
        collectionName = 'clients';
        roleType = 'Admin';

        // Primary: look in clients
        {
          const usersRef = collection(db, collectionName);
          // Try lowercased email first
          let querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));
          // Fallback: try raw input email (case-sensitive field)
          if (querySnapshot.empty) {
            console.debug('[Login] clients lookup with lowercased email returned empty. Trying raw email');
            querySnapshot = await getDocs(query(usersRef, where('email', '==', rawEmail)));
          }
          if (!querySnapshot.empty) {
            userDoc = querySnapshot.docs[0];
            userData = userDoc.data();
            console.info('[Login] Found Admin in clients', { userId: userDoc.id, email: userData?.email });
          }
        }

        // Fallback: if not found as client admin, check storeStaff with accessMode Admin
        if (!userDoc) {
          const staffRef = collection(db, 'storeStaff');
          // Try lowercased first, then raw
          let staffSnap = await getDocs(query(staffRef, where('email', '==', email)));
          if (staffSnap.empty) {
            console.debug('[Login] storeStaff lookup with lowercased email returned empty. Trying raw email');
            staffSnap = await getDocs(query(staffRef, where('email', '==', rawEmail)));
          }
          if (!staffSnap.empty) {
            // Find first with accessMode 'admin' (case-insensitive)
            const candidate = staffSnap.docs.find(d => (d.data()?.accessMode || '').toLowerCase() === 'admin');
            if (candidate) {
              userDoc = candidate;
              userData = candidate.data();
              collectionName = 'storeStaff';
              roleType = 'Staff';
              usedFallbackStaffAdmin = true;
              console.info('[Login] Using fallback Admin from storeStaff', { userId: userDoc.id, email: userData?.email, accessMode: userData?.accessMode, storeId: userData?.storeId });
            } else {
              console.warn('[Login] storeStaff records found for email, but none with accessMode Admin');
            }
          } else {
            console.warn('[Login] No records found in clients or storeStaff for provided email');
          }
        }

        if (!userDoc) {
          throw new Error(`Invalid credentials or user not found for ${loginType} role.`);
        }
      } else if (loginType === 'POS' || loginType === 'Operations') {
        collectionName = 'storeStaff';
        roleType = 'Staff';
        const usersRef = collection(db, collectionName);
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          throw new Error(`Invalid credentials or user not found for ${loginType} role.`);
        }
        userDoc = querySnapshot.docs[0];
        userData = userDoc.data();
        console.info('[Login] Found Staff for POS/Operations', { userId: userDoc.id, email: userData?.email, accessMode: userData?.accessMode, storeId: userData?.storeId });
      } else {
        throw new Error('Invalid login type selected');
      }

      // --- Password Verification (INSECURE) ---
      const ensurePasswordMatchOrFallback = async () => {
        const storedPassword = userData.password != null ? String(userData.password) : '';
        const passwordMatches = storedPassword === password;
        if (passwordMatches) {
          console.debug('[Login] Password verified');
          return true;
        }

        console.warn('[Login] Password mismatch', { userId: userDoc.id, collectionName, hasStoredPassword: !!userData.password, storedPasswordLength: storedPassword.length, inputPasswordLength: password.length });

        // If Admin login type and initial lookup was clients, try fallback to storeStaff admin with matching password
        if (loginType === 'Admin' && collectionName === 'clients') {
          try {
            const staffRef = collection(db, 'storeStaff');
            let staffSnap = await getDocs(query(staffRef, where('email', '==', email)));
            if (staffSnap.empty) {
              staffSnap = await getDocs(query(staffRef, where('email', '==', rawEmail)));
            }
            if (!staffSnap.empty) {
              const candidate = staffSnap.docs.find(d => (d.data()?.accessMode || '').toLowerCase() === 'admin');
              if (candidate) {
                const candData = candidate.data();
                const candPwd = candData.password != null ? String(candData.password) : '';
                if (candPwd === password) {
                  // Switch to fallback staff admin account
                  userDoc = candidate;
                  userData = candData;
                  collectionName = 'storeStaff';
                  roleType = 'Staff';
                  usedFallbackStaffAdmin = true;
                  console.info('[Login] Falling back to storeStaff Admin with matching password', { userId: userDoc.id, email: userData?.email, accessMode: userData?.accessMode });
                  return true;
                } else {
                  console.warn('[Login] Fallback storeStaff Admin password mismatch');
                }
              } else {
                console.warn('[Login] Fallback storeStaff Admin not found for email');
              }
            } else {
              console.warn('[Login] No storeStaff records for email during fallback');
            }
          } catch (fbErr) {
            console.error('[Login] Error during fallback staff admin lookup', fbErr);
          }
        }

        return false;
      };

      const ok = await ensurePasswordMatchOrFallback();
      if (!ok) {
        throw new Error(`Invalid credentials for ${loginType} role.`);
      }
      // --- End Security Warning ---

      // 2. Verify Access Mode (for Staff)
      if (roleType === 'Staff') {
        const requiredAccessMode = loginType === 'Admin' ? 'admin' : loginType.toLowerCase();
        const userAccessMode = userData.accessMode?.toLowerCase();

        if (!userAccessMode || userAccessMode !== requiredAccessMode) {
           console.warn('[Login] Access mode check failed', { requiredAccessMode, userAccessMode, loginType, usedFallbackStaffAdmin });
           throw new Error(`Login failed: You do not have permission to access the ${loginType} portal.`);
        }
        // Set redirect path based on verified access mode
        if (requiredAccessMode === 'admin') redirectPath = '/Admin';
        else if (requiredAccessMode === 'pos') redirectPath = '/Pos';
        else if (requiredAccessMode === 'operations') redirectPath = '/Admin/Operational';
        else throw new Error('Configuration error: Invalid redirect path for staff.');

      } else { // Admin role
        redirectPath = '/Admin'; // Default redirect for Admin
      }
      console.info('[Login] Role resolved', { roleType, redirectPath, usedFallbackStaffAdmin });

      // 3. Fetch and Select Store Details
      if (roleType === 'Admin') {
        // Admin: Fetch all stores associated with this adminId and select the first one
        const storesQuery = query(collection(db, 'stores'), where('adminId', '==', userDoc.id), limit(1));
        const storesSnapshot = await getDocs(storesQuery);

        if (storesSnapshot.empty) {
            // Handle case where Admin has no stores assigned
            throw new Error("Login failed: No stores are currently associated with this admin account.");
        }
        const firstStoreDoc = storesSnapshot.docs[0];
        selectedStoreId = firstStoreDoc.id;
        selectedStoreData = firstStoreDoc.data();
        console.debug('[Login] Admin store selected', { selectedStoreId, storeName: selectedStoreData?.storeName });

      } else { // Staff role
        // Staff: Fetch the specific store assigned to the staff member
        const staffStoreId = userData.storeId;
        if (!staffStoreId) {
            throw new Error("Login failed: Store assignment is missing for this staff account.");
        }
        const storeRef = doc(db, 'stores', staffStoreId);
        const storeSnap = await getDoc(storeRef);

        if (!storeSnap.exists()) {
            throw new Error(`Login failed: Assigned store (ID: ${staffStoreId}) not found. Please contact support.`);
        }
        selectedStoreId = storeSnap.id;
        selectedStoreData = storeSnap.data();
        console.debug('[Login] Staff store resolved', { selectedStoreId, storeName: selectedStoreData?.storeName });
      }

      // Ensure we have store data before proceeding
      if (!selectedStoreId || !selectedStoreData) {
           throw new Error("Login failed: Could not retrieve store details.");
      }
      console.info('[Login] Store details ready', { selectedStoreId, storeName: selectedStoreData?.storeName });


      // --- (Optional) Demo account expiration check ---
      if (collectionName === 'clients' && userData.userType === 'Demo' && userData.createdDate) {
         // ... (keep existing demo check logic) ...
         const creationDate = userData.createdDate.toDate ? userData.createdDate.toDate() : new Date(userData.createdDate);
         const daysRemaining = parseInt(userData.days) || 0;
         const currentDate = new Date();
         const expirationDate = new Date(creationDate);
         expirationDate.setDate(expirationDate.getDate() + daysRemaining);
         if (currentDate > expirationDate) {
           throw new Error('Your demo account has expired. Please contact support.');
         }
      }


      // 4. Prepare and Store Data in localStorage
      const token = `insecure-dev-token-${userDoc.id}-${Date.now()}`; // INSECURE TOKEN

      const storedUserData = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        roleType: roleType, // 'Admin' or 'Staff'
        // Add selected store info directly for convenience
        selectedStoreId: selectedStoreId,
        selectedStoreName: selectedStoreData.storeName,
        // Include role-specific fields
        ...(roleType === 'Admin' && {
            userType: userData.userType,
            companyName: userData.companyName
        }),
        ...(roleType === 'Staff' && {
            accessMode: userData.accessMode,
            ownerAdminId: userData.userId,
            // storeId and storeName are already included above
        })
      };

      localStorage.setItem('token', token);
      // Clear any previous user's permission cache before saving new user
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('userPermissions:')) localStorage.removeItem(k);
        });
      } catch {}
      localStorage.setItem('userData', JSON.stringify(storedUserData));
      localStorage.setItem('selectedStoreId', selectedStoreId);
      // Store the full store object as well
      localStorage.setItem('selectedStoredata', JSON.stringify({ id: selectedStoreId, ...selectedStoreData }));
      localStorage.setItem('selectedStore', selectedStoreData.storeName);

      // 5. Track Login with Store Info
      await trackLogin(userDoc.id, loginType, selectedStoreId, selectedStoreData.storeName);

      // 6. Auto Clock-In for Staff (if not already clocked in today and within shift hours)
      if (roleType === 'Staff') {
        try {
          const todayKey = new Date().toLocaleDateString('en-GB');
          const now = new Date();
          const currentHour = now.getHours();

          // Check store settings for allowed shift hours (default 6 AM - 10 PM)
          let shiftStartHour = 6; // 6 AM
          let shiftEndHour = 22; // 10 PM

          try {
            const storeSettingsRef = doc(db, 'storeSettings', selectedStoreId);
            const storeSnap = await getDoc(storeSettingsRef);
            if (storeSnap.exists()) {
              const settings = storeSnap.data();
              shiftStartHour = settings?.security?.clockInSettings?.shiftStartHour ?? 6;
              shiftEndHour = settings?.security?.clockInSettings?.shiftEndHour ?? 22;
            }
          } catch (settingsError) {
            console.warn('[Login] Could not fetch shift hours settings', settingsError);
          }

          // Only auto clock-in if within shift hours
          if (currentHour >= shiftStartHour && currentHour < shiftEndHour) {
            const staffShiftsRef = collection(db, 'staffShifts');
            const shiftsQuery = query(
              staffShiftsRef,
              where('storeId', '==', selectedStoreId),
              where('userId', '==', userDoc.id),
              where('date', '==', todayKey),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const shiftsSnap = await getDocs(shiftsQuery);

            // Only auto clock-in if no shift exists today or current shift has clocked out
            if (shiftsSnap.empty || (shiftsSnap.docs[0].data().clockOut && shiftsSnap.docs[0].data().clockOut !== '')) {
              const clockInTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

              const shiftPayload = {
                storeId: selectedStoreId,
                storeName: selectedStoreData.storeName,
                userId: userDoc.id,
                name: userData.name || userData.email || 'Staff',
                date: todayKey,
                clockIn: clockInTime,
                clockOut: '',
                clockInISO: now.toISOString(),
                clockOutISO: '',
                createdAt: Timestamp.now(),
              };

              // Save to staffShifts collection
              await addDoc(staffShiftsRef, shiftPayload);

              // Also save to shifts collection for Nav Menu → Users Hours
              await addDoc(collection(db, 'shifts'), shiftPayload);

              console.info('[Login] Auto clock-in created for staff', { userId: userDoc.id, time: clockInTime });
            }
          } else {
            console.info('[Login] Auto clock-in skipped - outside shift hours', {
              currentHour,
              shiftStartHour,
              shiftEndHour,
              userId: userDoc.id
            });
          }
        } catch (clockError) {
          console.warn('[Login] Auto clock-in failed', clockError);
          // Don't fail login if clock-in fails
        }
      }

      // 7. Redirect
      toast.success(`Logged in successfully as ${loginType} for store: ${selectedStoreData.storeName}! Redirecting...`);
      router.push(redirectPath);

    } catch (error) {
      console.error('Login error:', error);
      // Clear storage on any error during the process
      localStorage.removeItem('selectedStoreId');
      localStorage.removeItem('selectedStore');
      localStorage.removeItem('selectedStoredata');
      localStorage.removeItem('token');
      localStorage.removeItem('userData');

      const message = error.message.includes('Access denied: Your IP address has been blocked')
          ? error.message // Display the blocked IP message
          : error.message.includes('credentials') || error.message.includes('not found for')
          ? `Invalid credentials or user not found for ${loginType}.`
          : error.message.includes('permission') || error.message.includes('No stores') || error.message.includes('Store assignment is missing') || error.message.includes('store (ID:') || error.message.includes('Could not retrieve store details')
          ? error.message // Display specific permission/store errors
          : error.message.includes('expired')
          ? error.message
          : `Login failed for ${loginType}. Please try again.`; // Generic fallback
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }     

  const loginTypes = ['Admin', 'POS', 'Operations']; // Define the types

  return (
    <div className="min-h-screen flex flex-col md:flex-row ">
      {/* Left Side - Branding */}
      <div
        style={{
          backgroundImage: `url('/Login/loginleftSide.png')`, // Ensure this path is correct
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="hidden md:flex md:w-1/2 bg-blue-700 p-12 lg:p-16 flex-col justify-center relative overflow-hidden">
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 lg:p-10 rounded-lg shadow-xl space-y-6">

          <h2 className="text-2xl font-semibold text-gray-800 text-center">
              Login with your credentials
          </h2>

          {/* Login Type Tabs */}
          <div className="flex space-x-2 border-b border-gray-200 pb-3 justify-center">
             {loginTypes.map((type) => (
               <button
                 key={type}
                 type="button"
                 onClick={() => setLoginType(type)}
                 disabled={loading}
                 className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
                   loginType === type
                     ? 'bg-blue-600 text-white shadow-md scale-105'
                     : 'text-gray-600 hover:bg-gray-100 border border-gray-300 hover:text-gray-800'
                 } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
               >
                 {type}
               </button>
             ))}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Email Input with Floating Label Animation */}
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={`block w-full px-3 pt-6 pb-2 border-2 rounded-md shadow-sm transition-all duration-200 ease-in-out sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  formData.email || focusedField === 'email'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                disabled={loading}
              />
              <label
                htmlFor="email"
                className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none ${
                  formData.email || focusedField === 'email'
                    ? '-top-2 bg-white px-1 text-xs text-blue-600 font-medium'
                    : 'top-3 text-sm text-gray-500'
                }`}
              >
                Email
              </label>
            </div>

            {/* Password Input with Floating Label Animation */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className={`block w-full px-3 pt-6 pb-2 border-2 rounded-md shadow-sm transition-all duration-200 ease-in-out sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  formData.password || focusedField === 'password'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                disabled={loading}
              />
              <label
                htmlFor="password"
                className={`absolute left-3 transition-all duration-200 ease-in-out pointer-events-none ${
                  formData.password || focusedField === 'password'
                    ? '-top-2 bg-white px-1 text-xs text-blue-600 font-medium'
                    : 'top-3 text-sm text-gray-500'
                }`}
              >
                Password
              </label>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <a href="#" className={`text-sm font-medium text-blue-600 hover:text-blue-500 ${loading ? 'pointer-events-none opacity-70' : ''}`}>
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </div>
              ) : (
                 `Sign In as ${loginType}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

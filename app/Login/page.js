"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { db } from '../config'; // Assuming db config path is correct
// Import necessary Firestore functions
import { collection, query, where, getDocs, doc, getDoc, addDoc, Timestamp, limit, orderBy } from 'firebase/firestore';
import { hasOperationsAccess } from '../enum/AccessMode';

export const dynamic = 'force-dynamic';

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const loginType = 'Operations'; // Operations is the only login type for this portal
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
                hasOperationsAccess(parsedData.accessMode)) {
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
    let roleType = ''; // Staff role for Operations portal
    let selectedStoreId = null;
    let selectedStoreData = null;

    
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

      // 1. Authenticate User - Operations only (Staff with accessMode 'operations' or 'operation')
      collectionName = 'storeStaff';
      roleType = 'Staff';
      const usersRef = collection(db, collectionName);
      // Try lowercased email first
      let querySnapshot = await getDocs(query(usersRef, where('email', '==', email)));
      // Fallback: try raw input email (case-sensitive field)
      if (querySnapshot.empty) {
        console.debug('[Login] storeStaff lookup with lowercased email returned empty. Trying raw email');
        querySnapshot = await getDocs(query(usersRef, where('email', '==', rawEmail)));
      }
      if (querySnapshot.empty) {
        throw new Error(`Invalid credentials or user not found for ${loginType} role.`);
      }
      userDoc = querySnapshot.docs[0];
      userData = userDoc.data();
      console.info('[Login] Found Staff for Operations', { userId: userDoc.id, email: userData?.email, accessMode: userData?.accessMode, storeId: userData?.storeId });

      // --- Password Verification (INSECURE) ---
      const ensurePasswordMatchOrFallback = async () => {
        const storedPassword = userData.password != null ? String(userData.password) : '';
        const passwordMatches = storedPassword === password;
        if (passwordMatches) {
          console.debug('[Login] Password verified');
          return true;
        }

        console.warn('[Login] Password mismatch', { userId: userDoc.id, collectionName, hasStoredPassword: !!userData.password, storedPasswordLength: storedPassword.length, inputPasswordLength: password.length });
        return false;
      };

      const ok = await ensurePasswordMatchOrFallback();
      if (!ok) {
        throw new Error(`Invalid credentials for ${loginType} role.`);
      }
      // --- End Security Warning ---

      // 2. Verify Access Mode (must be 'Operations' for Operations portal - case-insensitive)
      if (!hasOperationsAccess(userData.accessMode)) {
         console.warn('[Login] Access mode check failed', { userAccessMode: userData.accessMode, loginType });
         throw new Error(`Login failed: You do not have permission to access the Operations portal.`);
      }
      // Set redirect path for Operations
      redirectPath = '/Admin/Operational';
      console.info('[Login] Role resolved', { roleType, redirectPath });

      // 3. Fetch and Select Store Details (Staff role - Operations)
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

      // Ensure we have store data before proceeding
      if (!selectedStoreId || !selectedStoreData) {
           throw new Error("Login failed: Could not retrieve store details.");
      }
      console.info('[Login] Store details ready', { selectedStoreId, storeName: selectedStoreData?.storeName });




      // 4. Prepare and Store Data in localStorage
      const token = `insecure-dev-token-${userDoc.id}-${Date.now()}`; // INSECURE TOKEN

      const storedUserData = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        roleType: roleType, // 'Staff' for Operations
        // Add selected store info directly for convenience
        selectedStoreId: selectedStoreId,
        selectedStoreName: selectedStoreData.storeName,
        // Include role-specific fields (Staff/Operations)
        accessMode: userData.accessMode,
        ownerAdminId: userData.userId,
        // storeId and storeName are already included above
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
        <div className="w-full max-w-sm bg-white px-8 py-12 lg:px-10 lg:py-16 rounded-lg border border-gray-300 space-y-6">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/Logo.png"
              alt="LinenTrack Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 text-center">
              Login to your Operations
          </h2>

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
                 'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

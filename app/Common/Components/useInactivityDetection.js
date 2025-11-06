"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config';

const useInactivityDetection = (userData, storeId) => {
  const [isInactive, setIsInactive] = useState(false);
  const [showPINPopup, setShowPINPopup] = useState(false);
  const [inactivityTimeout, setInactivityTimeout] = useState(null);
  const [isClockStopped, setIsClockStopped] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  
  const timeoutRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const isStaff = userData?.roleType === 'Staff';
  const isPOSAccess = userData?.accessMode?.toLowerCase() === 'pos';

  // Fetch security settings to get inactivity timeout
  const fetchSecuritySettings = useCallback(async () => {
    if (!storeId || !isStaff) return null;
    
    try {
      const storeSettingsRef = doc(db, 'storeSettings', storeId);
      const storeSnap = await getDoc(storeSettingsRef);
      
      if (storeSnap.exists()) {
        const storeData = storeSnap.data();
        const securityData = storeData.security || {};
        const pinSettings = securityData.pinSettings || {};
        
        return pinSettings.inactivityTimeout || 0;
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    }
    
    return 0;
  }, [storeId, isStaff]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(async () => {
    if (!isStaff || !isPOSAccess) return;
    
    setLastActivityTime(Date.now());
    setIsInactive(false);
    setShowPINPopup(false);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Get timeout from security settings
    const timeoutMinutes = await fetchSecuritySettings();
    
    if (timeoutMinutes > 0) {
      const timeoutMs = timeoutMinutes * 60 * 1000; // Convert to milliseconds
      
      timeoutRef.current = setTimeout(() => {
        setIsInactive(true);
        setShowPINPopup(true);
        setIsClockStopped(true);
      }, timeoutMs);
    }
  }, [isStaff, isPOSAccess, fetchSecuritySettings]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (!isStaff || !isPOSAccess) return;
    
    // Clear any existing activity timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Debounce activity detection (wait 1 second after last activity)
    activityTimeoutRef.current = setTimeout(() => {
      resetInactivityTimer();
    }, 1000);
  }, [isStaff, isPOSAccess, resetInactivityTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!isStaff || !isPOSAccess) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [isStaff, isPOSAccess, handleActivity, resetInactivityTimer]);

  // Handle PIN verification success
  const handlePINSuccess = useCallback(() => {
    setShowPINPopup(false);
    setIsInactive(false);
    setIsClockStopped(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Handle PIN popup close
  const handlePINClose = useCallback(() => {
    setShowPINPopup(false);
    // Don't reset inactivity timer here - let it continue
  }, []);

  // Get clock in function for auto clock-in after PIN verification
  const getClockInFunction = useCallback(() => {
    return async () => {
      try {
        if (!userData?.id || !storeId) return;
        
        const now = new Date();
        const formatTime = (date) => {
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
        };
        
        const formatDateKey = (date) => {
          return date.toLocaleDateString('en-GB');
        };
        
        const parseToISO = (date, timeInput) => {
          if (timeInput && timeInput.trim()) {
            const [time, period] = timeInput.trim().split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            
            const newDate = new Date(date);
            newDate.setHours(hour24, parseInt(minutes), 0, 0);
            return newDate.toISOString();
          }
          return date.toISOString();
        };

        const timeDisplay = formatTime(now);
        const clockInISO = parseToISO(now, timeDisplay);
        
        const payload = {
          storeId,
          storeName: localStorage.getItem('selectedStore') || '',
          userId: userData.id,
          name: userData.name || userData.email || 'Staff',
          date: formatDateKey(now),
          clockIn: timeDisplay,
          clockOut: '',
          clockInISO,
          clockOutISO: '',
          createdAt: new Date().toISOString(),
          autoClockIn: true, // Flag to indicate this was an auto clock-in
          inactivityReason: 'PIN verification after timeout'
        };

        // Import Firebase functions dynamically to avoid SSR issues
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        
        await addDoc(collection(db, 'staffShifts'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        
        console.log('Auto clock-in successful after PIN verification');
      } catch (error) {
        console.error('Auto clock-in failed:', error);
      }
    };
  }, [userData, storeId]);

  return {
    isInactive,
    showPINPopup,
    isClockStopped,
    lastActivityTime,
    handlePINSuccess,
    handlePINClose,
    getClockInFunction,
    resetInactivityTimer
  };
};

export default useInactivityDetection;





"use client";
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config';

const useAutoClockManager = (userData, storeId) => {
  const [currentShift, setCurrentShift] = useState(null);
  const [isAutoClockEnabled, setIsAutoClockEnabled] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [hasManualClockIn, setHasManualClockIn] = useState(false);

  // Get shift configuration from store settings
  const getShiftConfiguration = useCallback(async () => {
    if (!storeId) return null;
    
    try {
      const storeSettingsRef = doc(db, 'storeSettings', storeId);
      const storeSnap = await getDocs(storeSettingsRef);
      
      if (storeSnap.exists()) {
        const storeData = storeSnap.data();
        return storeData.shiftSettings || null;
      }
    } catch (error) {
      console.error('Error fetching shift configuration:', error);
    }
    return null;
  }, [storeId]);

  // Check if staff needs manual clock-in (first time of the day)
  const checkManualClockInRequired = useCallback(async () => {
    if (!userData?.id || !storeId) return false;
    
    try {
      const today = new Date().toLocaleDateString('en-GB');
      const shiftsRef = collection(db, 'staffShifts');
      const q = query(
        shiftsRef,
        where('userId', '==', userData.id),
        where('storeId', '==', storeId),
        where('date', '==', today),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.empty; // If no shifts today, manual clock-in required
    } catch (error) {
      console.error('Error checking manual clock-in requirement:', error);
      return true; // Default to requiring manual clock-in on error
    }
  }, [userData?.id, storeId]);

  // Auto clock-in when staff becomes active after PIN verification
  const performAutoClockIn = useCallback(async () => {
    if (!userData?.id || !storeId || !isAutoClockEnabled) return;
    
    try {
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
      
      const payload = {
        storeId,
        storeName: localStorage.getItem('selectedStore') || '',
        userId: userData.id,
        name: userData.name || userData.email || 'Staff',
        date: formatDateKey(now),
        clockIn: formatTime(now),
        clockOut: '',
        clockInISO: now.toISOString(),
        clockOutISO: '',
        createdAt: new Date().toISOString(),
        autoClockIn: true,
        reason: 'Auto clock-in after PIN verification'
      };

      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'staffShifts'), {
        ...payload,
        createdAt: serverTimestamp()
      });
      
      setCurrentShift({ ...payload, id: 'temp' });
      console.log('Auto clock-in successful');
    } catch (error) {
      console.error('Auto clock-in failed:', error);
    }
  }, [userData, storeId, isAutoClockEnabled]);

  // Auto clock-out when shift time expires
  const performAutoClockOut = useCallback(async () => {
    if (!currentShift || !storeId) return;
    
    try {
      const now = new Date();
      const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      };
      
      const hoursWorked = currentShift.clockInISO ? 
        Math.max(0, (now - new Date(currentShift.clockInISO)) / (1000 * 60 * 60)) : 0;
      
      const updateData = {
        clockOut: formatTime(now),
        clockOutISO: now.toISOString(),
        hours: hoursWorked.toFixed(2),
        autoClockOut: true,
        reason: 'Auto clock-out due to shift time expiration'
      };

      if (currentShift.id !== 'temp') {
        const { updateDoc, doc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'staffShifts', currentShift.id), updateData);
      }
      
      setCurrentShift(null);
      setIsAutoClockEnabled(false);
      console.log('Auto clock-out successful');
    } catch (error) {
      console.error('Auto clock-out failed:', error);
    }
  }, [currentShift, storeId]);

  // Initialize auto clock system
  useEffect(() => {
    const initializeAutoClock = async () => {
      if (!userData?.id || !storeId) return;
      
      const needsManualClockIn = await checkManualClockInRequired();
      setHasManualClockIn(needsManualClockIn);
      
      if (!needsManualClockIn) {
        setIsAutoClockEnabled(true);
        // Check if there's an active shift
        const today = new Date().toLocaleDateString('en-GB');
        const shiftsRef = collection(db, 'staffShifts');
        const q = query(
          shiftsRef,
          where('userId', '==', userData.id),
          where('storeId', '==', storeId),
          where('date', '==', today),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const shift = snapshot.docs[0];
            const shiftData = { id: shift.id, ...shift.data() };
            
            if (!shiftData.clockOut) {
              setCurrentShift(shiftData);
            } else {
              setCurrentShift(null);
            }
          } else {
            setCurrentShift(null);
          }
        });
        
        return () => unsubscribe();
      }
    };
    
    initializeAutoClock();
  }, [userData?.id, storeId, checkManualClockInRequired]);

  // Check for shift time expiration
  useEffect(() => {
    if (!currentShift || !isAutoClockEnabled) return;
    
    const checkShiftExpiration = () => {
      const now = new Date();
      const shiftStart = new Date(currentShift.clockInISO);
      const shiftDuration = (now - shiftStart) / (1000 * 60 * 60); // hours
      
      // Default shift duration is 8 hours, can be configured
      const maxShiftHours = 8;
      
      if (shiftDuration >= maxShiftHours) {
        performAutoClockOut();
      }
    };
    
    const interval = setInterval(checkShiftExpiration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentShift, isAutoClockEnabled, performAutoClockOut]);

  return {
    currentShift,
    isAutoClockEnabled,
    hasManualClockIn,
    performAutoClockIn,
    performAutoClockOut,
    setHasManualClockIn
  };
};

export default useAutoClockManager;





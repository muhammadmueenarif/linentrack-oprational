"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config';

const ClockContext = createContext();

export const useClock = () => {
  const context = useContext(ClockContext);
  if (!context) {
    throw new Error('useClock must be used within a ClockProvider');
  }
  return context;
};

export const ClockProvider = ({ children }) => {
  const [currentShift, setCurrentShift] = useState(null);
  const [isClockStopped, setIsClockStopped] = useState(false);
  const [userData, setUserData] = useState(null);
  const [storeId, setStoreId] = useState(null);

  // Get user data and store ID
  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData') || 'null');
    const storedStoreId = localStorage.getItem('selectedStoreId');
    
    setUserData(storedUserData);
    setStoreId(storedStoreId);
  }, []);

  // Listen for current shift
  useEffect(() => {
    if (!userData?.id || !storeId) return;

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
        
        // Only set as current shift if it doesn't have a clock out
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
  }, [userData?.id, storeId]);

  // Function to stop clock when staff becomes inactive
  const stopClock = () => {
    setIsClockStopped(true);
  };

  // Function to resume clock when staff verifies PIN
  const resumeClock = () => {
    setIsClockStopped(false);
  };

  const value = {
    currentShift,
    isClockStopped,
    stopClock,
    resumeClock,
    userData,
    storeId
  };

  return (
    <ClockContext.Provider value={value}>
      {children}
    </ClockContext.Provider>
  );
};





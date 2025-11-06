"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config';

const InactivityPINPopup = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userData, 
  storeId,
  onClockIn 
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const pinInputRefs = useRef([]);

  const maxAttempts = 3;

  useEffect(() => {
    if (isOpen) {
      // Reset state when popup opens
      setPin(['', '', '', '']);
      setError('');
      setAttempts(0);
      // Focus first input
      setTimeout(() => {
        if (pinInputRefs.current[0]) {
          pinInputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (attempts >= maxAttempts) {
      setError('Maximum attempts exceeded. Please contact administrator.');
      return;
    }

    const enteredPin = pin.join('');
    if (enteredPin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get staff PIN from Firestore
      const staffRef = doc(db, 'storeStaff', userData.id);
      const staffSnap = await getDoc(staffRef);
      
      if (!staffSnap.exists()) {
        throw new Error('Staff record not found');
      }

      const staffData = staffSnap.data();
      const storedPin = staffData.quickPin || '';

      if (enteredPin === storedPin) {
        // PIN is correct
        setError('');
        
        // Auto clock in if needed
        if (onClockIn) {
          await onClockIn();
        }
        
        onSuccess();
      } else {
        // PIN is incorrect
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setError('Maximum attempts exceeded. Please contact administrator.');
        } else {
          setError(`Incorrect PIN. ${maxAttempts - newAttempts} attempts remaining.`);
        }
        
        // Reset PIN
        setPin(['', '', '', '']);
        pinInputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Error verifying PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (attempts >= maxAttempts) {
      // If max attempts exceeded, force logout
      localStorage.removeItem('userData');
      localStorage.removeItem('selectedStoreId');
      localStorage.removeItem('selectedStoredata');
      window.location.href = '/Login';
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          {/* Background blur overlay */}
          <div className="absolute inset-0 backdrop-blur-sm" />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {attempts >= maxAttempts ? 'Access Denied' : 'Enter Your PIN'}
              </h2>
              <p className="text-gray-600">
                {attempts >= maxAttempts 
                  ? 'Maximum attempts exceeded. You will be logged out.'
                  : 'Please enter your 4-digit PIN to continue working.'
                }
              </p>
            </div>

            {/* PIN Input Form */}
            {attempts < maxAttempts && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center space-x-3">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => pinInputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <p className={`text-sm ${error.includes('Maximum attempts') ? 'text-red-600' : 'text-red-500'}`}>
                      {error}
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || pin.join('').length !== 4}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            )}

            {/* Close Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                {attempts >= maxAttempts ? 'Logout' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InactivityPINPopup;

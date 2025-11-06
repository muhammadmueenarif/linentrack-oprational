'use client';

import { useState, useEffect, useRef } from 'react';

const useLoadingTimeout = (isLoading, timeoutMs = 2000) => {
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to show loading after specified delay
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, timeoutMs);
    } else {
      // Clear timeout and hide loading immediately when done
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, timeoutMs]);

  return showLoading;
};

export default useLoadingTimeout;

import React, { useEffect } from 'react';

const DotLoader = () => {
  useEffect(() => {
    // Create and append the style tag on the client side
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dotBounce {
        0%, 80%, 100% { 
          transform: translateY(0);
        }
        40% { 
          transform: translateY(-12px);
        }
      }
      
      .animate-dot1 {
        animation: dotBounce 1.4s ease-in-out 0s infinite;
      }
      
      .animate-dot2 {
        animation: dotBounce 1.4s ease-in-out 0.2s infinite;
      }
      
      .animate-dot3 {
        animation: dotBounce 1.4s ease-in-out 0.4s infinite;
      }
    `;
    document.head.appendChild(style);

    // Clean up the style tag when the component is unmounted
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-dot1"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-dot2"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-dot3"></div>
      </div>
    </div>
  );
};

export default DotLoader;

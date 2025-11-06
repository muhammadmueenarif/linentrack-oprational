import React from 'react';

export const SuccessMessage = ({ message }) => (
  <div  style={{zIndex:"999"}} className="fixed top-16 left-1/2 transform -translate-x-1/2 -translate-y-1/2
  
  bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center" role="alert">
    <svg className="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM6.7 9.29L9 11.6l4.3-4.3 1.4 1.42L9 14.4l-3.7-3.7 1.4-1.42z"/>
    </svg>
    <span className="block sm:inline">{message}</span>
  </div>
);

export const ErrorMessage = ({ message }) => (
  <div 
  style={{zIndex:"999"}} 
  className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center" role="alert">
    <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z"/>
    </svg>
    <span className="block sm:inline">{message}</span>
  </div>
);

export const WarningMessage = ({ message }) => (
  <div
  style={{zIndex:"999"}}
  className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center" role="alert">
     <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z"/>
    </svg>
    <span className="block sm:inline">{message}</span>
  </div>
);

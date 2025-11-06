// components/RoundedButton.js
import React from 'react';
// Removed PropTypes import

// Define the component
const RoundedButton = ({
  innerText,
  onClick,
  width = 'w-auto', // Default width if none is provided
  className = '',   // Default empty string for additional classes
}) => {
  // Base styles for the button matching the image
  const baseStyles = `
    py-2 px-6  // Padding (adjust as needed)
    text-lg     // Text size (adjust as needed)
    font-medium // Font weight
    rounded-full // Makes the button fully rounded
    shadow-sm   // Optional subtle shadow
    transition duration-150 ease-in-out // Smooth transition for hover/focus
    text-center // Ensure text is centered
  `;

  // Color styles matching the image (light background, blue/purple text)
  // Using indigo, adjust if you prefer purple or blue
  const colorStyles = `
    bg-indigo-100   // Light indigo background
    text-indigo-700 // Darker indigo text
    hover:bg-indigo-200 // Slightly darker background on hover
  `;

  // Combine base styles, color styles, the width prop, and any additional classes
  const combinedClassName = `${baseStyles} ${colorStyles} ${width} ${className}`;

  return (
    // Use standard JSX syntax
    <button
      type="button" // Good practice for buttons not submitting forms
      onClick={onClick}
      className={combinedClassName.trim()} // Trim any extra whitespace
    >
      {innerText}
    </button>
  );
};


export default RoundedButton;

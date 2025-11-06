import React, { useState, useEffect } from 'react';

export const FloatingInput = ({ 
  id, 
  label, 
  type = 'text', 
  className = '', 
  minWidth = '', 
  marginRight = '', 
  value: externalValue,
  onChange,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  
  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    if (onChange) {
      onChange(id, newValue);
    }
  };

  const displayValue = externalValue !== undefined ? externalValue : internalValue;
  const hasValue = displayValue !== undefined && displayValue !== null && displayValue !== '';

  return (
    <div className={`relative mb-4 ${className}`} style={{ minWidth, marginRight }}>
      <div className="relative" style={{ isolation: 'isolate' }}>
        <input
          type={type}
          id={id}
          className="block px-3 py-2.5 w-full text-gray-700 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent peer"
          placeholder=" "
          value={displayValue || ''}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {label && (
          <label
            htmlFor={id}
            className={`absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1 ${
              (isFocused || hasValue) ? 'text-blue-600 -translate-y-4 scale-75 top-2' : ''
            }`}
            style={{ zIndex: 1 }}
          >
            {label}
          </label>
        )}
      </div>
    </div>
  );
};
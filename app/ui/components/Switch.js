import React from 'react';

export const Switch = ({
  checked = false,
  onChange,
  label = "",
  id,
  disabled = false,
  labelPosition = "left"
}) => {




  const handleToggle = (e) => {
    if (!disabled && onChange) {
      onChange(e);
    }
  };

  return (
    <label
      htmlFor={id}
      className={`
        flex items-center cursor-pointer select-none
        ${labelPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}
        ${disabled ? 'cursor-not-allowed' : ''}
      `}
    >
      {label && (
        <span
          className={`text-sm text-gray-700 ${labelPosition === 'right' ? 'ml-3' : 'mr-3'}`}
        >
          {label}
        </span>
      )}
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={handleToggle}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            relative
            w-16 h-8
            rounded-full
            transition-colors duration-300 ease-in-out
            ${checked ? 'bg-[#1D4FB6]' : 'bg-gray-300'}
            ${disabled ? 'opacity-50' : ''}
          `}
        >
          <div
            className={`
              absolute top-0
              inline-block
              w-8 h-8
              transform
              bg-white
              rounded-full
              shadow-md
              transition-transform duration-300 ease-in-out
              ${checked ? 'translate-x-8' : 'translate-x-0'}
            `}
          />
        </div>
      </div>
    </label>
  );
};

export default Switch;
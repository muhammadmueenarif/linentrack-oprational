"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const Dropdown = ({
    data = [],
    selected,
    onSelect,
    placeholder = "Select an option",
    className = "",
    buttonClassName = "",
    menuClassName = "",
    optionClassName = "",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item) => {
        onSelect(item);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                className={`w-full p-2 border rounded-md bg-white text-left flex items-center justify-between ${disabled ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-400'} ${isOpen ? 'border-blue-500' : 'border-gray-300'} ${buttonClassName}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
                    {selected && selected?.length > 18 ? selected.slice(0, 18) + '...' : selected || placeholder}

                </span>
                <ChevronDown className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} size={16} />
            </button>

            {isOpen && (
                <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg ${menuClassName}`}>
                    <div className="max-h-60 overflow-auto py-1">
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className={`px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${selected === item ? 'bg-blue-50 text-blue-600' : 'text-gray-900'} ${optionClassName}`}
                                onClick={() => handleSelect(item)}
                            >
                                {item}
                            </div>
                        ))}
                        {data.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">
                                No options available
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


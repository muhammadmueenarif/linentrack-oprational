"use client";
import React from 'react';

export const TabGroupButton = ({ tabs, activeTab, onChange  , wd=""}) => {
  return (
    <div className="relative flex gap-2 p-1 rounded-lg bg-gray-100">
      <div
        className="absolute h-full transition-all duration-200 ease-in-out"
        style={{
          left: `${(100 / tabs.length) * tabs.findIndex(tab => tab.id === activeTab)}%`,
          width: `${100 / tabs.length}%`,
          background: '#2871E6',
          borderRadius: '0.5rem',
          transform: 'translateX(0)',
          zIndex: 0,
          marginTop:"-3px"
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          style={wd !== "" ? { width: wd } : {}}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 z-10
            ${activeTab === tab.id ? 'text-white' : 'text-gray-700 hover:text-gray-900'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
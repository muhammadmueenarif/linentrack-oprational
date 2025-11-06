import React from 'react';
import { PaymentMethod } from '../../../enum/PaymentMethod';

const ChangeCalculator = ({ formData, handleInputChange, calculations, canProceed, setCurrentStep, handleQuickAmount, quickAmounts }) => {
  return (
    <div 
      className="bg-white rounded-3xl shadow-2xl max-w-xl mx-auto my-8"
      style={{
        background: '#FFFFFF',
        boxShadow: '31.7315px 42.8006px 21.4003px rgba(0, 0, 0, 0.01), 17.7106px 23.6141px 17.7106px rgba(0, 0, 0, 0.03), 8.11735px 10.3312px 13.2829px rgba(0, 0, 0, 0.04), 2.21382px 2.95176px 7.37941px rgba(0, 0, 0, 0.05), 0px 0px 0px rgba(0, 0, 0, 0.05)',
        borderRadius: '26.0033px',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 2rem'
      }}
    >
      {/* Title */}
      <h2 
        className="text-center mb-6"
        style={{
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          fontWeight: 500,
          fontSize: '39.81px',
          lineHeight: '56px',
          color: '#14181F',
          margin: '0 0 1.5rem 0'
        }}
      >
        Change Calculator
      </h2>

      {/* Quick Amount Buttons */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <button
            onClick={() => handleQuickAmount(10)}
            className="h-20 rounded-xl border-0 cursor-pointer flex items-center justify-center transition-all hover:opacity-80 hover:scale-105"
            style={{
              background: '#EDF4FF',
              borderRadius: '10px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '30px',
                color: '#1D1B23'
              }}
            >
              $ 10.00
            </span>
          </button>

          <button
            onClick={() => handleQuickAmount(20)}
            className="h-20 rounded-xl border-0 cursor-pointer flex items-center justify-center transition-all hover:opacity-80 hover:scale-105"
            style={{
              background: '#EDF4FF',
              borderRadius: '10px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '30px',
                color: '#1D1B23'
              }}
            >
              $ 20.00
            </span>
          </button>

          <button
            onClick={() => handleQuickAmount(40)}
            className="h-20 rounded-xl border-0 cursor-pointer flex items-center justify-center transition-all hover:opacity-80 hover:scale-105"
            style={{
              background: '#EDF4FF',
              borderRadius: '10px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '30px',
                color: '#1D1B23'
              }}
            >
              $ 40.00
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleQuickAmount(30)}
            className="h-20 rounded-xl border-0 cursor-pointer flex items-center justify-center transition-all hover:opacity-80 hover:scale-105"
            style={{
              background: '#EDF4FF',
              borderRadius: '10px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '30px',
                color: '#1D1B23'
              }}
            >
              $ 30.00
            </span>
          </button>

          <button
            onClick={() => handleQuickAmount(50)}
            className="h-20 rounded-xl border-0 cursor-pointer flex items-center justify-center transition-all hover:opacity-80 hover:scale-105"
            style={{
              background: '#EDF4FF',
              borderRadius: '10px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '30px',
                color: '#1D1B23'
              }}
            >
              $ 50.00
            </span>
          </button>
        </div>
      </div>

      {/* Input Fields Section */}
      <div className="flex-1 py-2">
        {/* Total Due Section */}
        <div className="flex items-center justify-between mb-1">
          <label 
            className="font-semibold text-lg"
            style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '30px',
              color: '#000000'
            }}
          >
            Total Due
          </label>
          <div 
            className="w-36 h-12 rounded flex items-center justify-center px-4"
            style={{
              background: 'rgba(237, 244, 255, 0.67)',
              border: '1px solid #1D50B6',
              borderRadius: '5px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '30px',
                color: '#000000'
              }}
            >
              ${calculations.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Cash From Customer Section */}
        <div className="flex items-center justify-between mb-1">
          <label 
            className="font-semibold text-lg"
            style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '30px',
              color: '#000000'
            }}
          >
            Cash From Customer
          </label>
          <input
            type="number"
            value={formData.cashFromCustomer || ''}
            onChange={(e) => handleInputChange('cashFromCustomer', e.target.value)}
            min="0"
            className="w-36 h-12 rounded px-4 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            style={{
              background: 'rgba(237, 244, 255, 0.67)',
              border: '1px solid #1D50B6',
              borderRadius: '5px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '30px',
              color: '#000000'
            }}
            placeholder="0.00"
          />
        </div>

        {/* Change Display Section */}
        <div className="flex items-center justify-between mb-1">
          <label 
            className="font-semibold text-lg"
            style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '30px',
              color: '#000000'
            }}
          >
            Change:
          </label>
          <div 
            className="w-36 h-12 rounded flex items-center justify-center px-4"
            style={{
              background: 'rgba(237, 244, 255, 0.67)',
              border: '1px solid #1D50B6',
              borderRadius: '5px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '20px',
                lineHeight: '30px',
                color: (parseFloat(formData.cashFromCustomer) || 0) < calculations.total && formData.cashFromCustomer !== '' ? '#FF0000' : '#00AA00'
              }}
            >
              ${calculations.change.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => setCurrentStep(4)}
          disabled={!canProceed(3)}
          className="px-8 py-4 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:opacity-90 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          style={{
            background: '#2871E6',
            borderRadius: '8px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: '18px',
            lineHeight: '24px',
            color: '#FFFFFF',
            minWidth: '120px'
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default ChangeCalculator;

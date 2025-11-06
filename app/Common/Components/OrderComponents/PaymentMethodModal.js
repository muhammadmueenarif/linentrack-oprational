"use client";
import React, { useState } from 'react';

const PaymentMethodModal = ({ isOpen, onClose, onPaymentMethodSelect, selectedPaymentMethod }) => {
  const [selectedMethod, setSelectedMethod] = useState(selectedPaymentMethod || 'cash');

  const paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'Card', value: 'card' },
    { label: 'Pay on Collection', value: 'payOnCollection' },
    { label: 'Cheque', value: 'cheque' },
    { label: 'Invoice', value: 'invoice' }
  ];

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleSubmit = () => {
    onPaymentMethodSelect(selectedMethod);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4"
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="bg-white rounded-lg relative"
        style={{
          width: '450px',
          height: '500px',
          background: '#FFFFFF',
          boxShadow: '23.7514px 32.0368px 16.0184px rgba(0, 0, 0, 0.01), 13.2566px 17.6755px 13.2566px rgba(0, 0, 0, 0.03), 6.07595px 7.73302px 9.94246px rgba(0, 0, 0, 0.04), 1.65708px 2.20943px 5.52359px rgba(0, 0, 0, 0.05), 0px 0px 0px rgba(0, 0, 0, 0.05)',
          borderRadius: '19.4639px',
          padding: '0',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666',
            zIndex: 1
          }}
        >
          ×
        </button>

        {/* Title */}
        <h2 
          style={{
            position: 'absolute',
            width: '200px',
            height: '32px',
            left: 'calc(50% - 200px/2)',
            top: '25px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: '22px',
            lineHeight: '32px',
            color: '#14181F',
            margin: 0,
            textAlign: 'center'
          }}
        >
          Payment Method
        </h2>

        {/* Payment Methods List */}
        <div style={{ position: 'relative', top: '80px', left: '25px' }}>
          {paymentMethods.map((method, index) => (
            <div
              key={method.value}
              style={{
                position: 'absolute',
                width: '400px',
                height: '50px',
                top: `${index * 60}px`,
                left: '0px',
                background: 'rgba(237, 244, 255, 0.67)',
                border: '0.748513px solid #1D50B6',
                borderRadius: '7.48513px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                cursor: 'pointer'
              }}
              onClick={() => handleMethodSelect(method.value)}
            >
              {/* Method Name */}
              <span
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14.9703px',
                  lineHeight: '22px',
                  color: '#000000'
                }}
              >
                {method.label}
              </span>

              {/* Radio Button */}
              <div
                style={{
                  width: '17.96px',
                  height: '17.96px',
                  border: selectedMethod === method.value ? '1.04792px solid #2871E6' : '1.04792px solid #AEB3BC',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selectedMethod === method.value ? '#2871E6' : 'transparent'
                }}
              >
                {selectedMethod === method.value && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      background: '#FFFFFF',
                      borderRadius: '50%'
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>


        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          style={{
            position: 'absolute',
            width: '100px',
            height: '45px',
            left: '325px',
            top: '420px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '11.9762px 20.9584px',
            gap: '7.49px',
            background: '#2871E6',
            borderRadius: '2.99405px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span
            style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14.3715px',
              lineHeight: '18px',
              color: '#FFFFFF'
            }}
          >
            Submit
          </span>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodModal;

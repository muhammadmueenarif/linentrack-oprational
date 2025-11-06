"use client";
import { motion } from 'framer-motion';
import { Button } from '../../../ui/components/Button';
import { Dropdown } from '../../../ui/components/Dropdown';
import { useOrder } from '../../../Pos/State/OrderProvider';
import { useState, useEffect } from 'react';

export const PaymentOptionsContent = ({ 
  formData, 
  setFormData, 
  totalAmount, 
  onContinue,
  paymentSettings,
  taxSettings,
  customerIsTaxExempt,
  isExpress,
  expressDeliveryCharge
}) => {
  const { orderState, updateFormData, resetOrder, calculateTotals } = useOrder();
  const { selectedItems } = orderState;

  const [calculatedValues, setCalculatedValues] = useState({
    subtotal: 0,
    discount: 0,
    deliveryFee: formData.deliveryFee || 0,
    credit: formData.credit || 0,
    expressCharge: isExpress ? (parseFloat(expressDeliveryCharge) || 0) : 0,
    taxes: {},
    total: 0
  });

  // Calculate prices when items or discounts change
  useEffect(() => {
    updateCalculations();
  }, [
    selectedItems, 
    formData.discountPercentage, 
    formData.deliveryFee, 
    formData.credit,
    isExpress,
    expressDeliveryCharge
  ]);

  // Calculate all pricing elements
  const updateCalculations = () => {
    // Calculate base subtotal
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply discount
    const discountAmount = formData.discountPercentage 
      ? (subtotal * (parseFloat(formData.discountPercentage) / 100))
      : 0;
      
    // Apply cash discount if applicable
    const cashDiscount = (formData.paymentMethod === 'cash' && paymentSettings?.cashDiscount)
      ? ((subtotal - discountAmount) * (paymentSettings.cashDiscount / 100))
      : 0;
    
    // Calculate tax amounts if customer isn't tax exempt
    const taxes = {};
    let totalTaxAmount = 0;
    
    if (!customerIsTaxExempt && taxSettings) {
      const taxableAmount = subtotal - discountAmount;
      
      if (taxSettings.tax1) {
        taxes.tax1 = {
          name: taxSettings.tax1.name,
          rate: taxSettings.tax1.rate,
          amount: taxableAmount * (taxSettings.tax1.rate / 100)
        };
        totalTaxAmount += taxes.tax1.amount;
      }
      
      if (taxSettings.tax2) {
        taxes.tax2 = {
          name: taxSettings.tax2.name,
          rate: taxSettings.tax2.rate,
          amount: taxableAmount * (taxSettings.tax2.rate / 100)
        };
        totalTaxAmount += taxes.tax2.amount;
      }
      
      if (taxSettings.tax3) {
        taxes.tax3 = {
          name: taxSettings.tax3.name,
          rate: taxSettings.tax3.rate,
          amount: taxableAmount * (taxSettings.tax3.rate / 100)
        };
        totalTaxAmount += taxes.tax3.amount;
      }
    }
    
    // Express delivery charge
    const expressCharge = isExpress ? (parseFloat(expressDeliveryCharge) || 0) : 0;
    
    // Calculate final total
    const total = subtotal - discountAmount - cashDiscount + 
                  (formData.deliveryFee || 0) - (formData.credit || 0) + 
                  totalTaxAmount + expressCharge;

    // Update calculated values
    setCalculatedValues({
      subtotal,
      discount: discountAmount,
      cashDiscount,
      deliveryFee: formData.deliveryFee || 0,
      credit: formData.credit || 0,
      taxes,
      expressCharge,
      total
    });

    // Update formData with new calculations
    updateFormData('subtotal', subtotal);
    updateFormData('total', total);
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (field === 'resetOrder') {
      const confirmReset = window.confirm('Are you sure you want to reset the order? This will clear all items and calculations.');
      if (confirmReset) {
        resetOrder();
      }
      return;
    }
    
    updateFormData(field, value);
    
    if (field === 'discountPercentage') {
      const numValue = parseFloat(value) || 0;
      updateFormData('discountPercentage', numValue > 100 ? 100 : numValue);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white rounded-t-3xl border border-gray-200 w-full"
      style={{ 
        position:"absolute", 
        width: '100%', 
        opacity: 1, 
        transform: 'none', 
        bottom: '70px', 
        left: '0', 
        right: '0',
        zIndex: 20,
        background: '#FFFFFF',
        border: '1px solid rgba(132, 138, 148, 0.21)',
        borderRadius: '25px 25px 0px 0px',
        minHeight: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Section - Payment Method & Dropdowns */}
      <div className="p-6 space-y-4">
        {/* Payment Method Input */}
        <div className="relative">
          <div 
            className="flex items-center justify-between px-4 py-3 border rounded-md"
            style={{
              border: '0.58px solid #D7D7D7',
              borderRadius: '6px',
              height: '44px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#1D1B23'
              }}
            >
              {formData.paymentMethod ? formData.paymentMethod.charAt(0).toUpperCase() + formData.paymentMethod.slice(1) : 'Cash'}
            </span>
            <button 
              className="flex items-center justify-center rounded"
              style={{
                width: '25px',
                height: '25px',
                background: '#2871E6',
                borderRadius: '2.5px'
              }}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <div 
                  className="w-3 h-0.5 bg-white"
                  style={{ border: '1.25px solid #FFFFFF' }}
                />
                <div 
                  className="w-0.5 h-3 bg-white absolute"
                  style={{ border: '1.25px solid #FFFFFF' }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="flex gap-4">
          {/* Notify Dropdown */}
          <div className="flex-1">
            <Dropdown
              data={['Notify', 'No Notify']}
              selected={formData.notifyOption || 'Notify'}
              onSelect={(value) => handleInputChange('notifyOption', value)}
              className="w-full"
              style={{
                border: '0.58px solid #D7D7D7',
                borderRadius: '6px',
                height: '44px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '9.32px',
                lineHeight: '14px',
                color: '#1D1B23'
              }}
            />
          </div>

          {/* No delivery document Dropdown */}
          <div className="flex-1">
            <Dropdown
              data={['No delivery document']}
              selected={formData.deliveryDocument || 'No delivery document'}
              onSelect={(value) => handleInputChange('deliveryDocument', value)}
              className="w-full"
              style={{
                border: '0.58px solid #D7D7D7',
                borderRadius: '6px',
                height: '44px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '9.32px',
                lineHeight: '14px',
                color: '#1D1B23'
              }}
            />
          </div>
        </div>
      </div>

      {/* Order Summary Section */}
      <div className="px-6">
        <div className="space-y-4">
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#1D1B23'
              }}
            >
              Subtotal
            </span>
            <div className="flex items-center gap-2">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94'
                }}
              >
                USD
              </span>
              <input
                type="text"
                value={(parseFloat(calculatedValues.subtotal) || 0).toFixed(2)}
                readOnly
                className="text-right px-2 py-1 border rounded"
                style={{
                  width: '70px',
                  height: '25px',
                  border: '0.58px solid #D7D7D7',
                  borderRadius: '6px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94',
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between">
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#1D1B23'
              }}
            >
              Discount
            </span>
            <div className="flex items-center gap-2">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94'
                }}
              >
                %
              </span>
              <input
                type="number"
                min="0"
                max="100"
                className="text-center px-2 py-1 border rounded"
                value={formData.discountPercentage || "0"}
                onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                style={{
                  width: '70px',
                  height: '25px',
                  border: '0.58px solid #D7D7D7',
                  borderRadius: '6px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94',
                  background: 'transparent'
                }}
              />
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94'
                }}
              >
                USD
              </span>
              <input
                type="text"
                value={(parseFloat(calculatedValues.discount) || 0).toFixed(2)}
                readOnly
                className="text-right px-2 py-1 border rounded"
                style={{
                  width: '70px',
                  height: '25px',
                  border: '0.58px solid #D7D7D7',
                  borderRadius: '6px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94',
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Cash discount if applicable */}
          {formData.paymentMethod === 'cash' && paymentSettings?.cashDiscount > 0 && (
            <div className="flex items-center justify-between">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#1D1B23'
                }}
              >
                Cash Discount ({paymentSettings.cashDiscount}%)
              </span>
              <div className="flex items-center gap-2">
                <span 
                  style={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '21px',
                    color: '#848A94'
                  }}
                >
                  USD
                </span>
                <input
                  type="text"
                  value={(parseFloat(calculatedValues?.cashDiscount) || 0).toFixed(2)}
                  readOnly
                  className="text-right px-2 py-1 border rounded"
                  style={{
                    width: '70px',
                    height: '25px',
                    border: '0.58px solid #D7D7D7',
                    borderRadius: '6px',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '21px',
                    color: '#848A94',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>
          )}

          {/* Express delivery charge if applicable */}
          {isExpress && expressDeliveryCharge > 0 && (
            <div className="flex items-center justify-between">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#1D1B23'
                }}
              >
                Express Delivery
              </span>
              <div className="flex items-center gap-2">
                <span 
                  style={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '21px',
                    color: '#848A94'
                  }}
                >
                  USD
                </span>
                <input
                  type="text"
                  value={(parseFloat(calculatedValues.expressCharge) || 0).toFixed(2)}
                  readOnly
                  className="text-right px-2 py-1 border rounded"
                  style={{
                    width: '70px',
                    height: '25px',
                    border: '0.58px solid #D7D7D7',
                    borderRadius: '6px',
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '21px',
                    color: '#848A94',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>
          )}

          {/* Delivery Fee */}
          <div className="flex items-center justify-between">
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#1D1B23'
              }}
            >
              Delivery Fee
            </span>
            <div className="flex items-center gap-2">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94'
                }}
              >
                USD
              </span>
              <input
                type="number"
                min="0"
                className="text-right px-2 py-1 border rounded"
                value={formData.deliveryFee || "0"}
                onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                style={{
                  width: '70px',
                  height: '25px',
                  border: '0.58px solid #D7D7D7',
                  borderRadius: '6px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94',
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Tax rows */}
          {!customerIsTaxExempt && Object.keys(calculatedValues.taxes).length > 0 && (
            <>
              {Object.keys(calculatedValues.taxes).map(key => (
                <div key={key} className="flex items-center justify-between">
                  <span 
                    style={{
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '21px',
                      color: '#1D1B23'
                    }}
                  >
                    {calculatedValues.taxes[key].name} ({calculatedValues.taxes[key].rate}%)
                  </span>
                  <div className="flex items-center gap-2">
                    <span 
                      style={{
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '21px',
                        color: '#848A94'
                      }}
                    >
                      USD
                    </span>
                    <input
                      type="text"
                      value={(parseFloat(calculatedValues.taxes[key].amount) || 0).toFixed(2)}
                      readOnly
                      className="text-right px-2 py-1 border rounded"
                      style={{
                        width: '70px',
                        height: '25px',
                        border: '0.58px solid #D7D7D7',
                        borderRadius: '6px',
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '21px',
                        color: '#848A94',
                        background: 'transparent'
                      }}
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Credit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#1D1B23'
                }}
              >
                Credit
              </span>
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94'
                }}
              >
                (USD {(parseFloat(calculatedValues?.credit) || 0).toFixed(2)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94'
                }}
              >
                USD
              </span>
              <input
                type="number"
                min="0"
                max={calculatedValues.subtotal}
                className="text-right px-2 py-1 border rounded"
                value={formData.credit || "0"}
                onChange={(e) => handleInputChange('credit', parseFloat(e.target.value) || 0)}
                style={{
                  width: '70px',
                  height: '25px',
                  border: '0.58px solid #D7D7D7',
                  borderRadius: '6px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94',
                  background: 'transparent'
                }}
              />
            </div>
          </div>

          {/* Divider Line */}
          <div 
            className="w-full"
            style={{
              height: '1px',
              background: '#E5E5E5'
            }}
          />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                color: '#1D1B23'
              }}
            >
              Total
            </span>
            <div className="flex items-center gap-2">
              <span 
                style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#848A94'
                }}
              >
                USD
              </span>
              <input
                type="text"
                value={(parseFloat(calculatedValues.total) || 0).toFixed(2)}
                readOnly
                className="text-right px-2 py-1 border rounded font-semibold"
                style={{
                  width: '70px',
                  height: '25px',
                  border: '0.58px solid #D7D7D7',
                  borderRadius: '6px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#1D1B23',
                  background: 'transparent'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-6 pt-4">
        {/* Reset Order Button */}
        <div className="flex justify-end">
          <button 
            className="px-4 py-2 rounded"
            onClick={() => handleInputChange('resetOrder', true)}
            style={{
              width: '80px',
              height: '26.67px',
              background: '#F0F0FF',
              border: '1px solid #413FBB',
              borderRadius: '5.28px'
            }}
          >
            <span 
              style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '10px',
                lineHeight: '15px',
                color: '#1D4FB6',
                textAlign: 'center',
                display: 'block',
                width: '100%'
              }}
            >
              Reset Order
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

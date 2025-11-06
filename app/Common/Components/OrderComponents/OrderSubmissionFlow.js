"use client";
import { Dialog } from '../../../ui/components/Dialog';
import { Button } from '../../../ui/components/Button';
import { Input } from '../../../ui/components/input';
import { useState, useEffect } from 'react';
import { useOrder } from '../../../Pos/State/OrderProvider';
import { PaymentMethod } from '../../../enum/PaymentMethod';
import { formatPaymentMethodName } from '../../../helper/formatPaymentMethodName';
import PaymentMethodModal from './PaymentMethodModal';
import ChangeCalculator from './ChangeCalculator';

// Step 1: Bag Quantity Component
const BagQuantityStep = ({ formData, handleInputChange, canProceed, setCurrentStep }) => {
  // Generate a real order ID
  const generateOrderId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `#${timestamp}${random}`;
  };

  const orderId = generateOrderId();

  return (
    <div 
      className="bg-white rounded-lg"
      style={{
        minWidth: '400px',
        width: 'auto',
        minHeight: '250px',
        height: 'auto',
        background: '#FBFBFB',
        boxShadow: '0px 6.25px 20px rgba(3, 21, 61, 0.15)',
        borderRadius: '25px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Title */}
      <h2 
        style={{
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          fontWeight: 700,
          fontSize: '25px',
          lineHeight: '38px',
          color: '#1D1B23',
          margin: 0,
          textAlign: 'left'
        }}
      >
        Enter Bag Quantity
      </h2>

      {/* Order# Section */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span 
          style={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '30px',
            color: '#000000',
            minWidth: '80px'
          }}
        >
          Order#
        </span>
        <span 
          style={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '20px',
            lineHeight: '30px',
            color: '#000000',
            opacity: 0.6
          }}
        >
          {orderId}
        </span>
      </div>

      {/* Bag # Input Section */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <label 
          htmlFor="bagQuantity" 
          style={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '30px',
            color: '#000000',
            opacity: 0.6,
            minWidth: '80px'
          }}
        >
          Bag #
        </label>
        <div 
          style={{
            width: '127px',
            height: '40px',
            background: 'rgba(237, 244, 255, 0.67)',
            border: '1px solid #1D50B6',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px'
          }}
        >
          <input
            id="bagQuantity"
            type="number"
            value={formData.bagQuantity || ''}
            onChange={(e) => handleInputChange('bagQuantity', e.target.value)}
            min="1"
            placeholder="#"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '20px',
              lineHeight: '30px',
              color: '#000000',
              opacity: 0.6
            }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '10px'
        }}
      >
        <button
          onClick={() => setCurrentStep(2)}
          disabled={!canProceed(1)}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px 16px',
            gap: '10px',
            width: '79px',
            height: '32px',
            background: '#2871E6',
            borderRadius: '4px',
            border: 'none',
            cursor: canProceed(1) ? 'pointer' : 'not-allowed',
            opacity: canProceed(1) ? 1 : 0.6
          }}
        >
          <span 
            style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '13.3333px',
              lineHeight: '16px',
              letterSpacing: '-0.01em',
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

// Step 2: Payment Method Selection Component
const PaymentMethodStep = ({ formData, handleInputChange, calculations, canProceed, setCurrentStep }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(true); // Auto-open modal

  return (
    <>
      {/* Payment Method Modal - Auto-opens */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentMethodSelect={(method) => {
          handleInputChange('paymentMethod', method);
          setShowPaymentModal(false);
          // Auto-proceed to next step after selection
          if (method === PaymentMethod.CASH) {
            setCurrentStep(3);
          } else {
            setCurrentStep(4);
          }
        }}
        selectedPaymentMethod={formData.paymentMethod}
      />
    </>
  );
};

// Step 3: Change Calculator Component
const ChangeCalculatorStep = ({ formData, handleInputChange, calculations, canProceed, setCurrentStep, handleQuickAmount, quickAmounts }) => {
  return (
    <ChangeCalculator
      formData={formData}
      handleInputChange={handleInputChange}
      calculations={calculations}
      canProceed={canProceed}
      setCurrentStep={setCurrentStep}
      handleQuickAmount={handleQuickAmount}
      quickAmounts={quickAmounts}
    />
  );
};

// Step 3: Order Confirmation Component
const ConfirmationStep = ({ formData, calculations, handleComplete }) => {
  return (
    <div className="bg-white p-6 rounded-lg w-96">
      <h2 className="text-xl font-semibold mb-4">Confirm Order Details</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Bag Quantity:</span>
          <span>{formData.bagQuantity}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>$ {calculations.subtotal.toFixed(2)}</span>
        </div>
        
        {calculations.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount Applied:</span>
            <span>$ {calculations.discountAmount.toFixed(2)}</span>
          </div>
        )}
        
        {calculations.cashDiscount > 0 && (
          <div className="flex justify-between">
            <span>Cash Discount:</span>
            <span>$ {calculations.cashDiscount.toFixed(2)}</span>
          </div>
        )}
        
        {calculations.expressCharge > 0 && (
          <div className="flex justify-between">
            <span>Express Charge:</span>
            <span>$ {calculations.expressCharge.toFixed(2)}</span>
          </div>
        )}
        
        {calculations.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>$ {calculations.taxAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
          <span>Total Amount:</span>
          <span>$ {calculations.total.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Payment Method:</span>
          <span className="capitalize">{formData.paymentMethod ? formData.paymentMethod.replace(/([A-Z])/g, ' $1').trim().replace('pay On Collection', 'Pay on Collection') : 'N/A'}</span>
        </div>
        
        {formData.paymentMethod === PaymentMethod.CASH && (
  <>
    <div className="flex justify-between">
      <span>Cash Received:</span>
      <span>$ {(parseFloat(formData.cashFromCustomer) || 0).toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span>Change Given:</span>
      <span>$ {calculations.change.toFixed(2)}</span>
    </div>
  </>
)}
      </div>
      <Button
        className="w-full mt-6 bg-green-600 hover:bg-green-700"
        onClick={handleComplete}
      >
        Finish Payment Setup
      </Button>
    </div>
  );
};

/**
 * OrderSubmissionFlow handles the step-by-step process of submitting an order
 * including bag quantity, payment method, discount, and change calculation
 */
export const OrderSubmissionFlow = ({ 
  onComplete, 
  onClose, 
  selectedItems, 
  totalAmount, 
  formData, 
  setFormData,
  paymentSettings,
  taxSettings,
  customerIsTaxExempt,
  isExpress,
  expressDeliveryCharge
}) => {
  const { orderState, updateFormData, updateOrderField } = useOrder();
  
  // Current step in the submission flow
  const [currentStep, setCurrentStep] = useState(1);

  // Reset step to 1 when component mounts
  useEffect(() => {
    setCurrentStep(1);
  }, []);
  
  // Calculations for the order
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    discountAmount: 0,
    expressCharge: 0,
    taxAmount: 0,
    total: 0,
    change: 0
  });

  // Quick amount buttons for cash payments
  const quickAmounts = [10, 20, 50, 100, 500, 1000];

  // Handle completion of the flow
  const handleComplete = () => {
    // Reset the current step to 1 for next order
    setCurrentStep(1);
    if (onComplete) {
      onComplete();
    }
  };

  // Handle closing of the flow
  const handleClose = () => {
    // Reset the current step to 1 for next order
    setCurrentStep(1);
    if (onClose) {
      onClose();
    } else {
      updateOrderField('showOrderFlow', false);
    }
  };

  // Calculate totals when relevant values change
  useEffect(() => {
    const newSubtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let newDiscountAmount = 0;

    // Calculate discount amount (either percentage or fixed)
    if (formData.discountValue && !isNaN(parseFloat(formData.discountValue))) {
      newDiscountAmount = newSubtotal * (parseFloat(formData.discountValue) / 100);
    } else if (formData.discountFixed && !isNaN(parseFloat(formData.discountFixed))) {
      newDiscountAmount = parseFloat(formData.discountFixed);
    }
    
    // Cap discount at subtotal
    if (newDiscountAmount > newSubtotal) {
      newDiscountAmount = newSubtotal;
    }

    // Express delivery charge
    const expressCharge = isExpress ? (parseFloat(expressDeliveryCharge) || 0) : 0;
    
    // Calculate tax if customer is not tax exempt
    let taxAmount = 0;
    if (!customerIsTaxExempt && taxSettings) {
      const taxableAmount = newSubtotal - newDiscountAmount;
      
      if (taxSettings.tax1) {
        taxAmount += taxableAmount * (taxSettings.tax1.rate / 100);
      }
      
      if (taxSettings.tax2) {
        taxAmount += taxableAmount * (taxSettings.tax2.rate / 100);
      }
      
      if (taxSettings.tax3) {
        taxAmount += taxableAmount * (taxSettings.tax3.rate / 100);
      }
    }
    
    // Calculate cash discount if applicable
// Calculate cash discount if applicable
let cashDiscount = 0;
if (formData.paymentMethod === PaymentMethod.CASH && paymentSettings?.cashDiscount) {
  cashDiscount = (newSubtotal - newDiscountAmount) * (paymentSettings.cashDiscount / 100);
}

    // Calculate total and change
    const newTotal = newSubtotal - newDiscountAmount - cashDiscount + expressCharge + taxAmount;
    const cashFromCust = parseFloat(formData.cashFromCustomer) || 0;
    const newChange = cashFromCust > newTotal ? cashFromCust - newTotal : 0;

    // Update calculations
    setCalculations({
      subtotal: newSubtotal,
      discountAmount: newDiscountAmount,
      cashDiscount,
      expressCharge,
      taxAmount,
      total: newTotal,
      change: newChange
    });

    // Update form data with calculated total
    updateFormData('totalDue', newTotal);

  }, [
    formData.discountValue, 
    formData.discountFixed, 
    selectedItems, 
    formData.cashFromCustomer, 
    formData.paymentMethod,
    isExpress,
    expressDeliveryCharge,
    customerIsTaxExempt,
    taxSettings,
    paymentSettings?.cashDiscount,
    updateFormData
  ]);

  /**
   * Handle input changes for form fields
   * @param {string} field - The field to update
   * @param {any} value - The new value
   */
  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Validate numeric fields
    if (field === 'bagQuantity' || field === 'discountValue' || field === 'discountFixed' || field === 'cashFromCustomer') {
      if (value === '' || (parseFloat(value) >= 0)) {
        processedValue = value;
      } else {
        processedValue = formData[field] || ''; 
      }
    }
    
    // Clear other discount field when one is set
    if (field === 'discountValue'){
      updateFormData('discountFixed', '');
    }
    if (field === 'discountFixed'){
      updateFormData('discountValue', '');
    }

    updateFormData(field, processedValue);
  };

  /**
   * Handle quick amount button click
   * @param {number} amount - The amount to add
   */
  const handleQuickAmount = (amount) => {
    const currentCash = parseFloat(formData.cashFromCustomer) || 0;
    handleInputChange('cashFromCustomer', (currentCash + amount).toString());
  };

  /**
   * Check if current step can proceed
   * @param {number} step - The current step
   * @returns {boolean} Whether the step can proceed
   */
const canProceed = (step) => {
  switch (step) {
    case 1:
      return formData.bagQuantity && parseInt(formData.bagQuantity, 10) > 0;
    case 2:
      return formData.paymentMethod;
    case 3:
      // For cash payments, ensure enough cash is received
      return formData.paymentMethod === PaymentMethod.CASH
        ? (parseFloat(formData.cashFromCustomer) || 0) >= calculations.total
        : true;
    case 4:
      return true; // Confirmation step
    default:
      return true;
  }
};

  // Render the appropriate component based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BagQuantityStep 
            formData={formData} 
            handleInputChange={handleInputChange} 
            canProceed={canProceed} 
            setCurrentStep={setCurrentStep}
          />
        );
      case 2:
        return (
          <PaymentMethodStep 
            formData={formData} 
            handleInputChange={handleInputChange} 
            calculations={calculations} 
            canProceed={canProceed} 
            setCurrentStep={setCurrentStep} 
          />
        );
      case 3:
        return (
          <ChangeCalculatorStep 
            formData={formData} 
            handleInputChange={handleInputChange} 
            calculations={calculations} 
            canProceed={canProceed} 
            setCurrentStep={setCurrentStep} 
            handleQuickAmount={handleQuickAmount}
            quickAmounts={quickAmounts}
          />
        );
      case 4:
        return (
          <ConfirmationStep 
            formData={formData} 
            calculations={calculations} 
            handleComplete={handleComplete} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      {renderStepContent()}
    </Dialog>
  );
};
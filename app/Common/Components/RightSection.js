"use client";
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Truck, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dropdown } from '../ui/components/Dropdown';
import { FloatingInput } from '../ui/components/FloatingInput';
import { Switch } from '../ui/components/Switch';
import AddCustomerPopup from '../Pos/components/AddCustomerPopup';
import { OrderItemsList } from './OrderComponents/OrderItemsList';
import { PaymentOptionsContent } from './OrderComponents/PaymentOptionsContent';
import { OrderSubmissionFlow } from './OrderComponents/OrderSubmissionFlow';
import { OrderDetailsView } from './OrderComponents/OrderDetailsView';
import { doc, getDoc } from 'firebase/firestore';
import { useOrder } from '../Pos/State/OrderProvider';

const CustomerSearch = lazy(() => import('../Pos/components/CustomerSearch'));

import { ErrorMessage, SuccessMessage, WarningMessage } from './AlertNotification';
import CustomDatePicker from './OrderComponents/CustomDatePicker';
import OrderConfirmation from './OrderComponents/OrderConfirmation';
import useAdminId from '../Admin/hooks/useAdminId';
import { db } from '../config';

/**
 * The RightSection component manages the order panel on the right side of the POS interface.
 * It includes customer selection, price list selection, order items display, payment processing, and more.
 */
const RightSection = () => {
  // Core state
  const adminId = useAdminId();
  const [selectedStore, setSelectedStore] = useState('');
  const [storeId, setStoreId] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  
  // Alert and warning state
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [warning, setWarning] = useState({ show: false, message: '' });
  
  // Feature visibility configuration
  const [featureConfig, setFeatureConfig] = useState({
    customerSearch: true,
    priceList: true,
    express: true,
    orderItems: true,
    notes: true,
    deliveryOptions: true,
    dateTime: true,
    payment: true,
    submitOrder: true
  });

  // Panel visibility state
  const [showPaymentandBag, setShowPaymentandBag] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeApplied, setPromoCodeApplied] = useState(null);
  const [promoCodeError, setPromoCodeError] = useState('');
  const [showPromoCodeBox, setShowPromoCodeBox] = useState(false);

  // Order context state and methods
  const {
    orderState,
    updateOrderField,
    updateFormData,
    resetOrder,
    calculateTotals,
    addItem,
    updateItemQuantity,
    removeItem,
    submitOrder
  } = useOrder();

  // Extract order state properties for easier access
  const {
    selectedCustomer,
    isExpress,
    isRepeat,
    showAddCustomerPopup,
    showCalendarPopup,
    numberOfPickups,
    frequency,
    deliveryOption,
    pickupDate,
    deliveryDate,
    selectedPriceList,
    orderComplete,
    showOrderFlow,
    showPaymentOptionsContent,
    showOrderConfirmation,
    selectedItems,
    formData,
    notes,
    priceLists
  } = orderState;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, staggerChildren: 0.1 }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  // Options for dropdowns
  const numberOfPickupsOptions = ['1 Time', '2 Times', '3 Times', '4 Times'];
  const frequencyOptions = ['Every Week', 'Every 2 Weeks', 'Every 3 Weeks', 'Every 4 Weeks'];
  // Delivery options depend on package feature for Pickup & Delivery
  const [deliveryOptions, setDeliveryOptions] = useState(['Instore & Self-Collect']);

  /**
   * Initialize core data when component mounts
   */
  useEffect(() => {
    // Get selected store ID from localStorage
    if (typeof window !== 'undefined') {
      setStoreId(localStorage.getItem('selectedStoreId'));
    }
    
    // Get selected store name from localStorage
    const storeFromStorage = localStorage.getItem('selectedStore');
    if (storeFromStorage) {
      setSelectedStore(storeFromStorage);
    }
  }, []);

  /**
   * Fetch store settings from Firestore
   */
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const currentStoreId = localStorage.getItem('selectedStoreId');
        if (!currentStoreId) return;
        
        const storeRef = doc(db, 'storeSettings', currentStoreId);
        const storeDoc = await getDoc(storeRef);
        
        if (storeDoc.exists()) {
          const data = storeDoc.data();
          setStoreSettings(data);
          // Gate Pickup & Delivery related options based on package features
          try {
            const subRaw = localStorage.getItem('subscriptionData');
            const sub = subRaw ? JSON.parse(subRaw) : null;
            const pdEnabled = !(sub?.features && sub.features.pickupDelivery === false);
            if (!pdEnabled) {
              // Restrict to Instore & Self-Collect when Pickup & Delivery not purchased
              setDeliveryOptions(['Instore & Self-Collect']);
              // Ensure state reflects allowed option only
              updateOrderField('deliveryOption', 'Instore & Self-Collect');
            } else {
              setDeliveryOptions(['Instore & Self-Collect', 'Pickup & Delivery', 'Instore & Delivery', 'Pickup & Self-Collect']);
            }
          } catch {}
          
          // Configure express delivery
          if (data.pickupDeliveries?.generatingSetting?.additionalChargesForExpressDelivery) {
            updateFormData('expressDeliveryCharge', 
              parseFloat(data.pickupDeliveries.generatingSetting.additionalChargesForExpressDelivery) || 0);
          }
          
          // Configure tax settings
          const taxSettings = {};
          if (data.tax?.tax1?.rate) taxSettings.tax1 = { name: data.tax.tax1.name, rate: parseFloat(data.tax.tax1.rate) || 0 };
          if (data.tax?.tax2?.rate) taxSettings.tax2 = { name: data.tax.tax2.name, rate: parseFloat(data.tax.tax2.rate) || 0 };
          if (data.tax?.tax3?.rate) taxSettings.tax3 = { name: data.tax.tax3.name, rate: parseFloat(data.tax.tax3.rate) || 0 };
          updateOrderField('taxSettings', taxSettings);
          
          // Configure payment settings
          const paymentSettings = {
            allowPartialPayment: data.payment?.allowPartialPayment || false,
            cashDiscount: parseFloat(data.payment?.cashDiscount) || 0,
            defaultPaymentMethod: data.payment?.defaultPaymentMethod || 'cash'
          };
          updateOrderField('paymentSettings', paymentSettings);
        }
      } catch (error) {
        console.error("Error fetching store settings:", error);
      }
    };
    
    fetchStoreSettings();
  }, [adminId, storeId, updateOrderField, updateFormData]);

  /**
   * Fetch price lists from Firestore and set default based on workflow settings
   */
  useEffect(() => {
    const fetchPriceLists = async () => {
      try {
        const currentStoreId = localStorage.getItem('selectedStoreId');
        if (!currentStoreId) return;
        
        const storeRef = doc(db, 'storeSettings', currentStoreId);
        const storeDoc = await getDoc(storeRef);
        
        if (storeDoc.exists()) {
          const data = storeDoc.data();
          
          // Process price lists
          const lists = (data.priceLists || []).map(list => ({ 
            ...list, 
            multiplier: list.multiplier || 1 
          }));
          updateOrderField('priceLists', lists);
          
          // Set default price list based on workflow settings
          const defaultPriceListName = data.workflow?.defaultPriceList;
          let defaultPriceList = null;
          
          if (defaultPriceListName && lists.length > 0) {
            // Find the price list specified in workflow
            defaultPriceList = lists.find(list => list.name === defaultPriceListName);
          }
          
          // If not found or not specified, use the first in the list
          if (!defaultPriceList && lists.length > 0) {
            defaultPriceList = lists[0];
          }
          
          // Set the selected price list
          if (defaultPriceList) {
            updateOrderField('selectedPriceList', defaultPriceList);
          }
        }
      } catch (error) {
        console.error("Error fetching price lists:", error);
      }
    };
    
    fetchPriceLists();
  }, [adminId, storeId, updateOrderField]);

  /**
   * Listen for promo code toggle events from MainBody
   */
  useEffect(() => {
    const handleTogglePromoCode = () => {
      setShowPromoCodeBox(!showPromoCodeBox);
    };

    window.addEventListener('togglePromoCodeBox', handleTogglePromoCode);

    return () => {
      window.removeEventListener('togglePromoCodeBox', handleTogglePromoCode);
    };
  }, [showPromoCodeBox]);

  /**
   * Handles customer selection
   * @param {Object} customer - The selected customer
   */
  const handleCustomerSelect = (customer) => {
    updateOrderField('selectedCustomer', customer);
  };

  /**
   * Handles new customer addition
   * @param {Object} newCustomer - The newly added customer
   */
  const handleCustomerAdded = (newCustomer) => {
    // Trigger the global handler if it exists
    if (window.handleNewCustomer) {
      window.handleNewCustomer(newCustomer);
    }
  };

  /**
   * Shows an alert message
   * @param {string} type - The alert type (success, error, warning)
   * @param {string} message - The alert message
   * @param {number} duration - The duration to show the alert
   */
  const showAlert = (type, message, duration = 3000) => {
    setAlert({
      show: true,
      type,
      message
    });
    setTimeout(() => {
      setAlert({
        show: false,
        type: '',
        message: ''
      });
    }, duration);
  };

  /**
   * Shows a warning message
   * @param {string} message - The warning message
   * @param {number} duration - The duration to show the warning
   */
  const showWarning = (message, duration = 3000) => {
    setWarning({
      show: true,
      message
    });
    setTimeout(() => {
      setWarning({
        show: false,
        message: ''
      });
    }, duration);
  };

  /**
   * Custom date picker modal component
   */
  const CalendarPopup = ({ date, onDateChange, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
      >
        <CustomDatePicker
          selectedDate={date}
          onDateChange={onDateChange}
          onClose={onClose}
        />
      </motion.div>
    </motion.div>
  );

  /**
   * Handles date changes for pickup and delivery
   * @param {string} type - The date type (pickup or delivery)
   * @param {Date} date - The selected date
   */
  const handleDateChange = (type, date) => {
    updateOrderField(type === 'pickup' ? 'pickupDate' : 'deliveryDate', date);
    updateOrderField('showCalendarPopup', false);
  };

  /**
   * Calculates the total order amount, including price list multipliers and taxes
   * @returns {number} The total order amount
   */
  const calculateTotal = () => {
    // Base calculation
    const subtotal = selectedItems.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    
    // Apply price list multiplier
    const multiplier = selectedPriceList?.multiplier || 1;
    let total = subtotal * multiplier;
    
    // Apply express delivery charge if enabled
    if (isExpress && formData.expressDeliveryCharge) {
      total += parseFloat(formData.expressDeliveryCharge);
    }
    
    // Apply discount if any
    if (formData.discountPercentage) {
      const discountAmount = total * (parseFloat(formData.discountPercentage) / 100);
      total -= discountAmount;
    }

    // Apply promo code discount if any
    if (formData.promoDiscount) {
      total -= parseFloat(formData.promoDiscount);
    }
    
    // Apply cash discount if payment method is cash
    if (formData.paymentMethod === 'cash' && orderState.paymentSettings?.cashDiscount) {
      const cashDiscountAmount = total * (orderState.paymentSettings.cashDiscount / 100);
      total -= cashDiscountAmount;
    }
    
    // Apply taxes if customer is not tax exempt
    if (selectedCustomer && !selectedCustomer.taxExempt && orderState.taxSettings) {
      const taxes = orderState.taxSettings;
      let taxAmount = 0;
      
      if (taxes.tax1) taxAmount += total * (taxes.tax1.rate / 100);
      if (taxes.tax2) taxAmount += total * (taxes.tax2.rate / 100);
      if (taxes.tax3) taxAmount += total * (taxes.tax3.rate / 100);
      
      total += taxAmount;
    }
    
    return total;
  };

  /**
   * Completes the order and resets the form
   */
  const completeOrderAndReset = async () => {
    try {
      // Validate requirements
      if (!selectedItems?.length) {
        showWarning('Please select items first');
        return;
      }
      
      if (!selectedCustomer) {
        showWarning('Please select a customer first');
        return;
      }
      
      // Generate random order ID for demo
      const orderId = Math.floor(Math.random() * 10000);
      
      // Prepare order data
      const orderData = {
        orderId: orderId,
        customer: selectedCustomer,
        items: selectedItems,
        bagQuantity: formData.bagQuantity,
        paymentMethod: formData.paymentMethod,
        total: calculateTotal(),
        pickupDate,
        deliveryDate,
        isExpress,
        isRepeat,
        notes,
        numberOfPickups,
        frequency,
        deliveryOption,
        selectedPriceList,
        taxApplied: selectedCustomer && !selectedCustomer.taxExempt,
        taxSettings: orderState.taxSettings
      };

      // Simulate a delay (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset UI state
      updateOrderField('showOrderFlow', false);
      updateOrderField('showPaymentOptionsContent', false);
      updateOrderField('showOrderConfirmation', false);
      setShowPaymentandBag(false);

      // Get user data from localStorage
      const userDataString = localStorage.getItem('userData');
      const userData = JSON.parse(userDataString);
      const currentStoreId = localStorage.getItem('selectedStoreId');

      console.log('orderData', {
        "userData": userData,
        "storeId": currentStoreId,
        "orderDetails": orderData
      });
      
      // Submit the order
      if (currentStoreId && userData?.id) {
        await submitOrder(userData.id, currentStoreId);
        showAlert('success', 'Order completed successfully!');
        resetOrder();
      } else {
        showAlert('error', 'Failed to complete order. Please login to proceed.');
      }
    } catch (error) {
      console.log('error', error);
      showAlert('error', 'Failed to complete order. Please try again.');
    }
  };

  /**
   * Handles order submission flow
   */
  const handleSubmitOrder = () => {
    // Validate order requirements
    if (!selectedItems?.length) {
      showWarning('Please select items first');
      return;
    }
    
    if (!selectedCustomer) {
      showWarning('Please select a customer first');
      return;
    }
    
    // Progress through order flow steps
    if (!showOrderFlow && !showPaymentandBag) {
      updateOrderField('showOrderFlow', true);
      return;
    }
    
    if (!showPaymentOptionsContent) {
      updateOrderField('showPaymentOptionsContent', true);
      return;
    }
    
    if (!showOrderConfirmation) {
      // Hide PaymentOptionsContent and show order confirmation
      updateOrderField('showPaymentOptionsContent', false);
      updateOrderField('showOrderConfirmation', true);
      return;
    }
    
    // Complete the order
    completeOrderAndReset();
  };

  /**
   * Renders date and time selection buttons based on delivery options
   * @returns {JSX.Element} The date and time buttons
   */
  const renderDateTimeButtons = () => {
    const showDeliveryDate = ['Pickup & Delivery', 'Instore & Delivery'].includes(deliveryOption);
    const showPickupDate = ['Instore & Self-Collect', 'Pickup & Delivery', 'Pickup & Self-Collect'].includes(deliveryOption);

    return (
      <motion.div variants={itemVariants} className="space-y-3">
        {showPickupDate && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-2 border rounded-md text-left flex items-center"
            style={{ border: '0.582754px solid #D7D7D7', borderRadius: '6px' }}
            onClick={() => updateOrderField('showCalendarPopup', 'pickup')}
          >
            <div className="flex flex-col">
              <span>{new Date(pickupDate).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}</span>
              <span>{new Date(pickupDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</span>
            </div>
          </motion.button>
        )}
        
        {showDeliveryDate && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-2 border rounded-md text-left flex items-center"
            style={{ border: '0.582754px solid #D7D7D7', borderRadius: '6px' }}
            onClick={() => updateOrderField('showCalendarPopup', 'delivery')}
          >
            <div className="flex flex-col">
              <span>{new Date(deliveryDate).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}</span>
              <span>{new Date(deliveryDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</span>
            </div>
          </motion.button>
        )}
      </motion.div>
    );
  };

  /**
   * Gets the appropriate icon for the action button
   * @returns {JSX.Element} The icon component
   */
  const getActionButton = () => {
    if (deliveryOption === 'Instore & Self-Collect') {
      return <Clock size={20} />;
    }
    return <Truck size={20} />;
  };

  /**
   * Validates and applies a promo code
   * @param {string} code - The promo code to validate
   */
  const applyPromoCode = async (code) => {
    if (!code.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }

    try {
      const currentStoreId = localStorage.getItem('selectedStoreId');
      if (!currentStoreId) {
        setPromoCodeError('Store not selected');
        return;
      }

      const storeRef = doc(db, 'storeSettings', currentStoreId);
      const storeDoc = await getDoc(storeRef);

      if (storeDoc.exists()) {
        const data = storeDoc.data();
        const promoCodes = data.promoCodes?.codes || [];

        const validCode = promoCodes.find(promo =>
          promo.codeWord?.toLowerCase() === code.toLowerCase() &&
          (!promo.expires || new Date(promo.expires) > new Date()) &&
          (!promo.maxUses || promo.timesUsed < promo.maxUses)
        );

        if (validCode) {
          setPromoCodeApplied(validCode);
          setPromoCodeError('');

          // Update formData with promo code discount
          if (validCode.promoType === '% Discount for one order') {
            const discountAmount = (calculateTotal() * (parseFloat(validCode.discountPercentage) || 0)) / 100;
            updateFormData('promoDiscount', discountAmount);
            updateFormData('promoCode', validCode.codeWord);
          } else {
            const discountAmount = parseFloat(validCode.discountAmount) || 0;
            updateFormData('promoDiscount', discountAmount);
            updateFormData('promoCode', validCode.codeWord);
          }

          showAlert('success', 'Promo code applied successfully!');
        } else {
          setPromoCodeError('Invalid or expired promo code');
          setPromoCodeApplied(null);
        }
      } else {
        setPromoCodeError('Store settings not found');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeError('Failed to validate promo code');
    }
  };

  /**
   * Removes the applied promo code
   */
  const removePromoCode = () => {
    setPromoCode('');
    setPromoCodeApplied(null);
    setPromoCodeError('');
    updateFormData('promoDiscount', 0);
    updateFormData('promoCode', '');
  };

  // If order is complete, render order details view
  if (orderComplete) {
    const orderDetailsData = {
      customerName: selectedCustomer?.name || '',
      address: selectedCustomer?.address || '',
      phone: selectedCustomer?.phone || '',
      email: selectedCustomer?.email || '',
      items: selectedItems.map(item => `${item.name} x ${item.quantity}`),
      bagsQty: `Bag x${formData.bagQuantity}`,
      readyTime: new Date(pickupDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      readyDate: new Date(pickupDate).toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }),
      total: calculateTotal(),
      creditUsed: formData.credit || 0,
      paymentMethod: `Paid by ${formData.paymentMethod}`,
      expressDelivery: isExpress,
      taxes: selectedCustomer && !selectedCustomer.taxExempt ? orderState.taxSettings : null
    };
    return <OrderDetailsView orderDetails={orderDetailsData} />;
  }

  return (
    <>
      {/* Alerts and warnings */}
      {alert.show && (
        alert.type === 'success' ? (
          <SuccessMessage message={alert.message} />
        ) : alert.type === 'error' ? (
          <ErrorMessage message={alert.message} />
        ) : null
      )}
      {warning.show && <WarningMessage message={warning.message} />}

      {/* Main right section container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflowX: "hidden" // Prevent horizontal overflow
        }}
        className="bg-white flex flex-col h-full"
      >
        <div className="flex flex-col flex-1 p-4 overflow-y-auto" style={{ paddingBottom: '80px' }}>
          {/* Customer search and selection */}
          {featureConfig.customerSearch && (
            <motion.div variants={itemVariants} className="mb-4">
              {selectedStore && (
                <div className="mb-4 p-2 border rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    <b>Selected Store</b>
                    <span className="ml-1 text-lg font-semibold text-indigo-600">{selectedStore}</span>
                  </p>
                </div>
              )}
              
              <Suspense fallback={<div>Loading...</div>}>
                <CustomerSearch
                  onAddCustomerClick={() => updateOrderField('showAddCustomerPopup', true)}
                  onCustomerSelect={handleCustomerSelect}
                  selectedCustomer={selectedCustomer}
                  onCustomerAdded={handleCustomerAdded}
                />
              </Suspense>
            </motion.div>
          )}

          {/* Price list and express delivery options */}
          {featureConfig.priceList && featureConfig.express && (
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
              <div className="w-full">
                <Dropdown
                  data={priceLists ? priceLists.map(list => list.name) : []}
                  selected={selectedPriceList ? selectedPriceList.name : 'Default Price List'}
                  onSelect={(value) => {
                    const selectedList = priceLists.find(list => list.name === value);
                    updateOrderField('selectedPriceList', selectedList);
                  }}
                />
              </div>
              <div className="w-full flex items-center justify-center border rounded-lg p-2" style={{ border: '0.582754px solid #D7D7D7', borderRadius: '6px' }}>
                <Switch
                  checked={isExpress}
                  onChange={(e) => updateOrderField('isExpress', e.target.checked)}
                  label="Express Delivery"
                  id="toggle-express"
                />
              </div>
            </motion.div>
          )}

          {/* Payment options panel */}
          {showPaymentOptionsContent && (
            <PaymentOptionsContent
              formData={formData}
              setFormData={updateFormData}
              totalAmount={calculateTotal()}
              onContinue={() => {
                updateOrderField('showPaymentOptionsContent', false);
                updateOrderField('showOrderConfirmation', true);
              }}
              paymentSettings={orderState.paymentSettings}
              taxSettings={orderState.taxSettings}
              customerIsTaxExempt={selectedCustomer?.taxExempt}
            />
          )}

          {/* Order confirmation panel */}
          {showOrderConfirmation ? (
            <motion.div variants={itemVariants} className="flex-1 overflow-y-auto">
              {showOrderConfirmation && (
                <OrderConfirmation
                  formData={formData}
                  deliveryOption={deliveryOption}
                  selectedCustomer={selectedCustomer}
                  selectedItems={selectedItems}
                  pickupDate={pickupDate}
                  calculateTotal={calculateTotal}
                  onSubmit={completeOrderAndReset}
                  taxSettings={orderState.taxSettings}
                  isExpress={isExpress}
                  expressDeliveryCharge={formData.expressDeliveryCharge}
                />
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Order items list */}
              {featureConfig.orderItems && (
                <motion.div 
                  variants={itemVariants} 
                  className="mb-4"
                  style={{
                    border: '0.582754px solid #D7D7D7',
                    borderRadius: '6px',
                    padding: '12px',
                    height: '380px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <OrderItemsList
                    items={selectedItems}
                    onUpdateQuantity={(index, change) => updateItemQuantity(index, change)}
                    onRemoveItem={(index) => removeItem(index)}
                  />
                </motion.div>
              )}

              {/* Order options and settings */}
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Notes field */}
                {featureConfig.notes && (
                  <FloatingInput
                    id="notes"
                    label="Write any Notes(optional)"
                    value={notes}
                    onChange={(id, value) => updateOrderField('notes', value)}
                  />
                )}

                {/* Promo Code Section */}
                <motion.div
                  variants={itemVariants}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Promo Code</label>
                    <button
                      onClick={() => setShowPromoCodeBox(!showPromoCodeBox)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        showPromoCodeBox
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {showPromoCodeBox ? 'Hide' : 'Show'} Promo Code
                    </button>
                  </div>

                  {showPromoCodeBox && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {!promoCodeApplied ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="Enter promo code"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  applyPromoCode(promoCode);
                                }
                              }}
                            />
                            <button
                              onClick={() => applyPromoCode(promoCode)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                          {promoCodeError && (
                            <p className="text-red-600 text-xs">{promoCodeError}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-green-700 font-medium text-sm">
                              {promoCodeApplied.codeWord}
                            </span>
                            <span className="text-green-600 text-xs">
                              {promoCodeApplied.promoType === '% Discount for one order'
                                ? `${promoCodeApplied.discountPercentage}% off`
                                : `$${promoCodeApplied.discountAmount} off`}
                            </span>
                          </div>
                          <button
                            onClick={removePromoCode}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Delivery options */}
                {featureConfig.deliveryOptions && (
                  <motion.div className="space-y-3">
                    {isRepeat && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="w-full">
                          <Dropdown
                            data={numberOfPickupsOptions}
                            selected={numberOfPickups}
                            onSelect={(value) => updateOrderField('numberOfPickups', value)}
                          />
                        </div>
                        <div className="w-full">
                          <Dropdown
                            data={frequencyOptions}
                            selected={frequency}
                            onSelect={(value) => updateOrderField('frequency', value)}
                          />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="w-full">
                        <Dropdown
                          data={deliveryOptions}
                          selected={deliveryOption}
                          onSelect={(value) => updateOrderField('deliveryOption', value)}
                        />
                      </div>
                      <div className="w-full flex items-center justify-center border rounded-lg p-2" style={{ border: '0.582754px solid #D7D7D7', borderRadius: '6px' }}>
                        <Switch
                          checked={isRepeat}
                          onChange={(e) => updateOrderField('isRepeat', e.target.checked)}
                          label="Repeat"
                          id="toggle-repeat"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Date and time selection */}
                {featureConfig.dateTime && renderDateTimeButtons()}
              </motion.div>
            </div>
          )}
        </div>

        {/* Fixed bottom action bar */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-0 left-0 right-0"
          style={{
            padding: "12px 16px",
            zIndex: 10,
            backgroundColor: "white",
            borderTop: "1px solid #e5e7eb"
          }}
        >
          <div className="flex space-x-2">
            {/* Primary action button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-[#1D4FB6] text-white p-3 rounded-md flex justify-between items-center"
              onClick={handleSubmitOrder}
            >
              <span>
                {!showPaymentOptionsContent
                  ? 'Continue to Payment'
                  : !showOrderConfirmation
                    ? 'Review Order'
                    : 'Complete Order'}
              </span>
              <div className="flex items-center">
                <span className="mr-2 ml-2 text-xs">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short'
                  })}
                </span>
                <motion.span
                  key={calculateTotal()}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="bg-blue-700 px-2 py-1 rounded-md text-sm"
                >
                  $ {calculateTotal().toFixed(2)}
                </motion.span>
              </div>
            </motion.button>
            
            {/* Reset button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-md border border-gray-300"
              onClick={resetOrder}
            >
              {getActionButton()}
            </motion.button>
            
            {/* Toggle button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-md border border-gray-300 h-10"
              onClick={() => {
                if (showPaymentOptionsContent && showOrderConfirmation) {
                  updateOrderField('showOrderConfirmation', false);
                } else {
                  updateOrderField('showPaymentOptionsContent', !showPaymentOptionsContent);
                }
              }}
            >
              {showPaymentOptionsContent && showOrderConfirmation 
                ? <ChevronDown size={20} /> 
                : (showPaymentOptionsContent ? <ChevronDown size={20} /> : <ChevronUp size={20} />)
              }
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Popups and modals */}
      <AnimatePresence>
        {/* Add customer popup */}
        {showAddCustomerPopup && (
          <AddCustomerPopup 
            onClose={() => updateOrderField('showAddCustomerPopup', false)} 
            onCustomerAdded={handleCustomerAdded}
          />
        )}

        {/* Pickup date calendar */}
        {showCalendarPopup === 'pickup' && (
          <CalendarPopup
            date={new Date(pickupDate)}
            onDateChange={(date) => handleDateChange('pickup', date)}
            onClose={() => updateOrderField('showCalendarPopup', false)}
          />
        )}

        {/* Delivery date calendar */}
        {showCalendarPopup === 'delivery' && (
          <CalendarPopup
            date={new Date(deliveryDate)}
            onDateChange={(date) => handleDateChange('delivery', date)}
            onClose={() => updateOrderField('showCalendarPopup', false)}
          />
        )}
      </AnimatePresence>

      {/* Order submission flow */}
      {showOrderFlow && (
        <OrderSubmissionFlow
          onClose={() => {
            updateOrderField('showOrderFlow', false);
            updateOrderField('showPaymentOptionsContent', false);
          }}
          onComplete={() => {
            updateOrderField('showOrderFlow', false);
            updateOrderField('showPaymentOptionsContent', true);
            setShowPaymentandBag(true);
          }}
          selectedItems={selectedItems}
          totalAmount={calculateTotal()}
          formData={formData}
          setFormData={updateFormData}paymentSettings={orderState.paymentSettings}
          taxSettings={orderState.taxSettings}
          customerIsTaxExempt={selectedCustomer?.taxExempt}
          isExpress={isExpress}
          expressDeliveryCharge={formData.expressDeliveryCharge}
        />
      )}
    </>
  );
};

export default RightSection;
  "use client";

  import React, { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import Navbar from '../common/Navbar';
  import { ErrorMessage, SuccessMessage } from '../../Common/Components/AlertNotification';
  import { db } from '../../config';
  import { orderStatus } from '../../enum/status';
  import {
    collection,
    doc,
    updateDoc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    getDoc,
    onSnapshot,
    Timestamp
  } from 'firebase/firestore';

  const OperationsModule = ({ setShowMessage }) => {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
    const [isListView, setIsListView] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isScanRFIDModalOpen, setIsScanRFIDModalOpen] = useState(false);
    const [isScanProgressOpen, setIsScanProgressOpen] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [machineNumber, setMachineNumber] = useState('');
    const [rackNumber, setRackNumber] = useState('');
    const [isEditingMachine, setIsEditingMachine] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStore, setSelectedStore] = useState('Store Name');
    const [STORE_ID, setSTORE_ID] = useState(null);
    const [adminId, setAdminId] = useState(null);
    const [scannedRFID, setScannedRFID] = useState('');
    const [showPackingReport, setShowPackingReport] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, cleaning, ready, ironing
    
    // Date filtering states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    
    const [alertData, setAlertData] = useState({
      machineId: '',
      date: '',
      issueTypes: [],
      description: ''
    });

    // Price list filtering states
    const [priceLists, setPriceLists] = useState([]);
    const [selectedPriceList, setSelectedPriceList] = useState('All');
    const [uploadedImages, setUploadedImages] = useState([]);

    // Get STORE_ID from localStorage
    useEffect(() => {
      const storeId = localStorage.getItem('selectedStoreId');
      if (storeId) {
        setSTORE_ID(storeId);
        fetchStoreAdmin(storeId);
      }
    }, []);

    // This function would handle a declined cleaning notification
    const handleDeclinedCleaning = async (orderId) => {
      try {
        let orderRef;

        if (adminId) {
          orderRef = doc(db, 'pos_orders', adminId, 'stores', STORE_ID, 'orders', orderId);
        } else {
          orderRef = doc(db, 'pos_orders', orderId);
        }

        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
          console.error('Order not found:', orderId);
          return;
        }

        const orderData = orderSnap.data();

        await updateDoc(orderRef, {
          status: 'Un-Cleaned',
          cleanedDateTime: null,
          updatedAt: new Date()
        });

        console.log(`Order ${orderId} has been marked as Un-Cleaned after cleaning was declined`);
        await fetchOrders();

      } catch (error) {
        console.error('Error handling declined cleaning:', error);
      }
    };

    useEffect(() => {
      if (!STORE_ID) return;

      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        where('storeId', '==', STORE_ID),
        where('type', '==', 'orderCleaned')
      );

      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const notificationData = change.doc.data();

          if (notificationData.status === 'declined') {
            handleDeclinedCleaning(notificationData.orderId);
          }
        });
      });

      return () => unsubscribe();
    }, [STORE_ID, adminId]);

    // Fetch admin ID from store document
    const fetchStoreAdmin = async (storeId) => {
      try {
        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);

        if (storeSnap.exists()) {
          const storeData = storeSnap.data();
          setAdminId(storeData.adminId);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
      }
    };

    // Fetch price lists from store settings
    const fetchPriceLists = async () => {
      if (!STORE_ID) return;

      try {
        const storeSettingsRef = doc(db, 'storeSettings', STORE_ID);
        const storeSnap = await getDoc(storeSettingsRef);

        if (storeSnap.exists()) {
          const settingsData = storeSnap.data();
          const lists = settingsData.priceLists || [];
          setPriceLists(lists);
        }
      } catch (error) {
        console.error('Error fetching price lists:', error);
      }
    };

    // Fetch orders and price lists when STORE_ID and adminId are available
    useEffect(() => {
      if (STORE_ID) {
        fetchOrders();
        fetchPriceLists();
      }
    }, [STORE_ID, adminId]);

    // Filter orders for packing report (POS orders for cleaning, excluding rental orders)
    const getPackingReportOrders = () => {
      return filteredOrders.filter(order => {
        // Check if it's a POS order (all orders in pos_orders are from POS)
        // Filter out rental orders when rental feature is disabled
        const features = JSON.parse(localStorage.getItem('subscriptionData'))?.features || {};
        const rentalEnabled = features.rental !== false;

        // Get order section/category to check if it's rental
        const orderSection = order.section || order.category || order.serviceType || order.type;
        const items = order.items || order.selectedItems || order.orders || [];
        const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
        const itemSection = firstItem?.section || firstItem?.category || firstItem?.type;

        const section = orderSection || itemSection || 'Unknown';

        // Exclude rental orders when rental feature is disabled
        if (!rentalEnabled && (section.toLowerCase().includes('rental') || section === 'Rental Linen')) {
          return false;
        }

        // Include orders that are in cleaning workflow (not completed or cancelled)
        return order.status !== 'Completed' && order.status !== 'Cancelled';
      });
    };

    // Filter orders when search query, date range, or price list changes
    useEffect(() => {
      filterOrders();
    }, [orders, searchQuery, startDate, endDate, selectedPriceList]);

    // Convert Firebase Timestamp to Date
    const convertTimestamp = (timestamp) => {
      if (!timestamp) return null;
      if (timestamp.toDate) {
        return timestamp.toDate();
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      }
      return new Date(timestamp);
    };

    const fetchOrders = async () => {
      try {
        setLoading(true);
        let ordersRef;
        let q;

        if (adminId) {
          ordersRef = collection(db, 'pos_orders', adminId, 'stores', STORE_ID, 'orders');
        } else {
          ordersRef = collection(db, 'pos_orders');
          q = query(ordersRef, where('storeId', '==', STORE_ID));
        }

        const querySnapshot = await getDocs(q || ordersRef);

        const ordersData = [];
        querySnapshot.forEach((docSnap) => {
          const orderData = docSnap.data();
          
          // Convert all date fields properly
          const processedOrder = {
            id: docSnap.id,
            ...orderData,
            createdAt: convertTimestamp(orderData.createdAt),
            deliveryDate: convertTimestamp(orderData.deliveryDate),
            pickupDate: convertTimestamp(orderData.pickupDate),
            cleanedDateTime: convertTimestamp(orderData.cleanedDateTime),
            updatedAt: convertTimestamp(orderData.updatedAt),
          };

          ordersData.push(processedOrder);
        });

        // Sort orders by creation date (newest first)
        ordersData.sort((a, b) => {
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          return dateB - dateA;
        });

        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setShowMessage({ type: 'error', message: 'Failed to fetch orders' });
      } finally {
        setLoading(false);
      }
    };

    // Filter orders based on search query and date range
    const filterOrders = () => {
      let filtered = [...orders];

      // Filter by search query (Order ID)
      if (searchQuery.trim()) {
        filtered = filtered.filter(order => {
          const orderIdLower = (order.orderId || order.id || '').toLowerCase();
          return orderIdLower.includes(searchQuery.toLowerCase());
        });
      }

      // Filter by date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        filtered = filtered.filter(order => {
          const orderDate = order.createdAt;
          if (!orderDate) return false;
          return orderDate >= start && orderDate <= end;
        });
      }

      // Filter by price list
      if (selectedPriceList && selectedPriceList !== 'All') {
        filtered = filtered.filter(order => {
          const orderPriceList = order.selectedPriceList?.name || order.priceList?.name || 'Default Price List';
          return orderPriceList === selectedPriceList;
        });
      }

      setFilteredOrders(filtered);
    };

    // Format date range display
    const getDateRangeDisplay = () => {
      if (startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const end = new Date(endDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        return `${start} - ${end}`;
      }
      return 'Select Date Range';
    };

    // Clear date filter
    const clearDateFilter = () => {
      setStartDate('');
      setEndDate('');
    };

    // Opens the modal to update order status, assign machine and rack numbers
    const handleUpdateOrder = (order) => {
      setSelectedOrder(order);
      setMachineNumber(order.machineNumber || '');
      setRackNumber(order.rackNumber || '');
      setIsUpdateModalOpen(true);
      setIsEditingMachine(false);
    };

    const handleConfirmUpdate = async () => {
      if (!selectedOrder) return;
      try {
        let orderRef;

        if (adminId) {
          orderRef = doc(db, 'pos_orders', adminId, 'stores', STORE_ID, 'orders', selectedOrder.orderId);
        } else {
          orderRef = doc(db, 'pos_orders', selectedOrder.id);
        }

        const updateData = {
          machineNumber,
          rackNumber,
          updatedAt: new Date(),
        };

        const wasUncleaned = selectedOrder.status === 'Un-Cleaned' || selectedOrder.status === orderStatus.Pending;

        if (wasUncleaned) {
          updateData.status = 'Cleaned';
          updateData.cleanedDateTime = new Date();
        }

        await updateDoc(orderRef, updateData);

        const userData = JSON.parse(localStorage.getItem('userData'));

        if (wasUncleaned) {
          await addDoc(collection(db, 'notifications'), {
            type: 'orderCleaned',
            orderId: selectedOrder.id || selectedOrder.orderId,
            orderNumber: selectedOrder.orderId || `#${(selectedOrder.id || "").substring(0, 6)}`,
            storeId: STORE_ID,
            message: 'has been marked as cleaned and is ready for review.',
            status: 'pending',
            initiatorId: userData?.id || 'unknown',
            initiatorName: userData?.name || 'Staff Member',
            createdAt: serverTimestamp(),
            items: selectedOrder.items || []
          });

          console.log(`Created notification for order ${selectedOrder.id || selectedOrder.orderId}`);
        }

        await fetchOrders();

        setShowMessage({
          type: 'success',
          message: `Order updated successfully`
        });

        setIsUpdateModalOpen(false);
        setSelectedOrder(null);
        setMachineNumber('');
        setRackNumber('');
      } catch (error) {
        console.error('Error updating order:', error);
        setShowMessage({ type: 'error', message: 'Failed to update order' });
      }
    };

    // Handle Scan RFID modal
    const openScanRFIDModal = () => {
      setIsScanRFIDModalOpen(true);
    };

    const handleRFIDScan = async () => {
      try {
        if (!scannedRFID.trim()) {
          setShowMessage({ type: 'error', message: 'Please enter RFID code' });
          return;
        }

        const searchOrders = showPackingReport ? getPackingReportOrders() : filteredOrders;
        const foundOrder = searchOrders.find(order =>
          order.rfidCode === scannedRFID ||
          order.orderId === scannedRFID ||
          order.id === scannedRFID
        );

        if (foundOrder) {
          setSelectedOrder(foundOrder);
          setMachineNumber(foundOrder.machineNumber || '');
          setRackNumber(foundOrder.rackNumber || '');
          setIsScanRFIDModalOpen(false);
          setIsUpdateModalOpen(true);
          setScannedRFID('');
          setShowMessage({ type: 'success', message: 'Order found and loaded for update' });
        } else {
          setShowMessage({ type: 'error', message: 'No order found with this RFID code' });
        }
      } catch (error) {
        console.error('Error scanning RFID:', error);
        setShowMessage({ type: 'error', message: 'Failed to scan RFID' });
      }
    };

    // Handle Alert modal
    const openAlertModal = () => {
      setIsAlertModalOpen(true);
    };

    const handleAlertSubmit = async () => {
      try {
        if (!alertData.machineId || !alertData.description) {
          setShowMessage({ type: 'error', message: 'Please fill in all required fields' });
          return;
        }

        const alertsRef = collection(db, 'alerts');

        await addDoc(alertsRef, {
          ...alertData,
          issueType: alertData.issueTypes?.[0] || '',
          storeId: STORE_ID,
          createdAt: new Date(),
          images: uploadedImages,
          status: 'pending'
        });

        setShowMessage({ type: 'success', message: 'Alert submitted successfully' });
        setIsAlertModalOpen(false);
        setAlertData({
          machineId: '',
          date: '',
          issueTypes: [],
          description: ''
        });
        setUploadedImages([]);
      } catch (error) {
        console.error('Error submitting alert:', error);
        setShowMessage({ type: 'error', message: 'Failed to submit alert' });
      }
    };

    // Handle file input for image upload
    const handleImageUpload = (event) => {
      const files = Array.from(event.target.files);
      const newImages = files.map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setUploadedImages([...uploadedImages, ...newImages]);
    };

    // Remove uploaded image
    const removeImage = (index) => {
      const newImages = uploadedImages.filter((_, i) => i !== index);
      setUploadedImages(newImages);
    };

    // Toggle between card and list view
    const toggleView = () => {
      setIsListView(!isListView);
    };

    // Formats the list of ordered items for card view
    const getFormattedItems = (items) => {
      if (!items || items.length === 0) return '-';
      return items.map(item => `${item.name} × ${item.quantity}`).join(', ');
    };

    // Format date for display
    const formatDate = (date) => {
      if (!date) return '-';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    // Dashboard View
    const renderDashboard = () => (
      <div className="flex-1 mt-20">
        <div className="px-6 py-4">
          <h1 className="text-4xl font-bold mb-8">Operations Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cleaning Operations */}
            <div
              onClick={() => setCurrentView('cleaning')}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Cleaning</h3>
                  <p className="text-gray-600 mt-2">Manage cleaning operations and track progress</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Ready for Collection */}
            <div
              onClick={() => router.push('/Admin/Ready')}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Ready for Collection</h3>
                  <p className="text-gray-600 mt-2">Items ready for customer pickup</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Ironing */}
            <div
              onClick={() => router.push('/Admin/Ironing')}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Ironing</h3>
                  <p className="text-gray-600 mt-2">Manage ironing operations</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // Show dashboard or specific view
    if (currentView === 'dashboard') {
      return (
        <div className="flex flex-col min-h-screen bg-gray-100">
          <Navbar />
          {renderDashboard()}
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex-1 mt-20">
          {/* Back to Dashboard Button */}
          <div className="px-6 py-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {/* Orders header */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              {/* Left side - Orders heading */}
              <div className="flex flex-col">
                <h1 className="text-4xl font-bold">{showPackingReport ? 'Packing Report' : 'Orders'}</h1>
                {showPackingReport && (
                  <p className="text-sm text-gray-600 mt-1">All orders submitted from POS for cleaning</p>
                )}
              </div>

              {/* Right side - All controls in one line */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-medium font-bold">List view</span>
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isListView}
                      onChange={toggleView}
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${isListView ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${isListView ? 'right-1 translate-x-0' : 'left-1 -translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => setShowPackingReport(!showPackingReport)}
                  className={`px-4 py-2 rounded-full font-medium transition-colors ${
                    showPackingReport
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Packing Report
                </button>

                {/* Date Range Picker */}
                <div className="relative">
                  <input
                    type="text"
                    value={getDateRangeDisplay()}
                    readOnly
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="py-2 px-3 border rounded-md w-64 cursor-pointer"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  {/* Date Picker Dropdown */}
                  {isDatePickerOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg p-4 z-50 w-80" style={{ backgroundColor: 'white', opacity: '1' }}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Select Date Range</h3>
                        <button
                          onClick={() => setIsDatePickerOpen(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">End Date</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border rounded px-3 py-2 text-sm"
                          />
                        </div>
                        
                        <div className="flex justify-between pt-2">
                          <button
                            onClick={clearDateFilter}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Clear Filter
                          </button>
                          <button
                            onClick={() => setIsDatePickerOpen(false)}
                            className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Order ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="py-2 px-3 pr-10 border rounded-md w-48"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Price List Filter */}
                <div className="relative">
                  <select
                    value={selectedPriceList}
                    onChange={(e) => setSelectedPriceList(e.target.value)}
                    className="py-2 px-3 pr-8 border rounded-md w-48 bg-white"
                  >
                    <option value="All">All Price Lists</option>
                    {priceLists.map((priceList, index) => (
                      <option key={priceList.id || index} value={priceList.name}>
                        {priceList.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={openScanRFIDModal}
                  className="bg-blue-600 text-white py-2 px-5 rounded-full flex items-center gap-2"
                >
                  <span>Scan RFID</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(20deg)' }}>
                    <path d="M2.5 8.5c5.5-5.5 13.5-5.5 19 0" />
                    <path d="M5.5 11.5c3.8-3.8 9.2-3.8 13 0" />
                    <path d="M8.5 14.5c2.1-2.1 4.9-2.1 7 0" />
                    <circle cx="12" cy="18" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </button>

                <button
                  onClick={openAlertModal}
                  className="bg-red-600 text-white py-2 px-5 rounded-full flex items-center gap-2"
                >
                  <span>Alert</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Show active filters */}
            {(searchQuery || (startDate && endDate)) && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchQuery && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-2">
                    Order ID: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
                {startDate && endDate && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-2">
                    Date: {getDateRangeDisplay()}
                    <button onClick={clearDateFilter} className="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card view - DEFAULT VIEW */}
          {!isListView && (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {loading ? (
                <div className="col-span-full text-center py-8">Loading orders...</div>
              ) : (() => {
                const displayOrders = showPackingReport ? getPackingReportOrders() : filteredOrders;
                return displayOrders.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                  </div>
                ) : (
                  displayOrders.map((order) => (
                  <div key={order.orderId || order.id} className="bg-white rounded-lg shadow-md border border-blue-200 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50"></div>

                    <div className="relative z-10">
                      <div className="flex">
                        <div className="flex-1 pr-3">
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs font-semibold text-gray-800 font-medium">Order ID:</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800 font-medium">Pickup Date:</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800 font-medium">Status:</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800 font-medium">Machine:</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800 font-medium">Rack:</p>
                            </div>
                          </div>
                        </div>

                        <div className="w-px border-l-2 border-dashed border-gray-300 mx-3"></div>

                        <div className="flex-1 pl-3">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-800">#{order.orderId?.substring(0, 6) || order.id?.substring(0, 6) || '1234'}</p>
                              <button
                                onClick={() => handleUpdateOrder(order)}
                                className="text-indigo-600 text-xs font-medium font-semibold px-3 py-1 rounded border border-indigo-600 bg-white hover:bg-indigo-50"
                              >
                                Update
                              </button>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {formatDate(order.pickupDate || order.deliveryDate)}
                              </p>
                            </div>
                            <div>
                              <p className={`text-sm font-semibold px-3 py-1 rounded-full w-20 font-medium ${order.status === 'Cleaned' ? 'text-blue-600 bg-orange-50 ' :
                                  order.status === 'Un-Cleaned' || order.status === 'Pending' ? 'text-yellow-600 bg-yellow-200 ' :
                                  order.status === 'Ironing' ? 'text-indigo-600 bg-indigo-100 ' :
                                  order.status === 'Collected' ? 'text-green-600 bg-green-100 ' :
                                    'text-gray-600'
                                }`}>
                                {order.status || 'Un-Cleaned'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">#{order.machineNumber || '12'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">#{order.rackNumber || '12'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                );
              })()}
            </div>
          )}

          {/* List view (table) - SHOWS WHEN TOGGLE IS ON */}
          {isListView && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-blue-200">
                    <tr className="border-b text-left">
                      <th className="p-4 text-sm font-semibold text-gray-800">ID</th>
                      <th className="p-4 text-sm font-semibold text-gray-800">Customer Name</th>
                      <th className="p-4 text-sm font-semibold text-gray-800">Order Summary</th>
                      <th className="p-4 text-sm font-semibold text-gray-800">Date</th>
                      <th className="p-4 text-sm font-semibold text-gray-800">Date Cleaned</th>
                      <th className="p-4 text-sm font-semibold text-gray-800">Status</th>
                      <th className="p-4 text-sm font-semibold text-gray-800">Machine</th>
                      <th className="p-4 text-sm font-semibold text-gray-800 text-right">Rack</th>
                      <th className="p-4 text-sm font-semibold text-gray-800 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="p-4 text-center">Loading orders...</td>
                      </tr>
                    ) : (() => {
                      const displayOrders = showPackingReport ? getPackingReportOrders() : filteredOrders;
                      return displayOrders.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="p-4 text-center">
                            {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                          </td>
                        </tr>
                      ) : (
                        displayOrders.map((order, index) => (
                        <tr key={order.orderId || order.id} className={`${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-100`}>
                          <td className="p-4 text-sm font-medium text-gray-800">#{order.orderId?.substring(0, 4) || order.id?.substring(0, 4) || '1234'}</td>
                          <td className="p-4 text-sm font-medium text-gray-800">{order.customer?.name || order.selectedCustomer?.name || 'Customer'}</td>
                          <td className="p-4 text-sm font-medium text-gray-800">{getFormattedItems(order.items) || 'Dress, Evening(D) x 4'}</td>
                          <td className="p-4 text-sm font-medium text-gray-800">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '10 Mar 2024'}
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-800">
                            {order.cleanedDateTime ? new Date(order.cleanedDateTime).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Cleaned' ? 'text-purple-600 bg-transparent' :
                                order.status === 'Completed' || order.status === 'Collected' ? 'text-green-600 bg-green-100' :
                                order.status === 'Un-Cleaned' || order.status === 'Un-Ironed' || order.status === 'Pending' ? 'text-yellow-600 bg-yellow-200' :
                                order.status === 'Ironing' ? 'text-indigo-600 bg-indigo-100' :
                                'text-yellow-600 bg-yellow-200'
                              }`}>
                              {order.status || 'Un-Cleaned'}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-800">#{order.machineNumber || '12'}</td>
                          <td className="p-4 text-sm font-medium text-gray-800">#{order.rackNumber || '12'}</td>
                          <td className="p-4 text-sm text-right">
                            <button
                              onClick={() => handleUpdateOrder(order)}
                              className="text-indigo-600 text-xs font-medium px-3 py-1 rounded-full border border-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                        ))
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Update Details Modal */}
          {isUpdateModalOpen && selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg min-w-[900px]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Update Details</h2>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedOrder.status === 'Cleaned' ? 'text-purple-600 bg-transparent' :
                        selectedOrder.status === 'Completed' || selectedOrder.status === 'Collected' ? 'text-green-600 bg-green-100' :
                        selectedOrder.status === 'Un-Cleaned' || selectedOrder.status === 'Un-Ironed' || selectedOrder.status === 'Pending' ? 'text-yellow-600 bg-yellow-200' :
                        selectedOrder.status === 'Ironing' ? 'text-indigo-600 bg-indigo-100' :
                        'text-yellow-600 bg-yellow-200'
                      }`}>
                      {selectedOrder.status || 'Un-Cleaned'}
                    </div>
                    <button
                      onClick={() => setIsUpdateModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead className="bg-blue-200">
                      <tr className="border-b text-left">
                        <th className="p-4 text-sm font-semibold text-gray-800">Order ID</th>
                        <th className="p-4 text-sm font-semibold text-gray-800">Order Summary</th>
                        <th className="p-4 text-sm font-semibold text-gray-800">Date</th>
                        <th className="p-4 text-sm font-semibold text-gray-800">Date Cleaned</th>
                        <th className="p-4 text-sm font-semibold text-gray-800">Rack</th>
                        <th className="p-4 text-sm font-semibold text-gray-800">Machine</th>
                        <th className="p-4 text-sm font-semibold text-gray-800">Locker</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="p-4 text-sm font-medium text-gray-800">#{selectedOrder.orderId?.substring(0, 4) || selectedOrder.id?.substring(0, 4) || '4567'}</td>
                        <td className="p-4 text-sm font-medium text-gray-800">
                          <div className="flex flex-col">
                            {selectedOrder.items ? (
                              selectedOrder.items.map((item, index) => (
                                <span key={index}>{item.name} x {item.quantity}</span>
                              ))
                            ) : (
                              <>
                                <span>Dress, Evening(D) x 4</span>
                                <span>Dress, Evening(D) x 4</span>
                                <span>Dress, Evening(D) x 4</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-800">
                          {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : '10 Mar 2024'}
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-800">
                          {selectedOrder.cleanedDateTime ? new Date(selectedOrder.cleanedDateTime).toLocaleDateString() : '10 Mar 2024'}
                        </td>
                        <td className="p-4 text-sm">
                          <input
                            type="text"
                            value={rackNumber}
                            onChange={(e) => setRackNumber(e.target.value)}
                            className="border rounded px-2 py-1 w-16 text-sm"
                            placeholder="#"
                          />
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center gap-2">
                            {isEditingMachine ? (
                              <input
                                type="text"
                                value={machineNumber}
                                onChange={(e) => setMachineNumber(e.target.value)}
                                className="border rounded px-2 py-1 w-20 text-sm"
                                placeholder="#"
                              />
                            ) : (
                              <span className="font-medium text-gray-800">#{machineNumber || '12'}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setIsEditingMachine(!isEditingMachine)}
                              className="text-gray-500 hover:text-gray-700"
                              title={isEditingMachine ? 'Done' : 'Edit'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-800">#{selectedOrder.lockerNumber || '12'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleConfirmUpdate}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

  {/* Scan RFID Modal - Updated Design with Custom Image */}
  {isScanRFIDModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Icon positioned outside modal container */}
      <div className="relative">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-blue-600 rounded-full p-6 shadow-lg flex items-center justify-center">
            {/* Custom RFID Image */}
            <img 
              src="/scanrfid.png" 
              alt="Scan RFID" 
              className="h-14 w-14 object-contain"
            />
          </div>
        </div>
        
        {/* Modal container */}
        <div className="bg-white rounded-lg shadow-lg w-[800px] max-h-[90vh] overflow-y-auto relative mt-6">
          {/* Header */}
          <div className="bg-white p-4 rounded-t-lg flex items-center justify-center relative pt-12">
            <button
              onClick={() => setIsScanRFIDModalOpen(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Modal content */}
          <div className="p-6 pt-2">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Scan RFID</h2>
              <p className="text-gray-600">Dec 31, 2024 - Feb 20, 2024</p>
            </div>
            {/* Orders Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr className="text-left">
                    <th className="p-3 text-sm font-medium text-gray-700">ID</th>
                    <th className="p-3 text-sm font-medium text-gray-700">Customer Name</th>
                    <th className="p-3 text-sm font-medium text-gray-700">Order Summary</th>
                    <th className="p-3 text-sm font-medium text-gray-700">Scanned</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const displayOrders = showPackingReport ? getPackingReportOrders() : orders;
                    return displayOrders.slice(0, 5).map((order, index) => (
                    <tr key={order.id || order.orderId} className={`${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                      <td className="p-3 text-sm">
                        <div className="font-medium">#{order.orderId?.substring(0, 4) || order.id?.substring(0, 4) || `123${index}`}</div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="text-gray-900">{order.customer?.name || order.selectedCustomer?.name || ['Hamza', 'Asad', 'Saad', 'Jahanzeb', 'Hassan Sajjad'][index]}</div>
                      </td>
                      <td className="p-3 text-sm">
                        <div>
                          <div>Dress, Evening(D) x 4</div>
                          <div>Dress, Evening(D) x 4</div>
                          <div>Dress, Evening(D) x 4</div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="text-green-600">Dress, Evening(D) x 1</span>
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Save Progress Button - Centered */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setIsScanRFIDModalOpen(false);
                  setIsScanProgressOpen(true);
                }}
                className="bg-blue-600 text-white py-2 px-8 rounded-full hover:bg-blue-700"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
  {/* Alert Modal */}
  {isAlertModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-[500px] relative">
        {/* Red triangle header */}
        <div className="bg-white text-white p-4 rounded-t-lg flex items-center justify-center relative">
          <div className="bg-red-500 rounded-full p-6 absolute -top-14">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <button
            onClick={() => setIsAlertModalOpen(false)}
            className="absolute top-2 right-2 text-black hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 pt-8">
          <h2 className="text-xl font-semibold text-center mb-6">Alert</h2>

          <div className="space-y-4">
            {/* First row - Machine ID and Select Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Machine ID</label>
                <input
                  type="text"
                  value={alertData.machineId}
                  onChange={(e) => setAlertData({ ...alertData, machineId: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="01"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={alertData.date}
                  onChange={(e) => setAlertData({ ...alertData, date: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
  {/* Select Issue section */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Select Issue:</label>
    <div className="space-y-2">
      {/* First row - all main issues in one line */}
      <div className="flex items-center space-x-6">
        {['Fire', 'Electrical Issue', 'Mechanical Issue', 'Belt', 'Broken'].map((issue) => (
          <label key={issue} className="flex items-center">
            <input
              type="checkbox"
              value={issue}
              checked={alertData.issueTypes.includes(issue)}
              onChange={(e) => {
                const checked = e.target.checked;
                setAlertData((prev) => ({
                  ...prev,
                  issueTypes: checked
                    ? [...prev.issueTypes, issue]
                    : prev.issueTypes.filter((i) => i !== issue),
                }));
              }}
              className="mr-2 h-5 w-5 appearance-none rounded-full border-2 border-gray-300 bg-white checked:bg-white checked:border-blue-600 checked:border-[3px] focus:outline-none cursor-pointer transition-colors"
            />
            <span className="text-sm">{issue}</span>
          </label>
        ))}
      </div>
      
      {/* Second row - Other option */}
      <div className="flex items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            value="Other"
            checked={alertData.issueTypes.includes('Other')}
            onChange={(e) => {
              const checked = e.target.checked;
              setAlertData((prev) => ({
                ...prev,
                issueTypes: checked
                  ? [...prev.issueTypes, 'Other']
                  : prev.issueTypes.filter((i) => i !== 'Other'),
              }));
            }}
            className="mr-2 h-5 w-5 appearance-none rounded-full border-2 border-gray-300 bg-white checked:bg-white checked:border-blue-600 checked:border-[3px] focus:outline-none cursor-pointer transition-colors"
          />
          <span className="text-sm">Other</span>
        </label>
      </div>
    </div>
  </div>

            {/* Description */}
            <div>
              <textarea
                value={alertData.description}
                onChange={(e) => setAlertData({ ...alertData, description: e.target.value })}
                rows="4"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Describe Emergency"
              ></textarea>
            </div>
            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleAlertSubmit}
                className=" bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Submit
              </button>
            <label 
    onClick={() => setIsImageUploadModalOpen(true)}
    className="border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 cursor-pointer"
  >
    Add Images
  </label>
            </div>
          </div>
        </div>
      </div>
      {/* Image Upload Modal */}
  {isImageUploadModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-[500px] relative">
        {/* Header with alert icon */}
        <div className="bg-white text-white p-4 rounded-t-lg flex items-center justify-center relative">
          <div className="bg-red-500 rounded-full p-6 absolute -top-14">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <button
            onClick={() => setIsImageUploadModalOpen(false)}
            className="absolute top-2 right-2 text-black hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 pt-8">
          <h2 className="text-xl font-semibold text-center mb-6">Alert</h2>

          {/* Drag and Drop Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 mb-2">Drag and Drop here</p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                Select file
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Upload Images Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Images</h3>
            <div className="grid grid-cols-4 gap-3">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* Empty placeholders */}
              {Array.from({ length: Math.max(0, 4 - uploadedImages.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="w-full h-20 bg-gray-100 rounded border-2 border-dashed border-gray-300"></div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsImageUploadModalOpen(false)}
              className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
            >
              Submit
            </button>
            <button
              onClick={() => setIsImageUploadModalOpen(false)}
              className="border border-gray-300 text-gray-700 py-2 px-6 rounded hover:bg-gray-50"
            >
              Add Images
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
    </div>

  )}
        </div>
      </div>
    );
  };

  export default OperationsModule;
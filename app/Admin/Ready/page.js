"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import { db } from '../../config';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { orderStatus } from '../../enum/status';

const ReadyTable = ({ setShowMessage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('All');
  const [dueFilter, setDueFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeliveredModalOpen, setIsDeliveredModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ADMIN_ID, setAdminID] = useState(null);
  const [STORE_ID, setSTORE_ID] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    highlightOrderRowRed: "20",
    highlightOrderRowRedBy: "20"
  });
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [metrics, setMetrics] = useState({ orders: 0, pieces: 0, value: 0, unpaid: 0 });

  // Retrieve ADMIN_ID and STORE_ID
  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setAdminID(userData.id);
    }
    const storeId = localStorage.getItem('selectedStoreId');
    if (storeId) {
      setSTORE_ID(storeId);
    }
  }, []);

  // Fetch orders and store settings when IDs are available
  useEffect(() => {
    if (ADMIN_ID && STORE_ID) {
      fetchStoreSettings();
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ADMIN_ID, STORE_ID]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!ADMIN_ID || !STORE_ID) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [ADMIN_ID, STORE_ID]);

  // Fetch store settings
  const fetchStoreSettings = async () => {
    try {
      const storeSettingsRef = doc(db, 'storeSettings', STORE_ID);
      const storeSettingsSnap = await getDoc(storeSettingsRef);
      
      if (storeSettingsSnap.exists()) {
        const settingsData = storeSettingsSnap.data();
        setStoreSettings({
          highlightOrderRowRed: settingsData.highlightOrderRowRed || "20",
          highlightOrderRowRedBy: settingsData.highlightOrderRowRedBy || "20"
        });
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    }
  };

  // Fetch orders with status "Ready"
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders');
      const q = query(ordersRef, where('status', '==', orderStatus.Ready));
      const querySnapshot = await getDocs(q);

      const ordersData = [];
      querySnapshot.forEach((docSnap) => {
        const orderData = docSnap.data();
        ordersData.push({
          id: docSnap.id,
          ...orderData,
          createdAt: orderData.dates?.createdAt?.toDate?.() || orderData.createdAt?.toDate?.() || new Date(),
          deliveryDate: orderData.dates?.deliveryDate?.toDate?.() || orderData.deliveryDate?.toDate?.() || new Date(),
          updatedAt: orderData.updatedAt?.toDate?.() || new Date()
        });
      });

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setShowMessage({ type: 'error', message: 'Failed to fetch orders' });
    } finally {
      setLoading(false);
    }
  };

  // Helpers similar to Cleaning page to keep content identical while changing design
  const getOrderPieces = (order) => {
    const arr = order.items || order.selectedItems || order.orders || [];
    return Array.isArray(arr) ? arr.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0) : 0;
  };

  const getOrderSection = (order) => {
    const sectionLevel = order.section || order.category || order.serviceType || order.type;
    if (sectionLevel) return sectionLevel;
    const arr = order.items || order.selectedItems || order.orders || [];
    const first = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    return first?.section || first?.category || first?.type || 'Unknown';
  };

  const matchDueFilter = (order, filter) => {
    if (filter === 'All') return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date(today);
    endToday.setHours(23, 59, 59, 999);
    const delivery = order.deliveryDate instanceof Date ? order.deliveryDate : new Date(order.deliveryDate);
    const created = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);

    const isDueToday = delivery >= today && delivery <= endToday;
    const isDueTomorrow = (() => {
      const start = new Date(today);
      start.setDate(start.getDate() + 1);
      const end = new Date(endToday);
      end.setDate(end.getDate() + 1);
      return delivery >= start && delivery <= end;
    })();
    const isOverdue = delivery < today;
    const isCreatedToday = created >= today && created <= endToday;

    switch (filter) {
      case 'Due Today':
        return isDueToday;
      case 'Due Tomorrow':
        return isDueTomorrow;
      case 'Due Today & Overdue':
        return isDueToday || isOverdue;
      case 'Overdue':
        return isOverdue;
      case 'Created Today':
        return isCreatedToday;
      default:
        return true;
    }
  };

  // Derive filtered list and metrics
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    const next = orders.filter((order) => {
      const customerName = order.customer?.name?.toLowerCase() || '';
      const oid = order.orderId?.toLowerCase() || '';
      const matchesSearch = lower ? (customerName.includes(lower) || oid.includes(lower)) : true;

      const section = getOrderSection(order);
      const matchesSection = filterSection === 'All' ? true : section === filterSection;

      const matchesDue = matchDueFilter(order, dueFilter);

      return matchesSearch && matchesSection && matchesDue;
    });

    setDisplayedOrders(next);

    const ordersCount = next.length;
    const pieces = next.reduce((acc, o) => acc + getOrderPieces(o), 0);
    const totalValue = next.reduce((acc, o) => acc + (Number(o?.payment?.total) || Number(o?.formData?.total) || Number(o?.totalAmount) || Number(o?.total) || 0), 0);
    const unpaidValue = next.reduce((acc, o) => {
      const total = Number(o?.payment?.total) || Number(o?.formData?.total) || Number(o?.totalAmount) || Number(o?.total) || 0;
      const isPaid = o?.payment?.paymentMethod || o?.formData?.paymentMethod;
      return acc + (isPaid ? 0 : total);
    }, 0);

    setMetrics({ orders: ordersCount, pieces, value: totalValue, unpaid: unpaidValue });
  }, [orders, searchQuery, filterSection, dueFilter]);

  // Check if an order should be highlighted (past delivery time threshold)
  const shouldHighlightRow = (order) => {
    if (!order.deliveryDate) return false;

    const now = new Date();
    const deliveryDate = new Date(order.deliveryDate);
    const daysDifference = Math.floor((now - deliveryDate) / (1000 * 60 * 60 * 24));

    // Highlight if order is late by the configured number of days or more
    return daysDifference >= parseInt(storeSettings.highlightOrderRowRed);
  };

  // Update order status to "Collected" and add collectedDateTime field
  const handleMarkAsCollected = async (order) => {
    try {
      const orderRef = doc(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders', order.orderId);
      await updateDoc(orderRef, {
        status: orderStatus.Collected,
        updatedAt: new Date(),
        collectedDateTime: new Date() // Save current date & time
      });
      await fetchOrders();
      setShowMessage({ type: 'success', message: 'Order marked as collected successfully' });
      setIsModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      setShowMessage({ type: 'error', message: 'Failed to update order' });
    }
  };

  // Update order status to "Delivered" and add deliveredDateTime field
  const handleMarkAsDelivered = async (order) => {
    try {
      const orderRef = doc(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders', order.orderId);
      await updateDoc(orderRef, {
        status: orderStatus.Completed,
        updatedAt: new Date(),
        deliveredDateTime: new Date() // Save current date & time
      });
      await fetchOrders();
      setShowMessage({ type: 'success', message: `Order#${order.orderId} is Completed` });
    } catch (error) {
      console.error('Error updating order:', error);
      setShowMessage({ type: 'error', message: 'Failed to update order' });
    }
  };

  // Format currency with $prefix
  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return `$${parseFloat(amount).toLocaleString()}`;
  };

  // Render a list of items
  const getItemsList = (items) => {
    return items?.map((item, index) => (
      <div key={index} className="flex items-center mb-1">
        <span
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: item.color || '#000' }}
        ></span>
        <span className="text-sm">{item.name} × {item.quantity}</span>
      </div>
    ));
  };

  // Format date to DD/MM/YY
  const formatDate = (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '/');
  };

  // Modal component to confirm collection (redesigned)
  const CollectionModal = ({ order, onClose, onConfirm }) => {
    const method = order.payment?.paymentMethod || order.formData?.paymentMethod;
    const itemsSummary = Array.isArray(order.items)
      ? order.items.map((i) => `${i.name}${i.type ? `(${i.type})` : ''} x ${i.quantity || 0}`).slice(0, 3)
      : [];
    const cleanedAt = order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt || Date.now());

    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden bg-white rounded-2xl shadow-xl w-[900px] max-w-5xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-2xl font-semibold">Mark as Collected</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1 rounded-full text-sm bg-indigo-50 text-indigo-600">Cleaned</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-1">×</button>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-8 text-xs font-medium uppercase tracking-wider bg-gray-50 text-gray-500">
                    <div className="px-4 py-3 text-left">Order ID</div>
                    <div className="px-4 py-3 text-left col-span-2">Order Summary</div>
                    <div className="px-4 py-3 text-left">Date</div>
                    <div className="px-4 py-3 text-left">Date Cleaned</div>
                    <div className="px-4 py-3 text-left">Paid</div>
                    <div className="px-4 py-3 text-left">Total</div>
                    <div className="px-4 py-3 text-left">Balance</div>
                  </div>
                  <div className="grid grid-cols-8 items-center text-sm">
                    <div className="px-4 py-3">#{order.orderId}</div>
                    <div className="px-4 py-3 col-span-2 space-y-1">
                      {itemsSummary.length > 0 ? (
                        itemsSummary.map((txt, idx) => <div key={idx}>{txt}</div>)
                      ) : (
                        <div>-</div>
                      )}
                    </div>
                    <div className="px-4 py-3">{formatDate(order.createdAt)}</div>
                    <div className="px-4 py-3">{formatDate(cleanedAt)}</div>
                    <div className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClasses(method)}`}>
                        {method ? getPaymentMethodLabel(method) : 'Unpaid'}
                      </span>
                    </div>
                    <div className="px-4 py-3">{formatCurrency(order.payment?.total || order.formData?.total)}</div>
                    <div className="px-4 py-3 text-green-600">$0.00</div>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-5">
                  <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm mr-3">Cancel</button>
                  <button onClick={() => onConfirm(order)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Mark as Collected</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Confirmation modal "Are you sure?"
  const ConfirmModal = ({ onClose, onYes }) => (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-[420px]">
            <div className="p-6 text-center">
              <div className="flex justify-end">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">×</button>
              </div>
              <h3 className="text-xl font-semibold mb-2">Are you sure ?</h3>
              <p className="text-gray-600 mb-6">Do you want to mark this order as collected ?</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={onClose} className="px-5 py-2 border border-blue-600 text-blue-600 rounded-md">No</button>
                <button onClick={onYes} className="px-5 py-2 bg-blue-600 text-white rounded-md">Yes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // "Mark as Delivered" modal with Pay Now
  const DeliveredModal = ({ order, onClose }) => {
    const method = order.payment?.paymentMethod || order.formData?.paymentMethod;
    const itemsSummary = Array.isArray(order.items)
      ? order.items.map((i) => `${i.name}${i.type ? `(${i.type})` : ''} x ${i.quantity || 0}`).slice(0, 3)
      : [];
    const cleanedAt = order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt || Date.now());

    const goToInvoice = () => {
      try {
        window.location.href = `/Admin/Invoice?orderId=${order.orderId}`;
      } catch (_) {
        onClose();
      }
    };

    return (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden bg-white rounded-2xl shadow-xl w-[900px] max-w-5xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-2xl font-semibold">Mark as Delivered</h3>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1 rounded-full text-sm bg-indigo-50 text-indigo-600">Cleaned</span>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-1">×</button>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-8 text-xs font-medium uppercase tracking-wider bg-gray-50 text-gray-500">
                    <div className="px-4 py-3 text-left">Order ID</div>
                    <div className="px-4 py-3 text-left col-span-2">Order Summary</div>
                    <div className="px-4 py-3 text-left">Date</div>
                    <div className="px-4 py-3 text-left">Date Cleaned</div>
                    <div className="px-4 py-3 text-left">Paid</div>
                    <div className="px-4 py-3 text-left">Total</div>
                    <div className="px-4 py-3 text-left">Balance</div>
                  </div>
                  <div className="grid grid-cols-8 items-center text-sm">
                    <div className="px-4 py-3">#{order.orderId}</div>
                    <div className="px-4 py-3 col-span-2 space-y-1">
                      {itemsSummary.length > 0 ? (
                        itemsSummary.map((txt, idx) => <div key={idx}>{txt}</div>)
                      ) : (
                        <div>-</div>
                      )}
                    </div>
                    <div className="px-4 py-3">{formatDate(order.createdAt)}</div>
                    <div className="px-4 py-3">{formatDate(cleanedAt)}</div>
                    <div className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClasses(method)}`}>
                        {method ? getPaymentMethodLabel(method) : 'Unpaid'}
                      </span>
                    </div>
                    <div className="px-4 py-3">{formatCurrency(order.payment?.total || order.formData?.total)}</div>
                    <div className="px-4 py-3">{formatCurrency(order.payment?.total || order.formData?.total)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-6">
                  <button onClick={goToInvoice} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Pay Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get payment method label
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'cheque':
        return 'Cheque';
      case 'invoice':
        return 'Invoice';
      default:
        return method || '-';
    }
  };

  // Map payment method to badge classes (colors)
  const getPaymentBadgeClasses = (method) => {
    if (!method) return 'bg-red-100 text-red-800';
    switch (method) {
      case 'cash':
        return 'bg-amber-50 text-amber-600';
      case 'cheque':
        return 'bg-indigo-50 text-indigo-600';
      case 'card':
        return 'bg-green-50 text-green-700';
      case 'invoice':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="flex-1 p-6 mt-20">
      {/* Header: Title + Filters to mirror Cleaning page */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold mr-4">Ready</h1>

          <div className="hidden md:block w-px h-6 bg-gray-200 mx-2" />

          <div className="flex items-center gap-3 ml-4 md:ml-16 lg:ml-24">
            {/* Packing report button */}
            <button
              className="px-3 py-2 border rounded text-sm flex items-center gap-2 bg-white hover:bg-gray-50"
              onClick={() => window.open('/Admin/Operational', '_blank')}
            >
              <span>Packing report</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V2h12v7M6 18H5a2 2 0 01-2-2V9h18v7a2 2 0 01-2 2h-1M6 14h12v8H6v-8z" />
              </svg>
            </button>

            {/* Filter Section dropdown */}
            <div className="relative">
              <label className="mr-2 text-sm text-gray-600">Filter Section</label>
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-3 py-2 border rounded bg-white text-sm"
              >
                <option value="All">All</option>
                <option value="Dry Cleaning">Dry Cleaning</option>
                <option value="Bulk Laundry">Bulk Laundry</option>
              </select>
            </div>

            {/* Due filter */}
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
              className="px-3 py-2 border rounded bg-white text-sm"
            >
              <option>All</option>
              <option>Due Today</option>
              <option>Due Tomorrow</option>
              <option>Due Today & Overdue</option>
              <option>Overdue</option>
              <option>Created Today</option>
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search Order"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded text-sm w-48"
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="hidden md:flex items-center gap-6 text-xs text-gray-700">
          <div><span className="mr-1">Orders</span><span className="font-medium">{metrics.orders}</span></div>
          <div><span className="mr-1">Pieces</span><span className="font-medium">{metrics.pieces}</span></div>
          <div><span className="mr-1">Value</span><span className="font-medium">{formatCurrency(metrics.value)}</span></div>
          <div><span className="mr-1">Unpaid</span><span className="font-medium">{formatCurrency(metrics.unpaid)}</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ready By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ORDER</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOTES</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rack #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedOrders.map((order) => (
                <tr 
                  key={order.orderId} 
                  className={`hover:bg-gray-50 ${shouldHighlightRow(order) ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3 text-sm">{order.adminId || '-'}</td>
                  <td className="px-4 py-3 text-sm">{order.details?.bagQuantity || order.formData?.bagQuantity || '-'}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(order.deliveryDate)}</td>
                  <td className="px-4 py-3 text-sm">{order.customer?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{order.customer?.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="max-w-[200px]">
                      {getItemsList(order.items)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0}
                  </td>
                  <td className="px-4 py-3 text-sm">{order.details?.notes || order.notes || '-'}</td>
                  <td className="px-4 py-3 text-sm">{order.rackNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {(() => {
                      const method = order.payment?.paymentMethod || order.formData?.paymentMethod;
                      return (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadgeClasses(method)}`}>
                          {method ? getPaymentMethodLabel(method) : 'Unpaid'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {formatCurrency(order.payment?.credit || order.formData?.credit || 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(order.payment?.total || order.formData?.total || 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {order.details?.deliveryOption === "Instore & Self-Collect" ? (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100"
                      >
                        Mark as Collected
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsConfirmOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-sm text-center" colSpan="14">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-sm text-center text-gray-500" colSpan="14">
                    No ready orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collection Modal */}
      {isModalOpen && selectedOrder && (
        <CollectionModal
          order={selectedOrder}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          onConfirm={handleMarkAsCollected}
        />
      )}

      {/* Confirm Are you sure */}
      {isConfirmOpen && selectedOrder && (
        <ConfirmModal
          onClose={() => { setIsConfirmOpen(false); setSelectedOrder(null); }}
          onYes={async () => { setIsConfirmOpen(false); await handleMarkAsDelivered(selectedOrder); setIsDeliveredModalOpen(true); }}
        />
      )}

      {/* Delivered Modal */}
      {isDeliveredModalOpen && selectedOrder && (
        <DeliveredModal
          order={selectedOrder}
          onClose={() => { setIsDeliveredModalOpen(false); setSelectedOrder(null); }}
        />
      )}
    </div>
  );
};

export default function ReadyPage() {
  const [showMessage, setShowMessage] = useState({ type: null, message: null });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowMessage({ type: null, message: null });
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [showMessage.message]);


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {showMessage.message && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          showMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {showMessage.message}
        </div>
      )}
      <ReadyTable setShowMessage={setShowMessage} />
    </div>
  );
}
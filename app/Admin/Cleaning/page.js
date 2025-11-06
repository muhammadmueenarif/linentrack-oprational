"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import { ErrorMessage, SuccessMessage } from '../../Common/Components/AlertNotification';
import { db } from '../../config';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { orderStatus } from '../../enum/status';

const CleaningTable = ({ setShowMessage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('All');
  const [dueFilter, setDueFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rackNumber, setRackNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ADMIN_ID, setAdminID] = useState(null);
  const [STORE_ID, setSTORE_ID] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    highlightOrderRowRed: 2 // Default to 2 days
  });
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [metrics, setMetrics] = useState({ orders: 0, pieces: 0, value: 0, unpaid: 0 });
  const [editOrderData, setEditOrderData] = useState({
    notes: '',
    rackNumber: ''
  });

  // Retrieve ADMIN_ID and STORE_ID then fetch orders with status "pending"
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

  useEffect(() => {
    if (ADMIN_ID && STORE_ID) {
      fetchStoreSettings();
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ADMIN_ID, STORE_ID]);

  // Fetch store settings
  const fetchStoreSettings = async () => {
    try {
      const storeSettingsRef = doc(db, 'storeSettings', STORE_ID);
      const storeSettingsSnap = await getDoc(storeSettingsRef);

      if (storeSettingsSnap.exists()) {
        const settingsData = storeSettingsSnap.data();
        setStoreSettings({
          highlightOrderRowRed: settingsData.highlightOrderRowRed || 2
        });
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    }
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!ADMIN_ID || !STORE_ID) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [ADMIN_ID, STORE_ID]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders');
      // Filter orders with status "pending"
      const q = query(ordersRef, where('status', '==', orderStatus.Pending));
      const querySnapshot = await getDocs(q);

      const ordersData = [];
      querySnapshot.forEach((docSnap) => {
        const orderData = docSnap.data();
        ordersData.push({
          id: docSnap.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          deliveryDate: orderData.deliveryDate?.toDate() || new Date()
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

  // Helper: get total pieces for an order from possible item arrays
  const getOrderPieces = (order) => {
    const arr = order.selectedItems || order.orders || order.items || [];
    return Array.isArray(arr) ? arr.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0) : 0;
  };

  // Helper: detect section/category label on order or items
  const getOrderSection = (order) => {
    // Prefer order-level fields; fall back to first item's section/category
    const sectionLevel = order.section || order.category || order.serviceType || order.type;
    if (sectionLevel) return sectionLevel;
    const arr = order.selectedItems || order.orders || order.items || [];
    const first = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    return first?.section || first?.category || first?.type || 'Unknown';
  };

  // Helper: due filter predicates
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

  // Check if an order should be highlighted (past delivery time threshold)
  const shouldHighlightRow = (order) => {
    if (!order.deliveryDate) return false;

    const now = new Date();
    const deliveryDate = new Date(order.deliveryDate);
    const daysDifference = Math.floor((now - deliveryDate) / (1000 * 60 * 60 * 24));

    // Highlight if order is late by the configured number of days or more
    return daysDifference >= parseInt(storeSettings.highlightOrderRowRed);
  };

  // Derive filtered list and metrics whenever inputs change
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    const next = orders.filter((order) => {
      // Search by customer name or orderId
      const customerName = order.customer?.name?.toLowerCase() || '';
      const oid = order.orderId?.toLowerCase() || '';
      const matchesSearch = lower ? (customerName.includes(lower) || oid.includes(lower)) : true;

      // Section filter
      const section = getOrderSection(order);
      const matchesSection = filterSection === 'All' ? true : section === filterSection;

      // Due filter
      const matchesDue = matchDueFilter(order, dueFilter);

      return matchesSearch && matchesSection && matchesDue;
    });

    setDisplayedOrders(next);

    // Metrics
    const ordersCount = next.length;
    const pieces = next.reduce((acc, o) => acc + getOrderPieces(o), 0);
    const totalValue = next.reduce((acc, o) => acc + (Number(o?.totalAmount) || Number(o?.total) || 0), 0);
    const unpaidValue = next.reduce((acc, o) => {
      const total = Number(o?.totalAmount) || Number(o?.total) || 0;
      const paid = Number(o?.paidAmount) || Number(o?.paid) || 0;
      const due = Number(o?.dueAmount);
      const computedDue = Number.isFinite(due) ? due : Math.max(0, total - paid);
      return acc + computedDue;
    }, 0);

    setMetrics({ orders: ordersCount, pieces, value: totalValue, unpaid: unpaidValue });
  }, [orders, searchQuery, filterSection, dueFilter]);

  // Opens the modal to mark the order as cleaned (update status to "Ironing")
  const handleMarkAsCleaned = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Opens the modal to edit the order
  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setEditOrderData({
      notes: order.notes || '',
      rackNumber: order.rackNumber || ''
    });
    setIsEditModalOpen(true);
  };

  // Opens the modal to confirm order deletion
  const handleDeleteOrder = (order) => {
    setSelectedOrder(order);
    setIsDeleteModalOpen(true);
  };

  // Update order status to "Ironing", add rack number and save cleaned date/time
  const handleConfirmCleaned = async () => {
    if (!selectedOrder || !rackNumber) return;
    try {
      const orderRef = doc(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders', selectedOrder.orderId);
      await updateDoc(orderRef, {
        status: orderStatus.Ironing,
        rackNumber,
        updatedAt: new Date(),
        cleanedDateTime: new Date()  // New field to store the cleaned date/time
      });
      await fetchOrders();
      setShowMessage({ type: 'success', message: 'Order marked as cleaned successfully' });
      setIsModalOpen(false);
      setRackNumber('');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      setShowMessage({ type: 'error', message: 'Failed to update order' });
    }
  };

  // Update order details
  const handleConfirmEdit = async () => {
    if (!selectedOrder) return;
    try {
      const orderRef = doc(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders', selectedOrder.orderId);
      await updateDoc(orderRef, {
        notes: editOrderData.notes,
        rackNumber: editOrderData.rackNumber,
        updatedAt: new Date()
      });
      await fetchOrders();
      setShowMessage({ type: 'success', message: 'Order updated successfully' });
      setIsEditModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
      setShowMessage({ type: 'error', message: 'Failed to update order' });
    }
  };

  // Delete the order
  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      const orderRef = doc(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders', selectedOrder.orderId);
      await deleteDoc(orderRef);
      await fetchOrders();
      setShowMessage({ type: 'success', message: 'Order deleted successfully' });
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      setShowMessage({ type: 'error', message: 'Failed to delete order' });
    }
  };

  // Formats the list of ordered items
  const getStyledDamageList = (items) => {
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

  return (
    <div className="flex-1 p-6 mt-20">
      {/* Header: Title + Filters on the same line */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold mr-4">Cleaning</h1>

          {/* Shift filters slightly towards center */}
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
          <div><span className="mr-1">Value</span><span className="font-medium">PKR {metrics.value.toLocaleString()}</span></div>
          <div><span className="mr-1">Unpaid</span><span className="font-medium">PKR {metrics.unpaid.toLocaleString()}</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full whitespace-nowrap">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left text-xs font-medium text-gray-700">Admin ID</th>
              <th className="p-3 text-left text-xs font-medium text-gray-700">Placed</th>
              <th className="p-3 text-left text-xs font-medium text-gray-700">Customer</th>
              <th className="p-3 text-left text-xs font-medium text-gray-700">ORDER</th>
              <th className="p-3 text-left text-xs font-medium text-gray-700">Qty</th>
              <th className="p-3 text-left text-xs font-medium text-gray-700">Notes</th>
              <th className="p-3 text-left text-xs font-medium text-gray-700">Rack #</th>
              <th className="p-3 text-right text-xs font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedOrders.map((order) => (
              <tr
                key={order.orderId}
                className={`hover:bg-gray-50 ${shouldHighlightRow(order) ? 'bg-red-50' : ''}`}
              >
                <td className="p-3 text-sm">{order.adminId || '-'}</td>
                <td className="p-3 text-sm">{order.createdAt.toLocaleDateString()}</td>
                <td className="p-3 text-sm">{order.customer?.name || '-'}</td>
                <td className="p-3 text-sm">
                  <div className="max-w-xs">
                    {getStyledDamageList(order.selectedItems || order.orders || order.items)}
                  </div>
                </td>
                <td className="p-3 text-sm">
                  {getOrderPieces(order)}
                </td>
                <td className="p-3 text-sm">{order.notes || '-'}</td>
                <td className="p-3 text-sm">{order.rackNumber || '-'}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end items-center gap-4">
                    {/* Delete icon */}
                    <button
                      onClick={() => handleDeleteOrder(order)}
                      className="text-red-500 hover:text-red-600"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    {/* Edit pencil icon with subtle underline, no outer circle */}
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="text-indigo-600 hover:text-indigo-700"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a2.1 2.1 0 012.971 2.971L9.75 16.54 6 17.5l.96-3.75L16.862 3.487z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21h9" />
                      </svg>
                    </button>

                    {/* Mark as Cleaned pill button (no icon) */}
                    <button
                      onClick={() => handleMarkAsCleaned(order)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100"
                    >
                      <span className="whitespace-nowrap">Mark as Cleaned</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td className="p-3 text-sm" colSpan="8">Loading orders...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for rack number */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white p-6 rounded-xl w-[380px] shadow-xl">
            <button
              onClick={() => { setIsModalOpen(false); setSelectedOrder(null); }}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="mb-6 text-2xl font-semibold text-center">Mark as Cleaned</h2>

            <div className="mb-4 flex items-center justify-between">
              <label className="text-base font-medium">Order#</label>
              <div className="text-gray-600">#{selectedOrder.orderId || ''}</div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <label className="text-base font-medium mr-4">Rack #</label>
              <input
                type="text"
                value={rackNumber}
                onChange={(e) => setRackNumber(e.target.value)}
                placeholder="#"
                className="px-3 py-2 border border-indigo-300 rounded-md text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleConfirmCleaned}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Move to Ironing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing order */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="mb-4 text-lg font-semibold">Edit Order</h2>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">Order #</label>
              <input
                type="text"
                value={selectedOrder.orderId || ''}
                disabled
                className="w-full px-3 py-2 border rounded bg-gray-50 text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">Notes</label>
              <textarea
                value={editOrderData.notes}
                onChange={(e) => setEditOrderData({...editOrderData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
                rows="3"
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium">Rack #</label>
              <input
                type="text"
                value={editOrderData.rackNumber}
                onChange={(e) => setEditOrderData({...editOrderData, rackNumber: e.target.value})}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for confirming deletion */}
      {isDeleteModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="mb-4 text-lg font-semibold">Delete Order</h2>
            <p className="mb-6 text-sm">Are you sure you want to delete this order? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function CleaningPage() {
  const [showMessage, setShowMessage] = useState({ type: null, message: null });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowMessage({ type: null, message: null });
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [showMessage.message]);

  return (
    <>
      {showMessage.message && (
        showMessage.type === 'success' ? (
          <SuccessMessage message={showMessage.message} />
        ) : (
          <ErrorMessage message={showMessage.message} />
        )
      )}
      <div className="min-h-screen">
        <Navbar />
        {/* Page heading moved into table header row above */}
        <CleaningTable setShowMessage={setShowMessage} />
      </div>
    </>
  );
}
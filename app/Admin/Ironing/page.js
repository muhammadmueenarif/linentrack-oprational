"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import { ErrorMessage, SuccessMessage } from '../../Common/Components/AlertNotification';
import { db } from '../../config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { orderStatus } from '../../enum/status';

const IroningTable = ({ setShowMessage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('All');
  const [dueFilter, setDueFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [ADMIN_ID, setAdminID] = useState(null);
  const [STORE_ID, setSTORE_ID] = useState(null);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [metrics, setMetrics] = useState({ orders: 0, pieces: 0, value: 0, unpaid: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load ADMIN_ID and STORE_ID
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
      fetchOrders();
    }
  }, [ADMIN_ID, STORE_ID]);

  // Fetch orders with status "Ironing"
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders');
      const q = query(ordersRef, where('status', '==', orderStatus.Ironing));
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

  // Helpers copied from Cleaning for consistent behavior
  const getOrderPieces = (order) => {
    const arr = order.selectedItems || order.orders || order.items || [];
    return Array.isArray(arr) ? arr.reduce((acc, item) => acc + (Number(item?.quantity) || 0), 0) : 0;
  };

  const getOrderSection = (order) => {
    const sectionLevel = order.section || order.category || order.serviceType || order.type;
    if (sectionLevel) return sectionLevel;
    const arr = order.selectedItems || order.orders || order.items || [];
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

  // Update order status to "Ready" and save ironedDateTime
  const handleMarkAsIroned = async (order) => {
    try {
      const orderRef = doc(db, 'pos_orders', ADMIN_ID, 'stores', STORE_ID, 'orders', order.orderId);
      await updateDoc(orderRef, {
        status: orderStatus.Ready,
        updatedAt: new Date(),
        ironedDateTime: new Date()  // Save the current date & time as the ironed date/time.
      });
      await fetchOrders();
      setShowMessage({ type: 'success', message: `Order#${order.orderId} is ironed and moved to Rack#${order.rackNumber || ''}` });
    } catch (error) {
      console.error('Error updating order:', error);
      setShowMessage({ type: 'error', message: 'Failed to update order' });
    }
  };

  // Render items list (using selectedItems if available)
  const getStyledDamageList = (items) => {
    return items?.map((item, index) => (
      <div key={index} className="flex items-center mb-1">
        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color || '#000' }}></span>
        <span className="text-sm">{item.name} × {item.quantity}</span>
      </div>
    ));
  };

  return (
    <div className="flex-1 p-6 mt-20">
      {/* Header: Title + Filters on same line */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold mr-4">Ironing</h1>
          <div className="hidden md:block w-px h-6 bg-gray-200 mx-2" />
          <div className="flex items-center gap-3 ml-4 md:ml-16 lg:ml-24">
            <button
              className="px-3 py-2 border rounded text-sm bg-white hover:bg-gray-50"
              onClick={() => window.open('/Admin/Operational', '_blank')}
            >
              Packing report
            </button>
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
            <input
              type="text"
              placeholder="Search Order"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded text-sm w-48"
            />
          </div>
        </div>
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
              <th className="p-3 text-left text-xs font-medium text-gray-700">Ready By</th>
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
              <tr key={order.orderId} className="hover:bg-gray-50">
                <td className="p-3 text-sm">{order.adminId || '-'}</td>
                <td className="p-3 text-sm">{order.deliveryDate.toLocaleDateString()}</td>
                <td className="p-3 text-sm">{order.customer?.name || '-'}</td>
                <td className="p-3 text-sm">
                  <div className="max-w-xs">
                    {getStyledDamageList(order.selectedItems || order.orders || order.items)}
                  </div>
                </td>
                <td className="p-3 text-sm">
                  {order.selectedItems?.reduce((acc, item) => acc + item.quantity, 0) ||
                   order.orders?.reduce((acc, item) => acc + item.quantity, 0) ||
                   order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0}
                </td>
                <td className="p-3 text-sm">{order.notes || '-'}</td>
                <td className="p-3 text-sm">{order.rackNumber || '-'}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100"
                  >
                    Mark as Ironed
                  </button>
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

      {/* Modal for Mark as Ironed */}
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

            <h2 className="mb-6 text-2xl font-semibold text-center">Mark as Ironed</h2>

            <div className="mb-4 flex items-center justify-between">
              <label className="text-base font-medium">Order#</label>
              <div className="text-gray-600">#{selectedOrder.orderId}</div>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <label className="text-base font-medium mr-4">Rack #</label>
              <input
                type="text"
                value={selectedOrder.rackNumber || ''}
                disabled
                className="px-3 py-2 border border-indigo-300 rounded-md text-sm w-40 bg-gray-50"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={async () => { await handleMarkAsIroned(selectedOrder); setIsModalOpen(false); setSelectedOrder(null); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Mark as Ironed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function IroningPage() {
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
        <IroningTable setShowMessage={setShowMessage} />
      </div>
    </>
  );
}

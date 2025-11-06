"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../config'; 
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
  onSnapshot
} from 'firebase/firestore';

// This component should be integrated into your existing OperationsModule
const CleaningOperations = ({ storeId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData'));
    if (storedUserData) {
      setUserData(storedUserData);
    }
    
    if (!storeId) return;
    
    // Set up real-time listener for orders with 'pending' status
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('status', 'in', ['uncleaned', 'cleaned']),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [storeId]);
  
  const handleMarkAsCleaned = async (order) => {
    try {
      // Update order status
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'cleaned',
        cleanedAt: serverTimestamp(),
        cleanedBy: userData?.id || 'unknown'
      });
      
      // Create notification
      await addDoc(collection(db, 'notifications'), {
        type: 'orderCleaned',
        orderId: order.id,
        orderNumber: order.orderNumber || `#${order.id.substring(0, 6)}`,
        storeId: storeId,
        message: 'has been marked as cleaned and is ready for review.',
        status: 'pending',
        initiatorId: userData?.id || 'unknown',
        initiatorName: userData?.name || 'Staff Member',
        createdAt: serverTimestamp()
      });
      
      console.log(`Order ${order.id} marked as cleaned successfully`);
    } catch (error) {
      console.error("Error marking order as cleaned:", error);
      alert("Failed to update order status: " + error.message);
    }
  };
  
  const handleMarkAsUncleaned = async (order) => {
    try {
      // Update order status back to uncleaned
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'uncleaned',
        cleanedAt: null,
        cleanedBy: null
      });
      
      console.log(`Order ${order.id} marked as uncleaned`);
    } catch (error) {
      console.error("Error marking order as uncleaned:", error);
      alert("Failed to update order status: " + error.message);
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Cleaning Operations</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <div 
              key={order.id} 
              className={`border rounded-lg p-4 shadow-sm ${
                order.status === 'cleaned' ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">Order #{order.orderNumber || order.id.substring(0, 6)}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'cleaned' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'cleaned' ? 'Cleaned' : 'Uncleaned'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <p>Customer: {order.customerName || 'Unknown'}</p>
                <p>Items: {order.itemCount || 'N/A'}</p>
                <p>Created: {order.createdAt?.toDate().toLocaleString() || 'N/A'}</p>
                {order.status === 'cleaned' && (
                  <p>Cleaned by: {order.cleanedBy || 'N/A'}</p>
                )}
              </div>
              
              <div className="mt-4">
                {order.status === 'uncleaned' ? (
                  <button
                    onClick={() => handleMarkAsCleaned(order)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-lg text-sm transition-colors"
                  >
                    Mark as Cleaned
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsUncleaned(order)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-lg text-sm transition-colors"
                  >
                    Mark as Uncleaned
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No orders available for cleaning
        </div>
      )}
    </div>
  );
};

// This function should be integrated into your OperationsModule to handle notifications when orders are cleaned
const createNotificationSystem = () => {
  // Function to handle notification responses (accept/decline) from the admin
  const handleNotificationResponse = async (notification, action) => {
    try {
      // 1. Update the notification status
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        status: action,
        actionedAt: serverTimestamp()
      });
      
      // 2. If the action is 'declined', update the order status back to 'uncleaned'
      if (action === 'declined' && notification.type === 'orderCleaned') {
        const orderRef = doc(db, 'orders', notification.orderId);
        await updateDoc(orderRef, {
          status: 'uncleaned',
          cleanedAt: null,
          cleanedBy: null
        });
        
        // 3. Optionally, create a notification for the staff member who marked it as cleaned
        await addDoc(collection(db, 'staffNotifications'), {
          type: 'cleaningRejected',
          orderId: notification.orderId,
          orderNumber: notification.orderNumber,
          storeId: notification.storeId,
          message: 'Order cleaning has been rejected by admin.',
          status: 'pending',
          recipientId: notification.initiatorId,
          createdAt: serverTimestamp()
        });
      }
      
      // 4. If the action is 'accepted', move the order to the next stage (e.g., ready for pickup)
      if (action === 'accepted' && notification.type === 'orderCleaned') {
        const orderRef = doc(db, 'orders', notification.orderId);
        await updateDoc(orderRef, {
          status: 'ready', // Update to next workflow status
          readyAt: serverTimestamp()
        });
      }
      
    } catch (error) {
      console.error(`Error handling notification ${action}:`, error);
      throw error;
    }
  };
  
  return {
    handleNotificationResponse
  };
};

// Export the components and functions
export { CleaningOperations, createNotificationSystem };
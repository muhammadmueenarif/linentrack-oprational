"use client";
import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../../config';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';

const NotificationsPanel = ({ showNotifications, storeId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch notifications in real-time based on store ID
  useEffect(() => {
    if (!storeId) return;

    setLoading(true);
    
    // Create a query for notifications for this store, ordered by creation time (newest first)
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setNotifications(notificationData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [storeId]);

  // Handle notification actions (accept/decline)
  const handleNotificationAction = async (notification, action) => {
    try {
      const notificationRef = doc(db, 'notifications', notification.id);
      
      // Update notification status
      await updateDoc(notificationRef, {
        status: action,
        actionedAt: new Date()
      });

      // If it's an order notification and action is 'declined', update the order status
      if (notification.type === 'orderCleaned' && action === 'declined') {
        const orderRef = doc(db, 'orders', notification.orderId);
        await updateDoc(orderRef, {
          status: 'uncleaned' // Reset order status back to uncleaned
        });
      }
    } catch (error) {
      console.error(`Error ${action} notification:`, error);
    }
  };

  // Format time difference
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // difference in seconds
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notif => notif.status === 'pending');
  
  // Get the number of unread notifications
  const pendingCount = notifications.filter(notif => notif.status === 'pending').length;

  const markAllAsRead = async () => {
    try {
      // Update all pending notifications to 'read'
      const pendingNotifications = notifications.filter(notif => notif.status === 'pending');
      
      const updatePromises = pendingNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, {
          status: 'read',
          actionedAt: new Date()
        });
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  return (
    <>
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-10 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
            <div className="flex items-center">
              <button 
                className="text-blue-500 text-sm mr-2"
                onClick={markAllAsRead}
                disabled={pendingCount === 0}
              >
                Mark all as read
              </button>
              <Settings size={20} className="text-gray-400" />
            </div>
          </div>

          <div className="flex mb-4 border-b">
            <button c
              className={`font-medium pb-2 px-3 ${activeTab === 'all' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('all')}
            >
              All <span className="ml-1 bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{notifications.length}</span>
            </button>
            <button 
              className={`font-medium pb-2 px-3 ${activeTab === 'pending' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending <span className="ml-1 bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{pendingCount}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start mb-4 pb-4 border-b">
                  <div className="rounded-full bg-blue-100 h-10 w-20 flex items-center justify-center text-blue-600 font-medium mr-3">
                    {notification.initiatorName?.substring(0, 2) || "OR"}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-800">
                      {notification.type === 'orderCleaned' ? (
                        <span className="font-medium">Order #{notification.orderNumber}</span>
                      ) : notification.type === 'policyUpdate' ? (
                        <span className="font-medium">Policy #{notification.policyId}</span>
                      ) : notification.type === 'discountUpdate' ? (
                        <span className="font-medium">Discount #{notification.discountId}</span>
                      ) : notification.type === 'ticketStatusUpdate' ? (
                        <span className="font-medium">Ticket #{notification.displayTicketId || notification.ticketId}</span>
                      ) : notification.type === 'ticketResolved' ? (
                        <span className="font-medium">Ticket #{notification.ticketId}</span>
                      ) : (
                        <span className="font-medium">Notification</span>
                      )} {notification.message}
                    </p>
                    {notification.status === 'pending' && (
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          {notification.type === 'orderCleaned' ? (
                            <>
                              <button 
                                className="bg-[#1D4FB6] text-white px-4 py-1 rounded text-sm mr-2 flex items-center"
                                onClick={() => handleNotificationAction(notification, 'accepted')}
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Accept
                              </button>
                              <button 
                                className="bg-gray-100 text-gray-800 px-4 py-1 rounded text-sm flex items-center"
                                onClick={() => handleNotificationAction(notification, 'declined')}
                              >
                                <XCircle size={16} className="mr-1" />
                                Decline
                              </button>
                            </>
                          ) : (
                            <button 
                              className="bg-[#1D4FB6] text-white px-4 py-1 rounded text-sm flex items-center"
                              onClick={() => handleNotificationAction(notification, 'read')}
                            >
                              <CheckCircle size={16} className="mr-1" />
                              Mark as Read
                            </button>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{getTimeAgo(notification.timestamp)}</span>
                      </div>
                    )}
                    {notification.status !== 'pending' && (
                      <div className="mt-1 flex justify-between items-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          notification.status === 'accepted' ? 'bg-green-100 text-green-600' : 
                          notification.status === 'declined' ? 'bg-red-100 text-red-600' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {notification?.status?.charAt(0)?.toUpperCase() + notification?.status?.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400">{getTimeAgo(notification.timestamp)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No notifications available
            </div>
          )}

          <button 
            onClick={() => {
              window.location.href = "/Admin/Notifications";
            }}
            className="text-blue-500 w-full text-center text-sm hover:underline"
          >
            View All
          </button>
        </div>
      )}
    </>
  );
};

export default NotificationsPanel;
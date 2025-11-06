"use client";
import React, { useState, useRef, useEffect } from 'react';
import { FaCaretDown, FaLock } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NavbarPermissionKeys, hasPermission } from './permissions';
import { db } from '../../config';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc, limit, getDoc } from 'firebase/firestore';
import { orderStatus } from '../../enum/status';
import { useRouter } from 'next/navigation';
import { useClock } from '../../Common/Components/ClockContext';

// Define the SVG components for each icon
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.6569 16.6569L20.5 20.5" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InvoiceIcon = () => (
  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
   <path d="M14 2V8H20" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MetricsIcon = () => (
  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 3V12H21" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProductsIcon = () => (
  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Top of the 3D box */}
    <path d="M12 4L20 8L12 12L4 8L12 4Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    {/* Two lines on the top surface */}
    <path d="M14 6L18 8" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 6L6 8" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    {/* Left and right sides of the 3D box */}
    <path d="M4 8L4 16" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 8L20 16" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    {/* Bottom of the 3D box */}
    <path d="M4 16L12 20L20 16" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    {/* Central line connecting the top and bottom of the box */}
    <path d="M12 12V20" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HardwareIcon = () => (
   <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="10" width="18" height="8" rx="2" stroke="#2A2E34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 18H19V22H5V18Z" stroke="#2A2E34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="7" y="6" width="10" height="4" rx="1" stroke="#2A2E34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const UsersIcon = () => (
  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Front Person - Head */}
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    {/* Front Person - Body */}
    <path d="M19 21V19C19 16.7909 17.2091 15 15 15H9C6.79086 15 5 16.7909 5 19V21" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />

    {/* Half Person behind, to the right - Head (half circle) */}
    <path d="M16 7C16 4.79086 17.7909 3 20 3C22.2091 3 24 4.79086 24 7" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    {/* Half Person behind, to the right - Body (half arc) */}
    <path d="M19 15C21.2091 15 23 16.7909 23 19V21" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MarketingIcon = () => (
 <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.0001C16.9706 21.0001 21 16.9706 21 12.0001C21 7.02951 16.9706 3.00006 12 3.00006C7.02944 3.00006 3 7.02951 3 12.0001C3 16.9706 7.02944 21.0001 12 21.0001Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 16.5001C14.4853 16.5001 16.5 14.4853 16.5 12.0001C16.5 9.51486 14.4853 7.50006 12 7.50006C9.51472 7.50006 7.5 9.51486 7.5 12.0001C7.5 14.4853 9.51472 16.5001 12 16.5001Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 12.0001V12.0001" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
   <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 21V19C19 16.7909 17.2091 15 15 15H9C6.79086 15 5 16.7909 5 19V21" stroke="#2A2E34" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// New SVG component for the blue arrow
const BlueArrowIcon = () => (
  <svg width="11.42" height="10.61" viewBox="0 0 11.42 10.61" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 5.30542H11.42" stroke="#1D68F4" strokeWidth="1.53696" />
    <path d="M6.07544 0.694697L10.7932 5.30542L6.07544 9.91614" stroke="#1D68F4" strokeWidth="1.53696" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const iconComponents = {
  search: SearchIcon,
  'file-text': InvoiceIcon,
  'bar-chart': MetricsIcon,
  box: ProductsIcon,
  'hard-drive': HardwareIcon,
  users: UsersIcon,
  'trending-up': MarketingIcon,
  settings: AdminIcon,
};

// Helper component for Navigation Menu
const NavigationMenu = ({ subscriptionData }) => {
  const pathname = usePathname();
  const features = (subscriptionData?.features) ? (subscriptionData?.features) : JSON.parse(localStorage.getItem('subscriptionData'))?.features;

  const menuItems = [
  { name: 'New Order', path: '/Admin', feature: 'Order per month', permKey: NavbarPermissionKeys.newOrder },
    // Hide Pickup & Deliveries if package feature is not enabled
    ...(features && features.pickupDelivery === false ? [] : [
      { name: 'Pickup & Deliveries', path: '/Admin/Delivery', feature: 'Pickup & Delivery', permKey: NavbarPermissionKeys.pickupDeliveries }
    ]),
  { name: 'Cleaning', path: '/Admin/Cleaning', feature: 'Order per month', permKey: NavbarPermissionKeys.cleaning },
  { name: 'Ironing & Folding', path: '/Admin/Ironing', feature: 'Ironing & Folding', permKey: NavbarPermissionKeys.ironingFolding },
  { name: 'Ready', path: '/Admin/Ready', feature: 'Ready', permKey: NavbarPermissionKeys.ready },
  { name: 'Details', path: '/Admin/Detailed', feature: 'Details', permKey: NavbarPermissionKeys.details },
  { name: 'Machine', path: '/Admin/Machine', feature: 'Machine', permKey: NavbarPermissionKeys.machine },
  ];

  return (
    <div className="flex flex-1 justify-center">
      <ul className="flex whitespace-nowrap gap-5">
        {menuItems.map((item) => {
          const [enabled, setEnabled] = React.useState(true);
          React.useEffect(() => {
            (async () => {
              const ok = await hasPermission(item.permKey);
              setEnabled(ok);
            })();
          }, [item.permKey]);
          return (
            <li key={item.path} className="relative">
              {enabled ? (
                <Link
                  href={item.path}
                  className={`cursor-pointer hover:text-yellow-500 transition-colors duration-200 ${pathname === item.path ? 'text-yellow-500 font-bold' : 'text-white'} inline-block`}
                  style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 500, fontSize: '14.0625px', lineHeight: '21px' }}
                >
                  {item.name}
                </Link>
              ) : (
                <div className="flex items-center text-gray-400 cursor-not-allowed">
                  {item.name}
                  <FaLock className="ml-1 text-xs" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                    You do not have permission
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const QuickMenu = ({ subscriptionData }) => {
  const router = useRouter();
  const features = subscriptionData?.features || {};

  const quickMenuItems = [
    {
      name: 'Search',
      description: 'Find An item',
      icon: 'search',
      feature: 'Order per month',
      path: '/Admin/NavMenu/Search'
    },
     {
      name: 'Hardware',
      description: 'Get invoices',
      icon: 'hard-drive',
      feature: 'Hardware Integration',
      path: '/Admin/NavMenu/Hardware'
    },
    {
      name: 'Invoice',
      description: 'Impactful storytelling',
      icon: 'file-text',
      feature: 'Auto Invoicing',
      path: '/Admin/NavMenu/Invoice'
    },
     {
      name: 'Users',
      description: 'Functional digital products',
      icon: 'users',
      feature: 'Admin Tools',
      path: '/Admin/NavMenu/Users'
    },
    {
      name: 'Metrix',
      description: 'Beautiful crafted prints',
      icon: 'bar-chart',
      feature: 'Order per month',
      path: '/Admin/NavMenu/Dashboard'
    },
   
    {
      name: 'Marketing',
      description: 'Beautiful crafted prints',
      icon: 'trending-up',
      feature: 'Marketing',
      path: '/Admin/NavMenu/Marketing'
    },
     {
      name: 'Products',
      description: 'Artistic visual expression',
      icon: 'box',
      feature: 'Order per month',
      path: '/Admin/NavMenu/Products'
    },
    {
      name: 'Admin',
      description: 'Artistic visual expression',
      icon: 'settings',
      feature: 'Admin Tools',
      path: '/Admin/NavMenu/Dashboard'
    }
  ];

  const handleItemClick = (item) => {
    const isEnabled = true;
    if (isEnabled && item.path) {
      router.push(item.path);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-1 p-6">
      {quickMenuItems.map((item, index) => {
        const isEnabled = true;
        const IconComponent = iconComponents[item.icon];
        return (
          <div
            key={index}
            className={`flex items-center p-2 rounded-lg ${isEnabled
                ? 'hover:bg-gray-50 transition-colors duration-150 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
              }`}
            onClick={() => handleItemClick(item)}
            role={isEnabled ? "button" : ""}
            tabIndex={isEnabled ? 0 : -1}
            aria-disabled={!isEnabled}
          >
            <div className="flex items-center justify-center mr-3">
              {IconComponent ? <IconComponent /> : null}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                {!isEnabled && <FaLock className="ml-1 text-xs text-gray-400" />}
              </div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
            {isEnabled && (
              <BlueArrowIcon />
            )}
          </div>
        );
      })}
    </div>
  );
};


// Main Navbar Component
const Navbar = ({ subscriptionData }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCashUpPopup, setShowCashUpPopup] = useState(false);
  const [showSwitchUserPopup, setShowSwitchUserPopup] = useState(false);
  const [userData, setUserData] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [cashUpData, setCashUpData] = useState({
    amount: '',
    description: '',
    notes: '',
    selectedUserId: '',
    declaredCash: '',
    cashFromOrders: '',
    startingCash: ''
  });

  // Reset cash up form when popup opens
  const resetCashUpForm = () => {
    setCashUpData({
      amount: '',
      description: '',
      notes: '',
      selectedUserId: usersForCashUp.length > 0 ? usersForCashUp[0].id : '',
      declaredCash: '',
      cashFromOrders: '',
      startingCash: ''
    });
  };
  const [usersForCashUp, setUsersForCashUp] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [cashUpSettings, setCashUpSettings] = useState({
    requireStartingCash: false,
    trackDrawerPayouts: false
  });
  // Time in/out
  const [currentShift, setCurrentShift] = useState(null);
  const [timeInStr, setTimeInStr] = useState('');
  const [timeOutStr, setTimeOutStr] = useState('');
  const [showTimeInInput, setShowTimeInInput] = useState(false);
  const [showTimeOutInput, setShowTimeOutInput] = useState(false);
  const [timeInInput, setTimeInInput] = useState('');
  const [timeOutInput, setTimeOutInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');
 
  const [password, setPassword] = useState('');
  const passwordInputRefs = useRef([]);
  const router = useRouter();

  // Try to get clock context, but don't fail if not available
  let clockContext = null;
  try {
    clockContext = useClock();
  } catch (error) {
    // Clock context not available, continue without it
  }

  const menuRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData'));
    const selectedStoreId = localStorage.getItem('selectedStoreId');

    if (storedUserData) {
      setUserData(storedUserData);
    }

    if (selectedStoreId) {
      setStoreId(selectedStoreId);
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup state to prevent DOM manipulation errors
      setShowMenu(false);
      setShowProfileMenu(false);
      setShowCashUpPopup(false);
      setShowSwitchUserPopup(false);
    };
  }, []);

  useEffect(() => {
    if (!storeId) return;

    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('storeId', '==', storeId),
      where('status', '==', orderStatus.Pending)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      // Count only pending (unread/actionable) notifications so counter decreases appropriately
      setNotificationCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching notification count:", error);
    });

    return () => unsubscribe();
  }, [storeId]);

  // Subscribe to today's shift for this user to reflect Time In/Out
  useEffect(() => {
    if (!storeId || !userData?.id) return;
    const todayKey = new Date().toLocaleDateString('en-GB');
    const shiftsRef = collection(db, 'staffShifts');
    const q = query(
      shiftsRef,
      where('storeId', '==', storeId),
      where('userId', '==', userData.id),
      where('date', '==', todayKey),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setCurrentShift(null);
        setTimeInStr('');
        setTimeOutStr('');
        return;
      }
      const d = snap.docs[0];
      const data = d.data();
      setCurrentShift({ id: d.id, ...data });
      setTimeInStr(data.clockIn || '');
      setTimeOutStr(data.clockOut || '');
    });
    return () => unsub();
  }, [storeId, userData?.id]);

  const formatTime = (dateObj) => {
    const opts = { hour: '2-digit', minute: '2-digit', hour12: true };
    return new Intl.DateTimeFormat('en-US', opts).format(dateObj);
  };

  // Helper function to format time display
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '--:--';
    return timeStr;
  };

  const formatDateKey = (dateObj) => {
    return dateObj.toLocaleDateString('en-GB');
  };

  const handleTimeIn = async () => {
    try {
      if (!storeId || !userData?.id) return;

      // Prevent duplicate Time In if an open shift exists
      if (currentShift && !currentShift.clockOut) {
        setToastMsg('You already have an active shift');
        setTimeout(() => setToastMsg(''), 2500);
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();

      // Check if within shift hours (only if using current time, not manual time)
      if (!timeInInput || !timeInInput.trim()) {
        let shiftStartHour = 6;
        let shiftEndHour = 22;

        try {
          const storeSettingsRef = doc(db, 'storeSettings', storeId);
          const storeSnap = await getDoc(storeSettingsRef);
          if (storeSnap.exists()) {
            const settings = storeSnap.data();
            shiftStartHour = settings?.security?.clockInSettings?.shiftStartHour ?? 6;
            shiftEndHour = settings?.security?.clockInSettings?.shiftEndHour ?? 22;
          }
        } catch (e) {
          console.warn('Could not fetch shift hours settings', e);
        }

        if (currentHour < shiftStartHour || currentHour >= shiftEndHour) {
          setToastMsg(`Cannot clock in outside shift hours (${shiftStartHour}:00 - ${shiftEndHour}:00)`);
          setTimeout(() => setToastMsg(''), 2500);
          return;
        }
      }

      // If user provided time, use that, else use now
      const timeDisplay = (timeInInput && timeInInput.trim()) ? timeInInput.trim() : formatTime(now);
      const clockInISO = parseToISO(now, timeInInput);
      const payload = {
        storeId,
        storeName: localStorage.getItem('selectedStore') || '',
        userId: userData.id,
        name: userData.name || userData.email || 'Staff',
        date: formatDateKey(now),
        clockIn: timeDisplay,
        clockOut: '',
        clockInISO,
        clockOutISO: '',
        createdAt: serverTimestamp(),
      };
      // Save to staffShifts collection
      await addDoc(collection(db, 'staffShifts'), payload);

      // Also save to shifts collection for Nav Menu → Users Hours
      try {
        await addDoc(collection(db, 'shifts'), payload);
      } catch (e) {
        console.warn('Failed to save to shifts collection', e);
      }
      setShowTimeInInput(false);
      setTimeInInput('');
      setTimeInStr(timeDisplay); // Immediately show the saved time
      console.log('Time In saved:', timeDisplay); // Debug log
      setToastMsg('Time in Successfully Added');
      setTimeout(() => setToastMsg(''), 2500);
    } catch (e) {
      console.error('Time In failed', e);
    }
  };

  const handleTimeOut = async () => {
    try {
      if (!storeId || !userData?.id || !currentShift || currentShift.clockOut) return;

      // Check if within shift hours (only if using current time, not manual time)
      if (!timeOutInput || !timeOutInput.trim()) {
        let shiftStartHour = 6;
        let shiftEndHour = 22;

        try {
          const storeSettingsRef = doc(db, 'storeSettings', storeId);
          const storeSnap = await getDoc(storeSettingsRef);
          if (storeSnap.exists()) {
            const settings = storeSnap.data();
            shiftStartHour = settings?.security?.clockInSettings?.shiftStartHour ?? 6;
            shiftEndHour = settings?.security?.clockInSettings?.shiftEndHour ?? 22;
          }
        } catch (e) {
          console.warn('Could not fetch shift hours settings', e);
        }

        const currentHour = new Date().getHours();
        if (currentHour < shiftStartHour || currentHour >= shiftEndHour) {
          setToastMsg(`Cannot clock out outside shift hours (${shiftStartHour}:00 - ${shiftEndHour}:00)`);
          setTimeout(() => setToastMsg(''), 2500);
          return;
        }
      }

      const now = new Date();
      const timeDisplay = (timeOutInput && timeOutInput.trim()) ? timeOutInput.trim() : formatTime(now);
      const clockOutISO = parseToISO(now, timeOutInput);
      let hoursWorked = currentShift.clockInISO ? Math.max(0, (new Date(clockOutISO) - new Date(currentShift.clockInISO)) / (1000*60*60)) : 0;

      // Apply cap: max shift hours + overtime allowance from payroll settings
      try {
        const payrollSettingsRef = doc(db, 'payrollSettings', storeId);
        const payrollSnap = await getDoc(payrollSettingsRef);
        let maxShift = 16; // default
        if (payrollSnap.exists()) {
          const payrollData = payrollSnap.data();
          maxShift = payrollData?.maxHoursPerShift ?? 16;
        }

        // Also get overtime limit from payroll settings
        const overtimeAllowed = maxShift; // Using maxHoursPerShift as the overtime cap
        const cap = Math.max(0, (Number(maxShift) || 0) + (Number(overtimeAllowed) || 0));
        if (cap && hoursWorked > cap) {
          hoursWorked = cap;
        }
      } catch (e) {
        console.warn('Overtime cap read failed', e);
      }
      // Update staffShifts collection
      await updateDoc(doc(db, 'staffShifts', currentShift.id), {
        clockOut: timeDisplay,
        clockOutISO,
        hours: hoursWorked.toFixed(2)
      });

      // Also update shifts collection for Nav Menu → Users Hours
      try {
        const shiftsRef = collection(db, 'shifts');
        const todayKey = formatDateKey(now);
        const shiftQuery = query(
          shiftsRef,
          where('storeId', '==', storeId),
          where('userId', '==', userData.id),
          where('date', '==', todayKey),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const shiftSnap = await getDocs(shiftQuery);

        if (!shiftSnap.empty) {
          // Update existing shift in shifts collection
          const shiftDoc = shiftSnap.docs[0];
          await updateDoc(shiftDoc.ref, {
            clockOut: timeDisplay,
            clockOutISO,
            hours: hoursWorked.toFixed(2)
          });
        }
      } catch (e) {
        console.warn('Failed to update shifts collection', e);
      }
      setShowTimeOutInput(false);
      setTimeOutInput('');
      setTimeOutStr(timeDisplay); // Immediately show the saved time
      console.log('Time Out saved:', timeDisplay); // Debug log
      setToastMsg('Time out Successfully Added');
      setTimeout(() => setToastMsg(''), 2500);
    } catch (e) {
      console.error('Time Out failed', e);
    }
  };

  // Parse custom hh:mm AM/PM to ISO on given date
  const parseToISO = (baseDate, timeStr) => {
    if (!timeStr) return baseDate.toISOString();
    try {
      const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!m) return baseDate.toISOString();
      let h = parseInt(m[1], 10);
      const mins = parseInt(m[2], 10);
      const ampm = m[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      const d = new Date(baseDate);
      d.setHours(h, mins, 0, 0);
      return d.toISOString();
    } catch {
      return baseDate.toISOString();
    }
  };

  // Load staff users for user dropdown (by store) in real-time
  useEffect(() => {
    if (!storeId) return;
    const staffRef = collection(db, 'storeStaff');
    const q = query(staffRef, where('storeId', '==', storeId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsersForCashUp(list);
      if (list.length > 0 && !cashUpData.selectedUserId) {
        setCashUpData(prev => ({ ...prev, selectedUserId: list[0].id }));
      }
    }, (e) => {
      console.error('Error loading staff users for cash up:', e);
    });
    return () => unsub();
  }, [storeId, cashUpData.selectedUserId]);

  // Load cash up settings
  useEffect(() => {
    const loadCashUpSettings = async () => {
      try {
        if (!storeId) return;

        const storeSettingsRef = doc(db, 'storeSettings', storeId);
        const storeSnap = await getDoc(storeSettingsRef);

        if (storeSnap.exists()) {
          const settings = storeSnap.data();
          setCashUpSettings(settings.cashUp || {
            requireStartingCash: false,
            trackDrawerPayouts: false
          });
        }
      } catch (error) {
        console.error('Error loading cash up settings:', error);
      }
    };

    loadCashUpSettings();
  }, [storeId]);

  const handleLogout = async () => {
    try {
      // If current user is staff and has an active shift, auto time-out
      if (userData?.roleType === 'Staff' && currentShift && !currentShift.clockOut) {
        try {
          const now = new Date();
          const timeDisplay = formatTime(now);
          const clockOutISO = now.toISOString();
          let hoursWorked = currentShift.clockInISO ? Math.max(0, (now - new Date(currentShift.clockInISO)) / (1000*60*60)) : 0;

          // Apply cap: max shift hours + overtime allowance from payroll settings
          try {
            const payrollSettingsRef = doc(db, 'payrollSettings', storeId);
            const payrollSnap = await getDoc(payrollSettingsRef);
            let maxShift = 16; // default
            if (payrollSnap.exists()) {
              const payrollData = payrollSnap.data();
              maxShift = payrollData?.maxHoursPerShift ?? 16;
            }

            // Also get overtime limit from payroll settings
            const overtimeAllowed = maxShift; // Using maxHoursPerShift as the overtime cap
            const cap = Math.max(0, (Number(maxShift) || 0) + (Number(overtimeAllowed) || 0));
            if (cap && hoursWorked > cap) {
              hoursWorked = cap;
            }
          } catch (e) {
            console.warn('Overtime cap read failed during logout', e);
          }

          // Update staffShifts collection
          await updateDoc(doc(db, 'staffShifts', currentShift.id), {
            clockOut: timeDisplay,
            clockOutISO,
            hours: hoursWorked.toFixed(2)
          });

          // Also update shifts collection
          try {
            const shiftsRef = collection(db, 'shifts');
            const todayKey = formatDateKey(now);
            const shiftQuery = query(
              shiftsRef,
              where('storeId', '==', storeId),
              where('userId', '==', userData.id),
              where('date', '==', todayKey),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const shiftSnap = await getDocs(shiftQuery);

            if (!shiftSnap.empty) {
              const shiftDoc = shiftSnap.docs[0];
              await updateDoc(shiftDoc.ref, {
                clockOut: timeDisplay,
                clockOutISO,
                hours: hoursWorked.toFixed(2)
              });
            }
          } catch (e) {
            console.warn('Failed to update shifts collection during logout', e);
          }

          console.info('[Logout] Auto time-out completed for staff', { userId: userData.id, hoursWorked: hoursWorked.toFixed(2) });
        } catch (timeOutError) {
          console.warn('[Logout] Auto time-out failed', timeOutError);
        }
      }

      // Clear user data and redirect
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      localStorage.removeItem('selectedStoreId');
      localStorage.removeItem('selectedStoredata');

      // Use window.location for a hard navigation to prevent DOM issues
      window.location.href = '/login';
    } catch (error) {
      console.error('[Logout] Error during logout process', error);
      // Still proceed with logout even if time-out fails
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      localStorage.removeItem('selectedStoreId');
      localStorage.removeItem('selectedStoredata');
      window.location.href = '/login';
    }
  };

  const handleCashUpSubmit = async () => {
    try {
      if (!storeId || !userData?.id) {
        throw new Error('Store or user information missing');
      }

      // Validate required fields based on settings
      const requiredFields = ['amount', 'selectedUserId', 'declaredCash'];
      if (cashUpSettings.requireStartingCash && !cashUpData.startingCash) {
        requiredFields.push('startingCash');
      }

      for (const field of requiredFields) {
        if (!cashUpData[field]) {
          throw new Error(`Please fill in all required fields: ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        }
      }

      // Get selected user details
      const selectedUser = usersForCashUp.find(user => user.id === cashUpData.selectedUserId);

      await addDoc(collection(db, 'cashups'), {
        amount: parseFloat(cashUpData.amount),
        declaredCash: parseFloat(cashUpData.declaredCash),
        cashFromOrders: parseFloat(cashUpData.cashFromOrders || 0),
        confirmedCash: parseFloat(cashUpData.declaredCash), // Initially set confirmed cash to declared cash
        staff: selectedUser?.name || selectedUser?.email || 'Unknown',
        startingCash: parseFloat(cashUpData.startingCash || 0),
        description: cashUpData.description,
        notes: cashUpData.notes,
        storeId: storeId,
        userId: cashUpData.selectedUserId,
        createdBy: userData.id,
        createdAt: serverTimestamp(),
        status: 'pending',
        variance: 0, // Initially no variance
        settings: cashUpSettings // Save the settings used for this cash up
      });

      resetCashUpForm();
      setShowCashUpPopup(false);
      alert('Cash up recorded successfully!');

    } catch (error) {
      console.error('Error saving cash up:', error);
      alert('Failed to save cash up: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCashUpData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = () => {
    console.log('Attempting to log in with password:', password);

    if (password === '1234') {
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      localStorage.removeItem('selectedStoreId');
      window.location.href = '/login';

      setShowSwitchUserPopup(false);
      setPassword('');
    } else {
      alert('Invalid passcode. Please try again.');
      setPassword('');
    }
  };

  const handlePasscodeChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return;
    if (value.length > 1) return;

    let newPassword = [...password];
    newPassword[index] = value;
    setPassword(newPassword.join(''));

    if (value && index < passwordInputRefs.current.length - 1) {
      passwordInputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      let newPassword = [...password];
      newPassword[index - 1] = '';
      setPassword(newPassword.join(''));
      passwordInputRefs.current[index - 1].focus();
    }
  };

  const handleSwitchUser = async () => {
    try {
      // Close popup first
      setShowSwitchUserPopup(false);

      // If current user is staff and has an active shift, auto time-out
      if (userData?.roleType === 'Staff' && currentShift && !currentShift.clockOut) {
        try {
          const now = new Date();
          const timeDisplay = formatTime(now);
          const clockOutISO = now.toISOString();
          let hoursWorked = currentShift.clockInISO ? Math.max(0, (now - new Date(currentShift.clockInISO)) / (1000*60*60)) : 0;

          // Apply cap: max shift hours + overtime allowance from payroll settings
          try {
            const payrollSettingsRef = doc(db, 'payrollSettings', storeId);
            const payrollSnap = await getDoc(payrollSettingsRef);
            let maxShift = 16; // default
            if (payrollSnap.exists()) {
              const payrollData = payrollSnap.data();
              maxShift = payrollData?.maxHoursPerShift ?? 16;
            }

            // Also get overtime limit from payroll settings
            const overtimeAllowed = maxShift; // Using maxHoursPerShift as the overtime cap
            const cap = Math.max(0, (Number(maxShift) || 0) + (Number(overtimeAllowed) || 0));
            if (cap && hoursWorked > cap) {
              hoursWorked = cap;
            }
          } catch (e) {
            console.warn('Overtime cap read failed during switch user', e);
          }

          // Update staffShifts collection
          await updateDoc(doc(db, 'staffShifts', currentShift.id), {
            clockOut: timeDisplay,
            clockOutISO,
            hours: hoursWorked.toFixed(2)
          });

          // Also update shifts collection
          try {
            const shiftsRef = collection(db, 'shifts');
            const todayKey = formatDateKey(now);
            const shiftQuery = query(
              shiftsRef,
              where('storeId', '==', storeId),
              where('userId', '==', userData.id),
              where('date', '==', todayKey),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const shiftSnap = await getDocs(shiftQuery);

            if (!shiftSnap.empty) {
              const shiftDoc = shiftSnap.docs[0];
              await updateDoc(shiftDoc.ref, {
                clockOut: timeDisplay,
                clockOutISO,
                hours: hoursWorked.toFixed(2)
              });
            }
          } catch (e) {
            console.warn('Failed to update shifts collection during switch user', e);
          }

          console.info('[Switch User] Auto time-out completed for staff', { userId: userData.id, hoursWorked: hoursWorked.toFixed(2) });
        } catch (timeOutError) {
          console.warn('[Switch User] Auto time-out failed', timeOutError);
        }
      }

      // Use setTimeout to allow React to complete the current render cycle
      setTimeout(() => {
        // Clear user data and stop shift timer
        localStorage.removeItem('userData');
        localStorage.removeItem('selectedStoreId');
        localStorage.removeItem('selectedStoredata');

        // Use window.location for a hard navigation to prevent DOM issues
        window.location.href = '/Login';
      }, 100);
    } catch (error) {
      console.error('[Switch User] Error during switch user process', error);
      // Still proceed with logout even if time-out fails
      setTimeout(() => {
        localStorage.removeItem('userData');
        localStorage.removeItem('selectedStoreId');
        localStorage.removeItem('selectedStoredata');
        window.location.href = '/Login';
      }, 100);
    }
  };

  return (
    <nav style={{ position: "fixed", top: "0px", left: "0px", right: "0px", width: "100%", zIndex: "50", backgroundColor: "#1D50B6", opacity: "1", margin: 0, padding: "8px 16px", boxSizing: "border-box" }} className="flex items-center text-white">
      {toastMsg && (
        <div className="fixed top-[64px] left-1/2 -translate-x-1/2 z-[60]">
          <div className="px-4 py-2 rounded-md bg-green-100 text-green-800 border border-green-200 text-sm shadow-sm">{toastMsg}</div>
        </div>
      )}
      <div className="flex items-center space-x-3 flex-1" style={{ marginLeft: '3.06%' }}>
        <div ref={menuRef} className="relative flex items-center">
          <img
            src="/navbar/humbar.svg"
            alt="Menu"
            className="cursor-pointer"
            style={{ width: '24px', height: '24px' }}
            onClick={() => setShowMenu(!showMenu)}
          />
          {usePathname() === '/Admin' && (
            <span className="ml-3 font-bold" style={{ fontSize: '18px', lineHeight: '22px' }}>Admin</span>
          )}
          {showMenu && (
            <div className="absolute left-0 w-[400px] bg-white rounded-lg shadow-lg overflow-hidden" style={{ zIndex: 10, top: '40px' }}>
              <div className="custom-notch"></div>
              <QuickMenu subscriptionData={subscriptionData} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex justify-center">
        <NavigationMenu subscriptionData={subscriptionData} />
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-end">
        <div className="relative">
          <img
            src="/navbar/bell.svg"
            alt="Notifications"
            className="cursor-pointer"
            style={{ width: '24px', height: '24px' }}
            onClick={() => router.push('/Admin/Notifications')}
          />
          {notificationCount > 0 && (
            <span className="bg-yellow-500 text-black font-bold px-1 text-xs rounded-full absolute -top-2 -right-2">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </div>

        <div className="relative">
          <Link href="Admin/Chat">
            <img
              src="/navbar/chat.svg"
              alt="Chat"
              className="cursor-pointer hover:opacity-90"
              style={{ width: '24px', height: '24px' }}
            />
          </Link>
        </div>
        <div ref={profileRef} className="relative">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="h-8 border-l border-white/30" />
            <div className="text-right">
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '18px', lineHeight: '27px', color: '#FFFFFF' }}>
                {userData?.name || 'Guest'}
              </div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '18px', color: '#E1E1E1' }}>
                {userData?.email || `@${(userData?.username || (userData?.email ? userData.email.split('@')[0] : 'guest')).toLowerCase()}`}
              </div>
            </div>
            {/* Show store appearance logo if configured */}
            {(() => {
              try {
                const store = JSON.parse(localStorage.getItem('selectedStoredata')) || {};
                const logoUrl = store?.servicesOffered?.logo?.url;
                if (logoUrl && store?.servicesOffered?.logo?.showOnNav) {
                  return <img src={logoUrl} alt="profile" className="w-10 h-10 rounded-full object-contain bg-white" />;
                }
              } catch {}
              return <img src="https://placehold.co/40x40/png" alt="profile" className="w-10 h-10 rounded-full" />;
            })()}
            <FaCaretDown className="text-white text-sm" />
          </div>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden" style={{ zIndex: 2, maxWidth: 'calc(100vw - 2rem)', minWidth: '280px' }}>
              <div className="p-4">
                <div className='flex items-center justify-between mb-2'>
                  <h3 className="text-sm font-semibold text-gray-800">{userData?.name || 'Guest'}</h3>
                  <button
                    className="bg-[#F0F0FF] text-red-600 p-1 px-3 rounded-full text-sm"
                    onClick={() => setShowSwitchUserPopup(true)}>
                    Switch User
                  </button>
                </div>
                {/* Clock Status Indicator */}
                {clockContext?.isClockStopped && (
                  <div className="flex items-center justify-center py-2 bg-red-50 border border-red-200 rounded-lg mb-2">
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Clock Stopped - Enter PIN to Continue</span>
                    </div>
                  </div>
                )}

                {/* Auto Clock Status Indicator */}
                {userData?.roleType === 'Staff' && (
                  <div className="flex items-center justify-center py-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium">Auto Clock System Active</span>
                    </div>
                  </div>
                )}

                {/* Time In/Out Row - Enhanced Design */}
                <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 my-2 overflow-hidden">
                  <div className="text-gray-700 text-sm font-medium flex-shrink-0 pr-3">Time In</div>
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    {showTimeInInput ? (
                      <input
                        type="text"
                        placeholder="hh:mm AM/PM"
                        className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={timeInInput}
                        onChange={(e) => setTimeInInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTimeIn();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="text-gray-900 text-sm font-medium text-right whitespace-nowrap">
                        {timeInStr || '--:--'}
                      </div>
                    )}
                    <button
                      className="bg-[#F0F0FF] text-blue-600 px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors whitespace-nowrap"
                      onClick={() => {
                        if (showTimeInInput) handleTimeIn();
                        else setShowTimeInInput(true);
                      }}
                    >
                      {showTimeInInput ? 'Save' : 'Add'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100 overflow-hidden">
                  <div className="text-gray-700 text-sm font-medium flex-shrink-0 pr-3">Time Out</div>
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    {showTimeOutInput ? (
                      <input
                        type="text"
                        placeholder="hh:mm AM/PM"
                        className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={timeOutInput}
                        onChange={(e) => setTimeOutInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTimeOut();
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="text-gray-900 text-sm font-medium text-right whitespace-nowrap">
                        {timeOutStr || '--:--'}
                      </div>
                    )}
                    <button
                      className="bg-[#F0F0FF] text-blue-600 px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors whitespace-nowrap"
                      onClick={() => {
                        if (showTimeOutInput) handleTimeOut();
                        else setShowTimeOutInput(true);
                      }}
                      disabled={!timeInStr}
                    >
                      {showTimeOutInput ? 'Save' : 'Add'}
                    </button>
                  </div>
                </div>

                {/* Removed inline notification; toast is shown at top center */}

                <div className='flex mt-2'>
                  <button className="bg-[#F0F0FF] text-blue-600 w-1/2 ml-3 px-1 py-1 rounded-full mb-2 text-sm" onClick={() => { resetCashUpForm(); setShowCashUpPopup(true); }}>Cash Up</button>
                  <button className="bg-[#FFEDEB] text-red-600 w-1/2 ml-3 px-1 py-1 rounded-full mb-2 text-sm" onClick={handleLogout}>Logout</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCashUpPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 2 }}>
          <div style={{ width: "400px" }} className="relative bg-white p-6 rounded-lg ">
            <div className="absolute right-4 top-4">
              <svg onClick={() => setShowCashUpPopup(false)} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="#2A2E34" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 6L18 18" stroke="#2A2E34" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-3xl flex justify-center font-semibold mb-4 text-gray-800">Cash Up</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="startingCash" className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Cash {cashUpSettings.requireStartingCash && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="startingCash"
                  type="number"
                  name="startingCash"
                  placeholder="Starting Cash"
                  className="w-full p-2 border rounded text-black placeholder-gray-400"
                  value={cashUpData.startingCash}
                  onChange={handleInputChange}
                  required={cashUpSettings.requireStartingCash}
                />
              </div>
              <div>
                <label htmlFor="cashFromOrders" className="block text-sm font-medium text-gray-700 mb-2">Cash From Orders</label>
                <input
                  id="cashFromOrders"
                  type="number"
                  name="cashFromOrders"
                  placeholder="Cash From Orders"
                  className="w-full p-2 border rounded text-black placeholder-gray-400"
                  value={cashUpData.cashFromOrders}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="declaredCash" className="block text-sm font-medium text-gray-700 mb-2">Declared Cash *</label>
                <input
                  id="declaredCash"
                  type="number"
                  name="declaredCash"
                  placeholder="Declared Cash"
                  className="w-full p-2 border rounded text-black placeholder-gray-400"
                  value={cashUpData.declaredCash}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  className="w-full p-2 border rounded text-black placeholder-gray-400"
                  value={cashUpData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="selectedUserId" className="block text-sm font-medium text-gray-700 mb-2">Select User *</label>
                <select
                  id="selectedUserId"
                  name="selectedUserId"
                  className="w-full p-2 border rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={cashUpData.selectedUserId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select User</option>
                  {usersForCashUp.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email || `Staff ${u.id.slice(-4)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Notes"
                className="w-full p-2 border rounded text-black placeholder-gray-400"
                rows="3"
                value={cashUpData.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>
            <div className="flex justify-center">
              <button
                className="bg-[#1D4FB6] text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleCashUpSubmit}
                disabled={
                  !cashUpData.amount ||
                  !cashUpData.selectedUserId ||
                  !cashUpData.declaredCash ||
                  (cashUpSettings.requireStartingCash && !cashUpData.startingCash)
                }
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

     {showSwitchUserPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 2 }}>
          <div className="relative bg-white p-6 rounded-2xl shadow-lg mx-4" style={{ width: "450px", height: "320px" }}>
            {/* Close button */}
            <button
              onClick={() => setShowSwitchUserPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
            
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[#1D4FB6] flex items-center justify-center">
              <svg style={{ transform: "scale(0.8)" }} width="78" height="78" viewBox="0 0 78 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M65 68.25V61.75C65 58.9231 62.5766 56.25 59.5 56.25H19.5C16.4234 56.25 14 58.9231 14 61.75V68.25" stroke="#F8F9FA" strokeWidth="6.5" strokeLinecap="round" />
                <path d="M39 28.5C47.4927 28.5 55.5 20.4927 55.5 12C55.5 3.50736 47.4927 -4.5 39 -4.5C30.5074 -4.5 22.5 3.50736 22.5 12C22.5 20.4927 30.5074 28.5 39 28.5Z" stroke="#F8F9FA" strokeWidth="5.5" strokeLinecap="round" />
              </svg>
            </div>
            
            <div className='mt-10 text-center'>
    <h3 className="font-bold text-gray-700 text-2xl">Switch User</h3>
            </div>

            <div className='mt-16 text-center px-6'>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Are you sure you want to switch users? This will automatically log you out and stop your current shift timer.
              </p>
              
              <div className="flex space-x-6">
                <button
                  onClick={() => setShowSwitchUserPopup(false)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwitchUser}
                  className="flex-1 bg-[#1D4FB6] text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Switch User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
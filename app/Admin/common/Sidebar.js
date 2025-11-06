"use client";
import React, { useState, useCallback, memo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaCaretRight, FaLock } from 'react-icons/fa';
import { AlertCircle } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import StoreSelector from './StoreSelector';
import {
  DashboardIcon, StoreSettingsIcon, WorkflowIcon, PaymentsAndFinancesIcon,
  DiscountsAndPromosIcon, MarketingIcon, NotificationsIcon, PickupAndDeliveryIcon
} from '../Icons/sidebarIcons';

export const WarningMessage = ({ message }) => (
  <div className="flex items-center gap-2 p-3 text-yellow-800 bg-yellow-100 rounded-lg mb-4">
    <AlertCircle className="h-5 w-5" />
    <p className="text-sm">{message}</p>
  </div>
);

function getMainMenuUrl(menu) {
  if (!menu) return '/Admin'; // Handle dashboard case
  
  switch (menu.toLowerCase()) {
    case 'pickupanddelivery':
      return '/Admin/PickupDeliveries';
    case 'workflow':
      return '/Admin/Workflow';
    case 'discounts':
      return '/Admin/Discounts';
    case 'payments':
      return '/Admin/Payment';
    default:
      return `/Admin/${menu}`;
  }
}

function getSubmenuUrl(menu, item) {
  const baseUrl = getMainMenuUrl(menu);
  const activeParam = item.toLowerCase().replace(/\s+/g, '');
  return `${baseUrl}?active=${activeParam}`;
}

const MenuItem = memo(({
  icon,
  label,
  menu,
  submenuItems = [],
  isOpen,
  isSidebarOpen,
  onToggle,
  currentPath,
  isLocked,
  isFeatureEnabled
}) => {
  const mainMenuUrl = getMainMenuUrl(menu);
  const isSelected = menu === '' 
    ? currentPath === '/Admin' || currentPath === '/Admin/'
    : currentPath.startsWith(mainMenuUrl);
    
  const hasSubmenu = ['StoreSetting', 'payments', 'discounts', 'pickupAndDelivery'].includes(menu);
  const isMenuLocked = isLocked || !isFeatureEnabled;

  const handleClick = (e) => {
    if (isMenuLocked) {
      e.preventDefault();
      return;
    }
    
    if (hasSubmenu) {
      e.preventDefault();
      onToggle(menu);
    }
  };

  const renderLockIcon = () => {
    if (isMenuLocked && isSidebarOpen) {
      return <FaLock className="ml-2 text-sm text-gray-400" />;
    }
    return null;
  };

  const itemClasses = `
    flex items-center justify-between p-2 rounded-lg transition-all duration-200 ease-in-out
    ${isMenuLocked ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-800 hover:translate-x-1 active:scale-95'}
    ${isSelected ? 'bg-blue-800' : ''}
  `;

  return (
    <li className="mb-2">
      {hasSubmenu ? (
        <div className={itemClasses} onClick={handleClick}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <span className="mr-2">{icon}</span>
              {isSidebarOpen && <span className="ml-2">{label}</span>}
            </div>
            <div className="flex items-center">
              {renderLockIcon()}
              {isSidebarOpen && !isMenuLocked && (
                <span className={`transition-transform duration-200 ml-2 ${isOpen ? 'rotate-90' : ''}`}>
                  <FaCaretRight />
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Link 
          href={isMenuLocked ? '#' : mainMenuUrl}
          shallow
          onClick={handleClick}
          className={itemClasses}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <span className="mr-2">{icon}</span>
              {isSidebarOpen && <span className="ml-2">{label}</span>}
            </div>
            {renderLockIcon()}
          </div>
        </Link>
      )}

      {!isMenuLocked && isSidebarOpen && isOpen && submenuItems.length > 0 && (
        <ul className="pl-4 mt-1 space-y-1">
          {submenuItems.map((item) => {
            const submenuPath = getSubmenuUrl(menu, item);
            const isSubmenuSelected = currentPath.includes(submenuPath);

            return (
              <li key={item} className="text-sm">
                <Link href={submenuPath} shallow>
                  <span
                    className={`block p-2 rounded-lg transition-all duration-200 ease-in-out
                      hover:bg-blue-800 hover:translate-x-1 active:scale-95
                      ${isSubmenuSelected ? 'bg-blue-800' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
});

MenuItem.displayName = 'MenuItem';

const Sidebar = ({ subscriptionData, showBar }) => {
  const { isSidebarOpen } = useSidebar();
  const [openSubmenus, setOpenSubmenus] = useState(new Set());
  const [selectedStore, setSelectedStore] = useState(() => localStorage.getItem('selectedStoreId'));
  const pathname = usePathname();
  const router = useRouter();

  const features = subscriptionData?.features ||
    JSON.parse(localStorage.getItem('subscriptionData'))?.features;

  // Only use store selection if not in "pos" mode.
  useEffect(() => {
    if (showBar !== "pos") {
      const checkStoreSelection = () => {
        const storeId = localStorage.getItem('selectedStoreId');
        setSelectedStore(storeId);
      };

      checkStoreSelection();
      const interval = setInterval(checkStoreSelection, 1000);
      const handleStorageChange = (e) => {
        if (e.key === 'selectedStoreId') {
          checkStoreSelection();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('storeSelection', checkStoreSelection);

      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('storeSelection', checkStoreSelection);
      };
    }
  }, [showBar]);

  const toggleSubmenu = useCallback((menu) => {
    if (showBar !== "pos" && !selectedStore) return;
    setOpenSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menu)) {
        newSet.delete(menu);
      } else {
        newSet.add(menu);
      }
      return newSet;
    });
  }, [showBar, selectedStore]);

  const handleStoreSelected = () => {
    const storeId = localStorage.getItem('selectedStoreId');
    setSelectedStore(storeId);
    window.dispatchEvent(new Event('storeSelection'));
  };

  // Main menu items for non-POS mode.
  const mainMenuItems = React.useMemo(() => [
    { icon: <DashboardIcon />, label: 'Dashboard', menu: '', submenuItems: [] },
    {
      icon: <StoreSettingsIcon />, 
      label: 'Store Settings', 
      menu: 'StoreSetting',
      submenuItems: ['Store Info', 'Services Offered', 'Tax', 'Security', 'Multi Store']
    },
    { icon: <WorkflowIcon />, label: 'Workflow', menu: 'workflow', submenuItems: [] },
    {
      icon: <PaymentsAndFinancesIcon />, 
      label: 'Payments & Finances', 
      menu: 'payments',
      submenuItems: ['Payment', 'Invoices', 'Business Accounts', 'Subscription', 'Payroll', 'Cash Up', 'Accounting Integration']
    },
    {
      icon: <DiscountsAndPromosIcon />, 
      label: 'Discounts & Promos', 
      menu: 'discounts',
      submenuItems: ['Loyalty Points', 'Promo Codes', 'Codes and Referrals', 'Product Discount', 'Promo Carousel']
    },
    { icon: <MarketingIcon />, label: 'Marketing', menu: 'Marketing', submenuItems: [] },
    { icon: <NotificationsIcon />, label: 'Notifications', menu: 'NotificationSetting', submenuItems: [] },
    // Hide Pickup & Delivery menu when not included in package
    ...(features && features.pickupDelivery === false ? [] : [{
      icon: <PickupAndDeliveryIcon />, 
      label: 'Pickup & Delivery', 
      menu: 'pickupAndDelivery',
      submenuItems: [
        'General Settings', 
        'Routes', 
        // Hide Lockers submenu if lockers feature not included
        ...(features && features.lockers === false ? [] : ['Lockers']),
        'Notifications', 
        'Embed Your Store'
      ]
    }]),
  ], []);

  // POS-specific menu items.
  // For disabled items, add a flag "disabled" and display "Coming Soon" + a lock icon.
  const posMenuItems = [
    { label: 'Dry Cleaning', disabled: false },
    { label: 'Laundromat', disabled: true },
    { label: 'Bulk Laundry', disabled: true },
    { label: 'Rental', disabled: true },
  ];

  return (
    <div
      style={{ position: "fixed", left: "0px", top: "56px", height: "calc(100% - 56px)", zIndex: "3", backgroundColor: "#1D50B6" }}
      className={`text-white p-4 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-16'}`}
    >

      <div className='mt-4'>
        {showBar !== "pos" ? (
          <>
            {/* Store selector (for non-POS mode) */}
            <div className="mb-4" style={{ position: 'relative', zIndex: 999 }}>
              <StoreSelector onStoreSelect={handleStoreSelected} />
              {!selectedStore && isSidebarOpen && (
                <WarningMessage message="Please select or create a store to access the menu" />
              )}
            </div>
            <ul className="mb-4">
              {isSidebarOpen && <h2 className="text-sm font-bold mb-4">Main Menu</h2>}
              {mainMenuItems.map(({ icon, label, menu, submenuItems }) => (
                <MenuItem
                  key={menu || 'dashboard'}
                  icon={icon}
                  label={label}
                  menu={menu}
                  submenuItems={submenuItems}
                  isOpen={openSubmenus.has(menu)}
                  isSidebarOpen={isSidebarOpen}
                  onToggle={toggleSubmenu}
                  currentPath={pathname}
                  isLocked={!selectedStore}
                  isFeatureEnabled={label === 'Pickup & Delivery' ? (features && features.pickupDelivery !== false) : true}
                />
              ))}
            </ul>
          </>
        ) : (
          <ul className="mt-6">
            {isSidebarOpen && <h2 className="text-sm font-bold mb-3">POS Menu</h2>}
            {posMenuItems.map((item) => (
              <li key={item.label} className="mb-4">
                <div
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    item.disabled ? 'bg-blue-900 opacity-70 cursor-not-allowed' : 'hover:bg-blue-800 cursor-pointer'
                  }`}
                >
                  {isSidebarOpen && (
                    <span className="flex items-center">
                      {item.label}
                      {item.disabled && (
                        <>
                          <span className="ml-2 text-xs italic">(Coming Soon)</span>
                          <FaLock className="ml-1 text-sm" />
                        </>
                      )}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default memo(Sidebar);
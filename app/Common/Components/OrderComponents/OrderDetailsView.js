"use client";
import { motion } from 'framer-motion';
import { Dropdown } from '../../../ui/components/Dropdown';
import { Switch } from '../../../ui/components/Switch';
import { useOrder } from '../../../Pos/State/OrderProvider';
import { Printer, Share2, ArrowLeft } from 'lucide-react';
import { Button } from '../../../ui/components/Button';

/**
 * OrderDetailsView displays the complete order details after submission
 * @param {Object} props - Component props
 * @param {Object} props.orderDetails - Order details to display
 */
export const OrderDetailsView = ({ orderDetails }) => {
  const { resetOrder } = useOrder();

  // Animation variants for the component
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  // Create a new order
  const handleNewOrder = () => {
    resetOrder();
  };

  // Print the order
  const handlePrint = () => {
    window.print();
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="bg-white p-6 rounded-lg shadow-sm w-full max-w-3xl mx-auto print:shadow-none"
    >
      {/* Order header with ID and buttons */}
      <div className="flex justify-between items-start mb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order #1234</h2>
          <p className="text-sm text-gray-500">
            {formatDate(new Date())} • {formatTime(new Date())}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNewOrder}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            <span>New Order</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1"
          >
            <Printer size={16} />
            <span>Print</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Share2 size={16} />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Order details content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer information */}
        <div className="space-y-4">
          <div className="pb-3 border-b">
            <h3 className="font-medium text-gray-700 mb-2">Customer Information</h3>
            <div className="space-y-1">
              <p className="font-medium text-lg">{orderDetails.customerName}</p>
              <p className="text-gray-600">{orderDetails.address}</p>
              <p className="text-gray-600">{orderDetails.phone}</p>
              <p className="text-gray-600">{orderDetails.email}</p>
            </div>
          </div>

          {/* Order status */}
          <div className="pb-3 border-b">
            <h3 className="font-medium text-gray-700 mb-2">Order Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium">Completed</span>
            </div>
            {orderDetails.expressDelivery && (
              <div className="mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md inline-block text-sm">
                Express Delivery
              </div>
            )}
          </div>

          {/* Payment summary */}
          <div className="pb-3 border-b">
            <h3 className="font-medium text-gray-700 mb-2">Payment</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Payment Method:</span>
                <span className="font-medium">{orderDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Paid:</span>
                <span className="font-medium">$ {orderDetails.total.toFixed(2)}</span>
              </div>
              {orderDetails.creditUsed > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Credit Used:</span>
                  <span className="font-medium">$ {orderDetails.creditUsed.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order details */}
        <div className="space-y-4">
          {/* Order items */}
          <div className="pb-3 border-b">
            <h3 className="font-medium text-gray-700 mb-2">Order Items</h3>
            <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100">
                  <span>{item}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-1">
                <span>{orderDetails.bagsQty}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="pb-3 border-b">
            <h3 className="font-medium text-gray-700 mb-2">Delivery Information</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Ready Date:</span>
                <span className="font-medium">{orderDetails.readyDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ready Time:</span>
                <span className="font-medium">{orderDetails.readyTime}</span>
              </div>
            </div>
          </div>

          {/* Tax information if applicable */}
          {orderDetails.taxes && Object.keys(orderDetails.taxes).length > 0 && (
            <div className="pb-3 border-b">
              <h3 className="font-medium text-gray-700 mb-2">Tax Information</h3>
              <div className="space-y-1">
                {Object.keys(orderDetails.taxes).map((tax, index) => {
                  if (!orderDetails.taxes[tax]) return null;
                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{orderDetails.taxes[tax].name} ({orderDetails.taxes[tax].rate}%):</span>
                      <span className="font-medium">
                        Applied
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes section if available */}
      {orderDetails.notes && (
        <div className="mt-6 pb-3 border-b">
          <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
          <p className="text-gray-600 text-sm">{orderDetails.notes}</p>
        </div>
      )}

      {/* Action buttons at bottom */}
      <div className="mt-6 pt-4 border-t flex justify-between items-center print:hidden">
        <div className="flex items-center space-x-4">
          <Dropdown
            data={['Instore & Self-Collect', 'Delivery', 'Pickup']}
            selected="Instore & Self-Collect"
            onSelect={() => {}}
          />
          <Switch checked={orderDetails.isRepeat || false} onChange={() => {}} label="Repeat" />
        </div>
        
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleNewOrder}
        >
          Create New Order
        </Button>
      </div>

      {/* Print-only header that appears only when printing */}
      <div className="hidden print:block print:mb-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Order Receipt</h1>
          <p className="text-sm text-gray-500">Order #1234 • {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Print-only footer that appears only when printing */}
      <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:text-center">
        <p className="text-sm text-gray-500">Thank you for your business!</p>
        <p className="text-xs text-gray-400">This receipt was generated on {new Date().toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

export default OrderDetailsView;
import { motion } from 'framer-motion';
import { Dropdown } from '../../../ui/components/Dropdown';
import { Switch } from '../../../ui/components/Switch';

export const OrderDetailsView = ({ orderDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg w-full"
    >
      <div className="space-y-4">
        {/* Header with Order ID and Type */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">ID#1234</h3>
            <p className="text-sm text-gray-500">Order Type: Delivery</p>
          </div>
          <div className="flex items-center space-x-2">
            <Dropdown
              data={['Default Price List']}
              selected="Default Price List"
              onSelect={() => {}}
            />
            <Switch
              checked={orderDetails.expressDelivery}
              onChange={() => {}}
              label="Express Delivery"
            />
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">Name</span>
            <p className="text-sm text-gray-600">{orderDetails.customerName}</p>
          </div>
          <div>
            <span className="text-sm font-medium">Contact</span>
            <p className="text-sm text-gray-600">{orderDetails.address}</p>
            <p className="text-sm text-gray-600">{orderDetails.phone}</p>
            <p className="text-sm text-gray-600">{orderDetails.email}</p>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <span className="text-sm font-medium">Order</span>
          <div className="mt-1 space-y-1">
            {orderDetails.items.map((item, index) => (
              <p key={index} className="text-sm text-gray-600">{item}</p>
            ))}
          </div>
        </div>

        {/* Summary Information */}
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">Bags Qty</span>
            <p className="text-sm text-gray-600">{orderDetails.bagsQty}</p>
          </div>
          <div>
            <span className="text-sm font-medium">Ready</span>
            <p className="text-sm text-gray-600">{orderDetails.readyTime}</p>
            <p className="text-sm text-gray-600">{orderDetails.readyDate}</p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-sm">$ {orderDetails.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Credit Used</span>
            <span className="text-sm">$ {orderDetails.creditUsed.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Payment</span>
            <span className="text-sm">{orderDetails.paymentMethod}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t">
          <Dropdown
            data={['Instore & Self-Collect']}
            selected="Instore & Self-Collect"
            onSelect={() => {}}
          />
          <Switch checked={false} onChange={() => {}} label="Repeat" />
        </div>
      </div>
    </motion.div>
  );
};

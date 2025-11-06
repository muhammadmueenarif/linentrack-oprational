import React from 'react';

const OrderDetails = ({ orderId, deliveryOption }) => (
  <div className="mb-6">
    <p className="text-sm text-gray-600">ID#{orderId || '1234'}</p>
    <p className="text-sm text-gray-600">Order Type: {deliveryOption}</p>
  </div>
);

const CustomerDetails = ({ customer }) => (
  <div className="mb-6 space-y-3">
    <h3 className="font-medium text-gray-800">Customer Details</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Name</p>
        <p className="font-medium">{customer?.name}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Contact</p>
        <p>{customer?.phone}</p>
        {customer?.altPhone && (
          <p className="text-sm text-gray-500">Alt: {customer.altPhone}</p>
        )}
      </div>
      <div className="col-span-2">
        <p className="text-sm text-gray-600">Email</p>
        <p>{customer?.email}</p>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-gray-600">Address</p>
        <p>{customer?.address}</p>
      </div>
    </div>
  </div>
);

const OrderItems = ({ items }) => (
  <div className="mb-6 flex justify-between">
    <h3 className="font-medium text-gray-800 mb-2"><b>Order Items</b></h3>
    <div className="space-y-1">
      {items.map((item, index) => (
        <p key={index} className="text-sm">
          {item.name} x {item.quantity}
        </p>
      ))}
    </div>
  </div>
);

const BagsQuantity = ({ quantity }) => (
  <div className="mb-6">
    <p className="text-gray-600">Bags Qty</p>
    <p>Bag x{quantity}</p>
  </div>
);

const ReadyTime = ({ pickupDate }) => (
  <div className="mb-6">
    <p className="text-gray-600">Ready</p>
    <p className="text-sm">
      {new Date(pickupDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      })}
    </p>
    <p className="text-sm">
      {new Date(pickupDate).toLocaleDateString('en-US', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}
    </p>
  </div>
);

const PaymentDetails = ({ total, credit, paymentMethod }) => (
  <div className="border-t pt-4 space-y-2">
    <div className="flex justify-between text-sm">
      <span>Total</span>
      <span>${total.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Credit Used</span>
      <span>${(credit || 0)}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Payment</span>
      <span>Paid by {paymentMethod}</span>
    </div>
  </div>
);

const OrderConfirmation = ({
  formData,
  deliveryOption,
  selectedCustomer,
  selectedItems,
  pickupDate,
  calculateTotal,
}) => (
  <div className="bg-[#F0FFF4] p-6 rounded-lg">
    <OrderDetails orderId={formData.orderId} deliveryOption={deliveryOption} />
    <CustomerDetails customer={selectedCustomer} />
    <OrderItems items={selectedItems} />
    <BagsQuantity quantity={formData.bagQuantity} />
    <ReadyTime pickupDate={pickupDate} />
    <PaymentDetails 
      total={calculateTotal()} 
      credit={formData.credit} 
      paymentMethod={formData.paymentMethod} 
    />
  </div>
);

export default OrderConfirmation;

"use client";
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrder } from '../../../Pos/State/OrderProvider';

/**
 * Updated OrderItemsList component with scrolling functionality
 */
export const OrderItemsList = () => {
  const { orderState, updateItemQuantity, removeItem, calculateTotals } = useOrder();
  const { selectedItems } = orderState;

  const handleQuantityChange = (index, change) => {
    updateItemQuantity(index, change);
    calculateTotals();
  };

  const handleRemoveItem = (index) => {
    removeItem(index);
    calculateTotals();
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-white z-10 mb-4">
        <div className="flex text-left text-sm font-semibold text-gray-700">
          <div className="flex-1 pb-2">Items</div>
          <div className="w-20 pb-2">Qty</div>
          <div className="w-24 pb-2">Price</div>
          <div className="w-8 pb-2"></div>
        </div>
      </div>
      
      {/* Scrollable Items List */}
      <div className="flex-1 overflow-y-auto space-y-2" style={{ maxHeight: 'calc(100% - 30px)' }}>
        <AnimatePresence mode="popLayout">
          {selectedItems && selectedItems.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center p-3"
              style={{
                border: '1px solid #D7D7D7',
                borderRadius: '10px',
                boxSizing: 'border-box',
                minHeight: '50px',
                backgroundColor: 'white'
              }}
            >
                {/* Items Column */}
                <div className="flex-1 flex items-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ objectFit: "contain" }}
                      className="w-8 h-8 mr-2 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 mr-2 rounded-full flex items-center justify-center bg-gray-200">
                      <span className="text-sm font-bold">
                        {item.name ? item.name.split(" ")[0][0].toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                    <div>
                      <div className="font-semibold capitalize">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {[...item.stainDamage, ...item.physicalDamage].join(', ')}
                      </div>
                      <div className="flex items-center mt-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                </div>

                {/* Qty Column */}
                <div className="w-20 flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(index, -1)}
                      className="flex items-center justify-center"
                      disabled={item.quantity <= 1}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '0.5px solid #D7D7D7',
                        borderRadius: '2px',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        opacity: item.quantity <= 1 ? 0.5 : 1
                      }}
                    >
                      <Minus 
                        size={12} 
                        className={item.quantity <= 1 ? 'text-gray-300' : 'text-gray-700'}
                      />
                    </motion.button>
                    <motion.span 
                      className="min-w-[20px] text-center font-medium"
                      key={item.quantity}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      {item.quantity}
                    </motion.span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleQuantityChange(index, 1)}
                      className="flex items-center justify-center"
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '0.5px solid #D7D7D7',
                        borderRadius: '2px',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus 
                        size={12} 
                        className="text-gray-700"
                      />
                    </motion.button>
                  </div>
                </div>

                {/* Price Column */}
                <div className="w-24 flex items-center justify-center">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={item.price * item.quantity}
                    className="font-medium"
                  >
                    $ {(item.price * item.quantity).toFixed(2)}
                  </motion.span>
                </div>

                {/* Action Column */}
                <div className="w-8 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1, color: '#ff0000' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
          ))}
        </AnimatePresence>
        {(!selectedItems || selectedItems.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            No items added yet
          </div>
        )}
      </div>
    </div>
  );
};

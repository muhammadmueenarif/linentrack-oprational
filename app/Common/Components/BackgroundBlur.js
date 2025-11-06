"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BackgroundBlur = ({ isActive, children }) => {
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0, 
      padding: 0, 
      width: '100%', 
      height: '100%',
      overflow: 'hidden'
    }}>
      <motion.div
        animate={{
          filter: isActive ? 'blur(8px)' : 'blur(0px)',
          opacity: isActive ? 0.7 : 1
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        className="transition-all duration-300"
        style={{ 
          margin: 0, 
          padding: 0, 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }}
      >
        {children}
      </motion.div>
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none z-10"
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackgroundBlur;





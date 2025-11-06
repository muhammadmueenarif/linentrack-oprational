"use client";
import * as React from "react";
import { X } from "lucide-react";

export function Dialog({ children, className, open, onOpenChange, showClose = true, unstyled = false, outerPaddingClass = "p-4 sm:p-6" }) {
  if (!open) return null;

  return (
    <div  className={`fixed inset-0 z-50 flex items-center justify-center ${outerPaddingClass}`}>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)} 
      />
      <div className={`${unstyled ? 'relative' : 'relative bg-white rounded-2xl shadow-xl'} ${className}`}>
        {children}
        {showClose && (
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function DialogContent({ children, className, noPadding = false, ...props }) {
  return (
    <div className={`${noPadding ? '' : 'px-6 pb-6 pt-2'} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className, ...props }) {
  return (
    <div className={`px-6 pt-6 pb-2 flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({ children, className, ...props }) {
  return (
    <div className={`px-6 pb-6 pt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className, ...props }) {
  return (
    <h2 className={`text-xl font-semibold tracking-tight text-gray-900 ${className}`} {...props}>
      {children}
    </h2>
  );
}
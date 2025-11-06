import React from "react";

export function Button({ 
  children, 
  variant = "default", 
  size = "default", 
  className = "", 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-blue-900 text-white hover:bg-blue-800",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
    ghost: "hover:bg-gray-100",
    warning: "bg-yellow-400 text-white hover:bg-yellow-500",
    link: "text-blue-600 underline-offset-4 hover:underline",
    unstyled: ""
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6",
    icon: "h-10 w-10"
  };

  const selectedVariant = variants[variant] ?? variants.default;
  const classes = `${baseStyles} ${selectedVariant} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
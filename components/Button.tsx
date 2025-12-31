
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider text-xs";
  
  const variants = {
    primary: "bg-[#00ff41] text-black hover:bg-[#00cc33] shadow-[0_0_15px_rgba(0,255,65,0.4)] hover:shadow-[0_0_20px_rgba(0,255,65,0.6)] font-bold",
    secondary: "bg-white/5 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/10 backdrop-blur-md",
    danger: "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <i className="fa-solid fa-circle-notch animate-spin"></i>}
      {children}
    </button>
  );
};

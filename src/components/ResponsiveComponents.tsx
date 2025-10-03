"use client";

import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
}

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = "",
}: ResponsiveGridProps) {
  const gridCols = [
    cols.default ? `grid-cols-${cols.default}` : "",
    cols.sm ? `sm:grid-cols-${cols.sm}` : "",
    cols.md ? `md:grid-cols-${cols.md}` : "",
    cols.lg ? `lg:grid-cols-${cols.lg}` : "",
    cols.xl ? `xl:grid-cols-${cols.xl}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`grid ${gridCols} gap-${gap} ${className}`}>{children}</div>
  );
}

export function ResponsiveCard({
  children,
  className = "",
  padding = "md",
  shadow = "md",
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  return (
    <div
      className={`
      bg-white rounded-lg border border-gray-200 
      ${paddingClasses[padding]} 
      ${shadowClasses[shadow]} 
      ${className}
    `}
    >
      {children}
    </div>
  );
}

export function ResponsiveTable({
  children,
  className = "",
  striped = true,
  hoverable = true,
}: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table
            className={`
            min-w-full divide-y divide-gray-300
            ${className}
          `}
          >
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

// Responsive utility components
export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <div className="block md:hidden">{children}</div>;
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}

export function TabletUp({ children }: { children: React.ReactNode }) {
  return <div className="hidden sm:block">{children}</div>;
}

export function MobileTablet({ children }: { children: React.ReactNode }) {
  return <div className="block lg:hidden">{children}</div>;
}

// Responsive button component
interface ResponsiveButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  fullWidth?: boolean;
  mobileFullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ResponsiveButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  mobileFullWidth = false,
  className = "",
  onClick,
  disabled = false,
  type = "button",
}: ResponsiveButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  };

  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm sm:text-base",
    lg: "px-6 py-3 text-base sm:text-lg",
  };

  const widthClasses = fullWidth
    ? "w-full"
    : mobileFullWidth
    ? "w-full sm:w-auto"
    : "w-auto";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// Responsive form components
interface ResponsiveInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  className?: string;
  fullWidth?: boolean;
}

export function ResponsiveInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  className = "",
  fullWidth = true,
}: ResponsiveInputProps) {
  return (
    <div className={fullWidth ? "w-full" : "w-auto"}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`
          block w-full rounded-md border-gray-300 shadow-sm 
          focus:border-blue-500 focus:ring-blue-500
          text-sm sm:text-base px-3 py-2
          ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : ""
          }
          ${className}
        `}
      />
      {error && <p className="mt-1 text-xs sm:text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Responsive modal component
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}: ResponsiveModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md sm:max-w-lg",
    lg: "max-w-lg sm:max-w-2xl",
    xl: "max-w-xl sm:max-w-4xl",
    full: "max-w-full mx-4 sm:mx-8",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div
          className={`
          relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
          w-full ${sizeClasses[size]} ${className}
        `}
        >
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            {title && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 sm:text-xl">
                  {title}
                </h3>
              </div>
            )}

            <div className="mt-2">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";

export interface ToastProps {
  message: string;
  type: "success" | "error";
  duration?: number;
  onClose: () => void;
  show: boolean;
}

export default function Toast({
  message,
  type,
  duration = 4000,
  onClose,
  show,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show && !isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-gradient-to-r from-green-500 to-green-600"
      : "bg-gradient-to-r from-red-500 to-red-600";

  const icon =
    type === "success" ? (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ) : (
      <svg
        className="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] transition-all duration-300 transform ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Hook para usar toast más fácilmente
export function useToast() {
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const showSuccess = (message: string) => showToast(message, "success");
  const showError = (message: string) => showToast(message, "error");

  return {
    toast,
    showSuccess,
    showError,
    hideToast,
  };
}

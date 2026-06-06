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
        setTimeout(onClose, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show && !isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
      : "bg-gradient-to-r from-red-500 to-red-600";

  const icon =
    type === "success" ? (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );

  return (
    <div className="fixed top-4 right-4 z-[99999]">
      <div
        className={`${bgColor} text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-[420px] transition-all duration-300 transform ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          {message.includes("\n") ? (
            <ul className="font-medium text-sm list-disc list-inside space-y-0.5">
              {message.split("\n").map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="font-medium text-sm">{message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

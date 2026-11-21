"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export default function BackButton({ href, label = "Volver", onClick }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      className="btn-primary bg-slate-800 text-white hover:bg-slate-900 shadow-lg shadow-slate-800/20 sm:w-auto"
      onClick={handleClick}
      aria-label={label}
    >
      <ChevronLeft className="w-5 h-5" />
      {label}
    </button>
  );
}

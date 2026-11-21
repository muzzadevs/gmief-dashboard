import React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/** Empty state with icon, title, description and optional action button. */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/40" />
      </div>
      <h3 className="text-lg font-semibold text-white/70">{title}</h3>
      {description && (
        <p className="text-sm text-white/50 mt-2 max-w-sm">{description}</p>
      )}
      {action && (
        <button
          type="button"
          className="btn-primary bg-blue-600 text-white hover:bg-blue-700 mt-5"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeSearchText } from "@/lib/search";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

export default function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecciona una opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  searchable = true,
  disabled = false,
  className,
  id,
  name,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const listId = React.useId();

  const selectedLabel = React.useMemo(() => {
    const found = options.find((opt) => opt.value === value);
    return found?.label ?? "";
  }, [options, value]);

  return (
    <>
      {/* Hidden native input for form compatibility */}
      {name && <input type="hidden" name={name} value={value} />}

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild disabled={disabled}>
          <button
            type="button"
            role="combobox"
            aria-controls={listId}
            aria-expanded={open}
            aria-label={ariaLabel}
            id={id}
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between",
              "bg-[rgba(255,255,255,0.95)] border border-[rgba(203,213,225,0.6)]",
              "rounded-xl px-4 py-2.5 text-[0.9375rem] text-slate-900",
              "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
              "outline-none transition-all duration-200",
              "hover:border-slate-400 hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]",
              "focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[rgba(203,213,225,0.6)]",
              "cursor-pointer",
              className
            )}
          >
            <span className={cn("truncate", !selectedLabel && "text-slate-400")}>
              {selectedLabel || placeholder}
            </span>
            <ChevronDown
              className={cn(
                "ml-2 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                open && "rotate-180 text-blue-500"
              )}
            />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            className={cn(
              "z-[9999] w-[var(--radix-popover-trigger-width)]",
              "bg-white/95 backdrop-blur-xl",
              "border border-slate-200/80 rounded-xl",
              "shadow-[0_12px_40px_rgba(0,0,0,0.12)]",
              "overflow-hidden",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2",
              "duration-200"
            )}
          >
            <CommandPrimitive
              shouldFilter={searchable}
              filter={(value, search) => {
                return normalizeSearchText(value).includes(normalizeSearchText(search)) ? 1 : 0;
              }}
              className="flex flex-col"
            >
              {searchable && (
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <CommandPrimitive.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder={searchPlaceholder}
                    className={cn(
                      "w-full bg-transparent text-sm text-slate-800",
                      "outline-none placeholder:text-slate-400"
                    )}
                  />
                </div>
              )}

              {/* Options list */}
              <CommandPrimitive.List id={listId} className="max-h-[240px] overflow-y-auto overscroll-contain p-1.5">
                <CommandPrimitive.Empty className="py-6 text-center text-sm text-slate-400">
                  {emptyMessage}
                </CommandPrimitive.Empty>

                {options.map((option) => (
                  <CommandPrimitive.Item
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer",
                      "transition-colors duration-150",
                      "text-slate-700",
                      "data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700",
                      "hover:bg-slate-50",
                      option.value === value && "bg-blue-50/70 text-blue-700 font-medium"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 transition-opacity",
                        option.value === value
                          ? "opacity-100 text-blue-600"
                          : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}

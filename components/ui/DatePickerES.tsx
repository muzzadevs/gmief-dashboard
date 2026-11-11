"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatearFechaES } from "@/lib/candidatoUtils";

type Props = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
};

type MonthCursor = {
  year: number;
  month: number;
};

const WEEKDAYS = [
  { short: "L", full: "Lunes" },
  { short: "M", full: "Martes" },
  { short: "X", full: "Miércoles" },
  { short: "J", full: "Jueves" },
  { short: "V", full: "Viernes" },
  { short: "S", full: "Sábado" },
  { short: "D", full: "Domingo" },
];

const MONTH_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "full",
  timeZone: "UTC",
});

function monthOf(date: Date): MonthCursor {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1000 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseSpanishDate(value: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1000 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${yearText}-${monthText.padStart(2, "0")}-${dayText.padStart(2, "0")}`;
}

function monthLabel(cursor: MonthCursor): string {
  const label = MONTH_FORMATTER.format(
    new Date(Date.UTC(cursor.year, cursor.month, 1))
  );
  return label.charAt(0).toLocaleUpperCase("es-ES") + label.slice(1);
}

export default function DatePickerES({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  className = "input-glass w-full",
  required = false,
  disabled = false,
}: Props) {
  const controlled = value !== undefined;
  const currentValue = controlled ? value : defaultValue;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = controlled ? currentValue : internalValue;
  const selectedDate = parseIsoDate(selectedValue);
  const [draft, setDraft] = useState(() =>
    selectedValue ? formatearFechaES(selectedValue.slice(0, 10)) : ""
  );
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<MonthCursor>(() =>
    monthOf(selectedDate ?? new Date())
  );
  const lastValue = useRef(selectedValue);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!controlled || selectedValue === lastValue.current) return;
    lastValue.current = selectedValue;
    setDraft(selectedValue ? formatearFechaES(selectedValue.slice(0, 10)) : "");
    setInvalid(false);
  }, [controlled, selectedValue]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const monthDays = useMemo(() => {
    const firstWeekday = new Date(
      Date.UTC(visibleMonth.year, visibleMonth.month, 1)
    ).getUTCDay();
    const offset = (firstWeekday + 6) % 7;
    const daysInMonth = new Date(
      Date.UTC(visibleMonth.year, visibleMonth.month + 1, 0)
    ).getUTCDate();
    return Array.from({ length: offset + daysInMonth }, (_, index) =>
      index < offset ? null : index - offset + 1
    );
  }, [visibleMonth]);

  const commitValue = (nextValue: string) => {
    lastValue.current = nextValue;
    if (!controlled) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDraft = event.target.value.slice(0, 10);
    const parsedDate = parseSpanishDate(nextDraft);
    setDraft(parsedDate ? formatearFechaES(parsedDate) : nextDraft);
    setInvalid(false);
    commitValue(parsedDate ?? "");
    if (parsedDate) {
      const parsed = parseIsoDate(parsedDate);
      if (parsed) setVisibleMonth(monthOf(parsed));
    }
  };

  const selectDate = (date: Date) => {
    const nextValue = date.toISOString().slice(0, 10);
    setDraft(formatearFechaES(nextValue));
    setInvalid(false);
    commitValue(nextValue);
    setOpen(false);
  };

  const clearDate = () => {
    setDraft("");
    setInvalid(false);
    commitValue("");
    setOpen(false);
  };

  const openCalendar = () => {
    setVisibleMonth(monthOf(selectedDate ?? new Date()));
    setOpen(true);
  };

  const today = new Date().toISOString().slice(0, 10);
  const selectedIso = selectedValue.slice(0, 10);

  return (
    <div ref={containerRef} className="relative w-full">
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/AAAA"
        value={draft}
        onChange={handleTextChange}
        onFocus={openCalendar}
        onBlur={() => setInvalid(draft.trim() !== "" && !parseSpanishDate(draft))}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        aria-haspopup="dialog"
        aria-required={required}
        aria-invalid={invalid}
        disabled={disabled}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        aria-label="Abrir calendario"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={openCalendar}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed"
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
      </button>

      {invalid && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          Escribe una fecha válida en formato DD/MM/AAAA.
        </p>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Calendario"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() =>
                setVisibleMonth((cursor) => {
                  const date = new Date(
                    Date.UTC(cursor.year, cursor.month - 1, 1)
                  );
                  return monthOf(date);
                })
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="font-semibold text-slate-800">
              {monthLabel(visibleMonth)}
            </p>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() =>
                setVisibleMonth((cursor) => {
                  const date = new Date(
                    Date.UTC(cursor.year, cursor.month + 1, 1)
                  );
                  return monthOf(date);
                })
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 text-center text-xs text-slate-500">
            {WEEKDAYS.map((day) => (
              <span key={day.full} aria-label={day.full} className="py-1 font-medium">
                {day.short}
              </span>
            ))}
            {monthDays.map((day, index) => {
              if (day === null) {
                return <span key={`empty-${index}`} aria-hidden="true" />;
              }
              const date = new Date(
                Date.UTC(visibleMonth.year, visibleMonth.month, day)
              );
              const iso = date.toISOString().slice(0, 10);
              const isSelected = iso === selectedIso;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  aria-label={FULL_DATE_FORMATTER.format(date)}
                  aria-pressed={isSelected}
                  onClick={() => selectDate(date)}
                  className={`m-0.5 h-8 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-600 font-semibold text-white"
                      : isToday
                        ? "border border-blue-300 text-blue-700 hover:bg-blue-50"
                        : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
            <button
              type="button"
              onClick={clearDate}
              disabled={!selectedValue}
              className="rounded px-2 py-1 text-blue-700 hover:bg-blue-50 disabled:text-slate-400"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date(`${today}T00:00:00.000Z`))}
              className="rounded px-2 py-1 text-blue-700 hover:bg-blue-50"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

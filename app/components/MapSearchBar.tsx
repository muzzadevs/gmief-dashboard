"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, MapPin, Church } from "lucide-react";
import { searchIncludes } from "@/lib/search";

type IglesiaMapa = {
  id: number;
  nombre: string;
  direccion: string | null;
  municipio: string | null;
  provincia: string | null;
  cp: number | null;
  latitud: number;
  longitud: number;
  zona: { nombre: string } | null;
  subzona: { nombre: string } | null;
};

interface MapSearchBarProps {
  iglesias: IglesiaMapa[];
  onSelect: (iglesia: IglesiaMapa) => void;
}

export default function MapSearchBar({ iglesias, onSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length > 0
    ? iglesias.filter((ig) =>
        searchIncludes(ig.nombre, query) ||
        (ig.municipio && searchIncludes(ig.municipio, query)) ||
        (ig.provincia && searchIncludes(ig.provincia, query)) ||
        (ig.zona?.nombre && searchIncludes(ig.zona.nombre, query))
      ).slice(0, 50)
    : [];

  const showDropdown = isOpen && query.trim().length > 0;

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length, query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && showDropdown) {
      const items = listRef.current.querySelectorAll("[data-search-item]");
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((iglesia: IglesiaMapa) => {
    setQuery("");
    setIsOpen(false);
    onSelect(iglesia);
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  function buildSubtitle(ig: IglesiaMapa): string {
    const parts: string[] = [];
    if (ig.municipio) parts.push(ig.municipio);
    if (ig.provincia) parts.push(ig.provincia);
    if (ig.zona?.nombre) parts.push(ig.zona.nombre);
    return parts.join(" · ");
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-3 left-20 right-6 z-[1001] w-auto sm:left-20 "
    >
      {/* Search Input */}
      <div className="relative h-12">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar iglesia..."
          className="h-12 w-full pl-10 pr-9 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-lg shadow-black/10 transition-all duration-200 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15),0_8px_24px_rgba(0,0,0,0.12)]"
          autoComplete="off"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={listRef}
          className="mt-1.5 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] max-h-[320px] overflow-y-auto overscroll-contain animate-fadein"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Church className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                No se encontraron iglesias
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Prueba con otro término de búsqueda
              </p>
            </div>
          ) : (
            <div className="p-1.5">
              {filtered.map((iglesia, index) => {
                const subtitle = buildSubtitle(iglesia);
                return (
                  <button
                    key={iglesia.id}
                    type="button"
                    data-search-item
                    onClick={() => handleSelect(iglesia)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors duration-150 ${
                      index === selectedIndex
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <MapPin
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        index === selectedIndex
                          ? "text-blue-500"
                          : "text-slate-300"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {iglesia.nombre}
                      </div>
                      {subtitle && (
                        <div
                          className={`text-xs truncate mt-0.5 ${
                            index === selectedIndex
                              ? "text-blue-500/70"
                              : "text-slate-400"
                          }`}
                        >
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-100 text-[10px] text-slate-400 text-center">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} · Usa ↑↓ para navegar, Enter para seleccionar
            </div>
          )}
        </div>
      )}
    </div>
  );
}

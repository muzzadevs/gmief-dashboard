import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Zona } from "@/types/zonas";

type State = {
  zonas: Zona[];
  zonaSelected: Zona | null;
};

type Actions = {
  setZonas: (zs: Zona[]) => void;
  setSelectedById: (id: number) => void;
  setSelected: (zona: Zona | null) => void;
  clear: () => void;
};

export const useZonasStore = create<State & Actions>()(
  devtools((set, get) => ({
    zonas: [],
    zonaSelected: null,

    setZonas: (zs) => set({ zonas: zs }, false, "setZonas"),

    setSelectedById: (id) => {
      const zona = get().zonas.find((z) => z.id === id) || null;
      set({ zonaSelected: zona }, false, "setSelectedById");
    },

    setSelected: (zona) => set({ zonaSelected: zona }, false, "setSelected"),

    clear: () => set({ zonas: [], zonaSelected: null }, false, "clear"),
  }))
);

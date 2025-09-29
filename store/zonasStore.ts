import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Zona } from "@/types/zonas";
import type { Subzona, Iglesia } from "@/types/subzonas";

interface State {
  zonas: Zona[];
  zonaSelected: Zona | null;
  subzonas: Subzona[];
  subzonaSelected: Subzona | null;
  iglesias: Iglesia[];
  iglesiaSelected: Iglesia | null;
  ministerioEditId: number | null;
}

interface Actions {
  setZonas: (zs: Zona[]) => void;
  setZonaSelected: (zona: Zona | null) => void;
  setSubzonas: (szs: Subzona[]) => void;
  setSubzonaSelected: (subzona: Subzona | null) => void;
  setIglesias: (igs: Iglesia[]) => void;
  setIglesiaSelected: (iglesia: Iglesia | null) => void;
  fetchSubzonas: (zonaId: number) => Promise<void>;
  fetchIglesias: (zonaId: number, subzonaId?: number | null) => Promise<void>;
  setMinisterioEditId: (id: number | null) => void;
  clearMinisterioEditId: () => void;
}

export const useZonasStore = create<State & Actions>()(
  devtools((set, get) => ({
    zonas: [],
    zonaSelected: null,
    subzonas: [],
    subzonaSelected: null,
    iglesias: [],
    iglesiaSelected: null,
    ministerioEditId: null,

    setZonas: (zs) => set({ zonas: zs }, false, "setZonas"),
    setZonaSelected: (zona) =>
      set(
        { zonaSelected: zona, subzonaSelected: null },
        false,
        "setZonaSelected"
      ),
    setSubzonas: (szs) => set({ subzonas: szs }, false, "setSubzonas"),
    setSubzonaSelected: (subzona) =>
      set({ subzonaSelected: subzona }, false, "setSubzonaSelected"),
    setIglesias: (igs) => set({ iglesias: igs }, false, "setIglesias"),
    setIglesiaSelected: (iglesia) =>
      set({ iglesiaSelected: iglesia }, false, "setIglesiaSelected"),

    setMinisterioEditId: (id) =>
      set({ ministerioEditId: id }, false, "setMinisterioEditId"),
    clearMinisterioEditId: () =>
      set({ ministerioEditId: null }, false, "clearMinisterioEditId"),

    fetchSubzonas: async (zonaId) => {
      const res = await fetch(`/api/subzonas?zonaId=${zonaId}`);
      const data = await res.json();
      set({ subzonas: data }, false, "fetchSubzonas");
    },
    fetchIglesias: async (zonaId, subzonaId) => {
      let url = `/api/iglesias?zonaId=${zonaId}`;
      if (subzonaId) url += `&subzonaId=${subzonaId}`;
      const res = await fetch(url);
      const data = await res.json();
      set({ iglesias: data }, false, "fetchIglesias");
    },
  }))
);

import { create } from "zustand";

const VAULT_KEY = "__fc_vault";
const VAULT_VALUE = "v_unlocked_9x";
const ADMIN_TOKEN = "fc-admin-8k2m9x";

interface AdminState {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
  checkSession: () => boolean;
  getToken: () => string;
}

export const useAdminStore = create<AdminState>((set) => ({
  isUnlocked: false,

  unlock: () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(VAULT_KEY, VAULT_VALUE);
    }
    set({ isUnlocked: true });
  },

  lock: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(VAULT_KEY);
    }
    set({ isUnlocked: false });
  },

  checkSession: () => {
    if (typeof window !== "undefined") {
      const val = sessionStorage.getItem(VAULT_KEY);
      const unlocked = val === VAULT_VALUE;
      set({ isUnlocked: unlocked });
      return unlocked;
    }
    return false;
  },

  getToken: () => ADMIN_TOKEN,
}));

export { ADMIN_TOKEN };

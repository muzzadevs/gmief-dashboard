import { create } from "zustand";

const VAULT_KEY = "__fc_vault";
const VAULT_VALUE = "v_unlocked_9x";
const ADMIN_TOKEN = "fc-admin-8k2m9x";
const ADMIN_RETURN_PATH_KEY = "__fc_admin_return_path";

interface AdminState {
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
  checkSession: () => boolean;
  getToken: () => string;
  setReturnPath: (path: string) => void;
  popReturnPath: () => string | null;
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

  setReturnPath: (path: string) => {
    if (typeof window === "undefined") return;
    if (!path || path === "/admin") return;
    sessionStorage.setItem(ADMIN_RETURN_PATH_KEY, path);
  },

  popReturnPath: () => {
    if (typeof window === "undefined") return null;
    const path = sessionStorage.getItem(ADMIN_RETURN_PATH_KEY);
    if (path) {
      sessionStorage.removeItem(ADMIN_RETURN_PATH_KEY);
    }
    return path;
  },
}));

export { ADMIN_TOKEN };

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Page =
  | "connect"
  | "device"
  | "mirror"
  | "apps"
  | "files"
  | "logcat"
  | "shell"
  | "screenshot"
  | "apk-tools"
  | "quick-actions"
  | "settings"
  | "dev-tools";

type Toast = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
};

type Modal = {
  type: "connection" | "confirm" | "apk-install" | null;
  props?: Record<string, unknown>;
};

type UiState = {
  currentPage: Page;
  sidebarCollapsed: boolean;
  toasts: Toast[];
  modal: Modal;
  isSetupComplete: boolean;

  setCurrentPage: (page: Page) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  openModal: (type: Modal["type"], props?: Modal["props"]) => void;
  closeModal: () => void;

  setSetupComplete: (complete: boolean) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      currentPage: "connect",
      sidebarCollapsed: false,
      toasts: [],
      modal: { type: null },
      isSetupComplete: false,

      setCurrentPage: (currentPage) => set({ currentPage }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      addToast: (toast) => {
        const id = `toast-${Date.now()}`;
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

        setTimeout(() => {
          get().removeToast(id);
        }, 5000);
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      openModal: (type, props) => set({ modal: { type, props } }),

      closeModal: () => set({ modal: { type: null } }),

      setSetupComplete: (isSetupComplete) => set({ isSetupComplete }),
    }),
    {
      name: "adb-companion-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isSetupComplete: state.isSetupComplete }),
    }
  )
);

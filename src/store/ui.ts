import { create } from "zustand";

export type GameStage = 1 | 2 | 3 | 4 | 5 | 6;
export type DesignTab = "payload" | "bus" | "power" | "propulsion" | "avionics" | "thermal" | "comms";
export type MobilePane = "catalog" | "viewport" | "dashboard" | "advisor";

export interface ToastItem {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
}

export interface UIState {
  currentStage: GameStage;
  maxUnlockedStage: GameStage;
  designTab: DesignTab;
  mobilePane: MobilePane;
  advisorExpanded: boolean;
  activeModal: string | null;
  activeTermId: string | null;
  launchInProgress: boolean;
  toasts: ToastItem[];

  setCurrentStage: (stage: GameStage) => void;
  unlockStage: (stage: GameStage) => void;
  setDesignTab: (tab: DesignTab) => void;
  setMobilePane: (pane: MobilePane) => void;
  setAdvisorExpanded: (expanded: boolean) => void;
  setActiveModal: (modalId: string | null) => void;
  setActiveTermId: (termId: string | null) => void;
  setLaunchInProgress: (inProgress: boolean) => void;
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentStage: 1,
  maxUnlockedStage: 1,
  designTab: "payload",
  mobilePane: "viewport",
  advisorExpanded: false,
  activeModal: null,
  activeTermId: null,
  launchInProgress: false,
  toasts: [],

  setCurrentStage: (stage) =>
    set((state) => ({
      maxUnlockedStage: Math.max(state.maxUnlockedStage, stage) as GameStage,
      currentStage: stage,
    })),

  unlockStage: (stage) =>
    set((state) => ({
      maxUnlockedStage: Math.max(state.maxUnlockedStage, stage) as GameStage,
    })),

  setDesignTab: (tab) => set({ designTab: tab }),
  setMobilePane: (pane) => set({ mobilePane: pane }),
  setAdvisorExpanded: (expanded) => set({ advisorExpanded: expanded }),
  setActiveModal: (modalId) => set({ activeModal: modalId }),
  setActiveTermId: (termId) => set({ activeTermId: termId }),
  setLaunchInProgress: (inProgress) => set({ launchInProgress: inProgress }),

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

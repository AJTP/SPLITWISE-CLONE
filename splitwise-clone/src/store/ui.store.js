import { create } from "zustand";

let nextId = 1;

const useUIStore = create((set) => ({
  toasts: [],

  showToast: (message, type = "info") => {
    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export default useUIStore;

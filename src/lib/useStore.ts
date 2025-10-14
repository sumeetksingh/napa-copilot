import { create } from "zustand";

export type Filters = { categories: string[] };

type StoreState = {
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  highlight?: string;
  setHighlight: (c?: string) => void;
  subtitle?: string;
  setSubtitle: (s?: string) => void;
};

export const useStore = create<StoreState>((set) => ({
  filters: { categories: [] },
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setHighlight: (c) => set({ highlight: c }),
  setSubtitle: (s) => set({ subtitle: s }),
}));

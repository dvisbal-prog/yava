import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AccessState {
  /** El invitado ya vio la pantalla de acceso (02): entró o tocó "Omitir". */
  seenAccess: boolean;
  /** true cuando AsyncStorage terminó de cargar (antes de eso seenAccess no es confiable). */
  hydrated: boolean;
  markSeen: () => void;
  setHydrated: () => void;
}

export const useAccess = create<AccessState>()(
  persist(
    (set) => ({
      seenAccess: false,
      hydrated: false,
      markSeen: () => set({ seenAccess: true }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "yava-access",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ seenAccess: s.seenAccess }),
      // Se llama al terminar la carga, con o sin error: nunca dejamos la app esperando.
      onRehydrateStorage: (initial) => () => { initial.setHydrated(); },
    },
  ),
);

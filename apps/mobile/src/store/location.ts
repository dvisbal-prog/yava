import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Address } from "@yava/shared";

interface LocationState {
  /** Dirección de entrega seleccionada (snapshot). */
  address: Address | null;
  coords: { lat: number; lng: number } | null;
  cityId: string | null;
  cityName: string | null;
  setAddress: (a: Address | null) => void;
  setCoords: (c: { lat: number; lng: number } | null) => void;
  setCity: (id: string | null, name: string | null) => void;
}

export const useLocation = create<LocationState>()(
  persist(
    (set) => ({
      address: null, coords: null, cityId: null, cityName: null,
      setAddress: (address) => set({ address, cityId: address?.city_id ?? null }),
      setCoords: (coords) => set({ coords }),
      setCity: (cityId, cityName) => set({ cityId, cityName }),
    }),
    { name: "yava-location", storage: createJSONStorage(() => AsyncStorage) }
  )
);

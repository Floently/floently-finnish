import { create } from "zustand";

type NetworkState = {
  isOffline: boolean;
  startMonitoring: () => () => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOffline: false,

  startMonitoring() {
    function handleOnline() {
      set({ isOffline: false });
    }
    function handleOffline() {
      set({ isOffline: true });
    }

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      set({ isOffline: !window.navigator.onLine });
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    return () => undefined;
  },
}));

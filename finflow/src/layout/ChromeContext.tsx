import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from "react";
import { Platform, useWindowDimensions } from "react-native";

export type ViewMode = "phone" | "desktop";

type Chrome = {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  wide: boolean;
};

const ChromeContext = createContext<Chrome | null>(null);

export function ChromeProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [mode, setMode] = useState<ViewMode>(Platform.OS === "web" && wide ? "phone" : "phone");

  const value = useMemo<Chrome>(
    () => ({
      mode: Platform.OS === "web" && wide ? mode : "phone",
      setMode,
      wide: Platform.OS === "web" && wide,
    }),
    [mode, wide],
  );

  return createElement(ChromeContext.Provider, { value }, children);
}

export function useChrome() {
  const ctx = useContext(ChromeContext);
  if (!ctx) {
    throw new Error("useChrome must be used inside ChromeProvider");
  }
  return ctx;
}

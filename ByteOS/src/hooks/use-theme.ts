import { useEffect } from "react";

export function useDarkTheme() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
}

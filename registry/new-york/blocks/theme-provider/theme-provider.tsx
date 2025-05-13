'use client';

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useState } from 'react';

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return (
    mounted && <NextThemesProvider {...props}>{children}</NextThemesProvider>
  );
};
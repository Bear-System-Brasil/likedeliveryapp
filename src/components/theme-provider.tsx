"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * `attribute="class"` casa com `darkMode: "class"` do tailwind.config.ts e
 * com as variáveis `.dark { ... }` já definidas em globals.css - essa parte
 * da infra já existia, só nunca tinha sido ligada a um provider de verdade.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

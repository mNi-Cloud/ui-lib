'use client'

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useSidebar } from "@/registry/new-york/ui/sidebar";
import { BreadcrumbNav } from "@/registry/new-york/blocks/breadcrumb/breadcrumb";

interface ContentProps {
  children: React.ReactNode;
}

export function Content({ children }: ContentProps) {
  const { open: isSidebarVisible } = useSidebar();
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [maxWidth, setMaxWidth] = useState<number | undefined>();

  const updateLayout = useCallback(() => {
    const windowWidth = window.innerWidth;
    const isSmall = windowWidth <= 768;
    setIsSmallScreen(isSmall);
    setMaxWidth(
      !isSmall && isSidebarVisible ? windowWidth - 256 : undefined
    );
  }, [isSidebarVisible]);

  useEffect(() => {
    updateLayout();
  }, [updateLayout]);

  useEffect(() => {
    window.addEventListener("resize", updateLayout);
    return () => {
      window.removeEventListener("resize", updateLayout);
    };
  }, [updateLayout]);

  return (
    <div
      style={
        !isSmallScreen && maxWidth ? { maxWidth: `${maxWidth}px` } : undefined
      }
      className={`p-4 transition-all duration-200 ${
        isSmallScreen
          ? "w-screen"
          : !isSidebarVisible
          ? "w-full"
          : ""
      }`}
    >
      <BreadcrumbNav />
      <div>{children}</div>
    </div>
  );
}
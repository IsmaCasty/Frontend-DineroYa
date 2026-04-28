// Hook tipado para consumir SidebarContext. Lanza error si no hay provider.
"use client";
import { useContext } from "react";
import { SidebarContext } from "./sidebar-context";

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar debe usarse dentro de <SidebarProvider>");
  }
  return ctx;
}
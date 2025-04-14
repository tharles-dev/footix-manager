"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface AdminContextType {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    console.log("Alterando estado do menu mobile...");
    setIsMobileMenuOpen((prev) => {
      console.log("Estado anterior:", prev);
      console.log("Novo estado:", !prev);
      return !prev;
    });
  };

  const closeMobileMenu = () => {
    console.log("Fechando menu mobile...");
    setIsMobileMenuOpen(false);
  };

  return (
    <AdminContext.Provider
      value={{
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin deve ser usado dentro de um AdminProvider");
  }
  return context;
}

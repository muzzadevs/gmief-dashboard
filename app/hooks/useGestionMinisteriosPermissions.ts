"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const MODULE_HREF = "/modulos/gestion-ministerios";

interface Modulo {
  id: number;
  href: string;
}

export function useGestionMinisteriosPermissions() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [moduleLoaded, setModuleLoaded] = useState(false);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    let active = true;

    fetch("/api/modulos")
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudieron cargar los permisos del módulo");
        const result = await response.json();
        const gestionModulo = (result.data as Modulo[] | undefined)?.find(
          (item) => item.href === MODULE_HREF
        );
        if (active) {
          setModuleId(gestionModulo?.id ?? null);
          setModuleLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.error("[useGestionMinisteriosPermissions] Error:", error);
        if (active) {
          setModuleId(null);
          setModuleLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const permissions = moduleId === null ? [] : user?.permisos[moduleId] ?? [];
  const isSuperAdmin = user?.isSuperAdmin ?? false;

  return {
    ready: moduleLoaded && !isLoading,
    canView: isSuperAdmin || permissions.includes("ver"),
    canEdit: isSuperAdmin || permissions.includes("editar"),
    canDelete: isSuperAdmin || permissions.includes("borrar"),
  };
}

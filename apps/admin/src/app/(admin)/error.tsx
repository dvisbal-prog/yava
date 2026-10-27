"use client";

import { useEffect } from "react";
import { CloudOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, ButtonLink } from "@/components/ui/button";

/** Error de carga dentro del panel (p. ej. un resumen que el servidor rechazó). Mantiene menú y barra superior. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <EmptyState
        icon={CloudOff}
        title="No pudimos cargar esta sección"
        description="Puede que tu rol no tenga permiso para estos datos o que haya un problema de conexión. Inténtalo de nuevo."
        action={
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={() => reset()}>
                Reintentar
              </Button>
              <ButtonLink href="/" variant="outline">
                Volver al panorama
              </ButtonLink>
            </div>
            {error.digest ? <span className="text-xs text-gray-400">Código: {error.digest}</span> : null}
          </div>
        }
      />
    </div>
  );
}

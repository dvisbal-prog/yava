import React from "react";
import { EmptyState } from "@/components/ui";
import { ErrorState } from "@/components/merchant/Rows";
import { openAdmin } from "@/features/owner/links";
import { errorMessage, isUnauthorized } from "@/lib/errors";

/**
 * Error de admin_overview. Si el backend responde 'No autorizado' (rol sin permiso o acceso revocado)
 * se muestra un estado amable con salida al panel web; cualquier otro error permite reintentar.
 */
export function OverviewError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (isUnauthorized(error)) {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title="No tienes acceso a estas cifras"
        body="Tu usuario no tiene permiso para ver el resumen de la plataforma. Pídele acceso a un owner o revisa el panel web."
        actionTitle="Abrir panel web"
        onAction={() => { void openAdmin(); }}
      />
    );
  }
  return <ErrorState message={errorMessage(error)} onRetry={onRetry} />;
}

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Número de cuenta enmascarado ("···· 1234").
 * `full` solo se envía al navegador cuando el rol puede verlo (owner/finanzas); sin él no hay botón de mostrar.
 */
export function MaskedAccount({ masked, full }: { masked: string; full?: string | null }) {
  const [shown, setShown] = useState(false);
  if (!full) return <span className="font-mono">{masked}</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono">{shown ? full : masked}</span>
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        className="text-gray-400 hover:text-carbon"
        aria-label={shown ? "Ocultar número de cuenta" : "Mostrar número de cuenta"}
        aria-pressed={shown}
      >
        {shown ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
      </button>
    </span>
  );
}

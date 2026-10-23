import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <EmptyState
        icon={SearchX}
        title="No encontramos esta página"
        description="Puede que no exista o que tu rol no tenga acceso a ella."
        action={
          <ButtonLink href="/" variant="outline">
            Volver al panorama
          </ButtonLink>
        }
      />
      <span className="sr-only">
        <Link href="/">Inicio</Link>
      </span>
    </div>
  );
}

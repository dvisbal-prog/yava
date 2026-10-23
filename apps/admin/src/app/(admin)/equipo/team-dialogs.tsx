"use client";

import { useState } from "react";
import { Check, Copy, UserPlus, UserX, UserCheck, Shield } from "lucide-react";
import type { AdminRole } from "@yava/shared";
import { Constants } from "@yava/shared";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/roles";
import { FormDialog } from "@/components/ui/form-dialog";
import { ReasonDialog } from "@/components/ui/reason-dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { Note } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { changeRoleAction, inviteAction, setMemberStatusAction } from "./actions";

const ROLES = Constants.public.Enums.admin_role as readonly AdminRole[];

export function InviteDialog({ siteUrl }: { siteUrl: string }) {
  const [link, setLink] = useState<{ url: string; email: string } | null>(null);
  return (
    <>
      <FormDialog
        trigger={<><UserPlus className="h-4 w-4" aria-hidden /> Invitar integrante</>}
        title="Invitar integrante"
        description="Se crea una invitación válida por 7 días. Por ahora el correo no se envía automáticamente: copia el enlace y compártelo."
        action={inviteAction}
        confirmLabel="Crear invitación"
        onSuccess={(res) => {
          const token = res.data?.token;
          if (token) setLink({ url: `${siteUrl}/invitacion/${token}`, email: res.data?.email ?? "" });
        }}
      >
        <Field label="Correo electrónico" htmlFor="email">
          <Input id="email" name="email" type="email" required placeholder="nombre@empresa.com" />
        </Field>
        <Field label="Rol" htmlFor="role" hint="Los permisos se asignan por rol.">
          <Select id="role" name="role" defaultValue="operations" required>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]} — {ROLE_DESCRIPTION[r]}
              </option>
            ))}
          </Select>
        </Field>
      </FormDialog>
      <Dialog open={Boolean(link)} onClose={() => setLink(null)} title="Invitación creada" description={link ? `Para ${link.email}. Caduca en 7 días.` : undefined}>
        {link ? <CopyLink url={link.url} /> : null}
        <Note tone="warning" className="mt-3">El envío automático por correo se implementará después. Mientras tanto comparte este enlace por un canal seguro.</Note>
      </Dialog>
    </>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Enlace de invitación" className="font-mono text-xs" />
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* el usuario puede copiar manualmente */
          }
        }}
      >
        {copied ? <Check className="h-4 w-4 text-green" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}

export function MemberActions({ userId, role, status, isSelf }: { userId: string; role: AdminRole; status: string; isSelf: boolean }) {
  return (
    <div className="flex gap-1.5 justify-end">
      <ReasonDialog
        size="sm"
        variant="ghost"
        trigger={<><Shield className="h-3.5 w-3.5" aria-hidden /> Rol</>}
        title="Cambiar rol"
        description="Los permisos se asignan por rol. El cambio aplica de inmediato."
        action={changeRoleAction}
        hidden={{ user_id: userId }}
        confirmLabel="Cambiar rol"
        disabled={isSelf}
        fields={
          <Field label="Nuevo rol" htmlFor="role">
            <Select id="role" name="role" defaultValue={role}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
        }
      />
      {status === "disabled" ? (
        <ReasonDialog size="sm" variant="ghost" trigger={<><UserCheck className="h-3.5 w-3.5" aria-hidden /> Habilitar</>} title="Habilitar integrante" action={setMemberStatusAction} hidden={{ user_id: userId, status: "active" }} confirmLabel="Habilitar" />
      ) : (
        <ReasonDialog size="sm" variant="ghost" confirmVariant="danger" trigger={<><UserX className="h-3.5 w-3.5 text-red" aria-hidden /> Deshabilitar</>} title="Deshabilitar integrante" description="Pierde el acceso al panel de inmediato. Puede habilitarse de nuevo." action={setMemberStatusAction} hidden={{ user_id: userId, status: "disabled" }} confirmLabel="Deshabilitar" disabled={isSelf} />
      )}
    </div>
  );
}

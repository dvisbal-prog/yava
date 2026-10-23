export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-carbon">{title}</h1>
        {description ? <p className="text-sm text-muted mt-0.5">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-[15px] font-semibold text-carbon">{children}</h2>
      {action}
    </div>
  );
}

export function DemoNote() {
  return <p className="text-xs text-gray-400 text-right mt-6">Datos en vivo desde Supabase · COP</p>;
}

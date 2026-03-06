import { isDeviceOnline } from "@/lib/api";

export function StatusBadge({ lastSeen, isOnline }: { lastSeen: string | null; isOnline: boolean }) {
  const online = isOnline && isDeviceOnline(lastSeen);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      online ? "status-online" : "status-offline"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-success animate-pulse-glow" : "bg-destructive"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

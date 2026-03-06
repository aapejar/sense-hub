import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/StatusBadge";
import { useAllReadings, useDevices } from "@/hooks/useIoTData";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ReadingsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const pageSize = 25;
  const { data: readings } = useAllReadings(500);
  const { data: devices } = useDevices();

  const deviceMap = new Map(devices?.map((d) => [d.id, d.device_name]));

  const filtered = useMemo(() => {
    if (!readings) return [];
    if (!search) return readings;
    return readings.filter((r) => {
      const name = deviceMap.get(r.device_id) || "";
      return name.toLowerCase().includes(search.toLowerCase()) ||
        r.device_id.includes(search);
    });
  }, [readings, search, deviceMap]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <DashboardLayout>
      <PageHeader title="Data Logs" description="All incoming sensor readings">
        <Input placeholder="Search by device..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="w-48 bg-secondary" />
      </PageHeader>

      <div className="card-glow rounded-xl bg-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>RSSI</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{deviceMap.get(r.device_id) || r.device_id.slice(0, 8)}</td>
                <td>{r.temperature?.toFixed(1) ?? "—"}</td>
                <td>{r.humidity?.toFixed(1) ?? "—"}</td>
                <td>{r.wifi_rssi ?? "—"}</td>
                <td>
                  <span className={`text-xs ${r.status === "online" ? "text-success" : "text-destructive"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="text-xs text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </DashboardLayout>
  );
}

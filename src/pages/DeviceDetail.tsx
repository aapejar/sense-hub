import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader, StatusBadge } from "@/components/StatusBadge";
import { useDevice, useDeviceReadings } from "@/hooks/useIoTData";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

const timeFilters = [
  { label: "1H", hours: 1 },
  { label: "6H", hours: 6 },
  { label: "24H", hours: 24 },
  { label: "7D", hours: 168 },
];

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: device, isLoading } = useDevice(id!);
  const [timeFilter, setTimeFilter] = useState(24);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const fromTime = useMemo(() => new Date(Date.now() - timeFilter * 3600 * 1000).toISOString(), [timeFilter]);
  const { data: readings } = useDeviceReadings(id!, 500, fromTime);

  const chartData = useMemo(() => {
    if (!readings) return [];
    return [...readings]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        temperature: r.temperature,
        humidity: r.humidity,
      }))
      .slice(-100);
  }, [readings]);

  const pagedReadings = useMemo(() => {
    if (!readings) return [];
    return readings.slice(page * pageSize, (page + 1) * pageSize);
  }, [readings, page]);

  const totalPages = readings ? Math.ceil(readings.length / pageSize) : 0;

  const exportCSV = () => {
    if (!readings) return;
    const header = "timestamp,temperature,humidity,wifi_rssi,status\n";
    const rows = readings.map((r) =>
      `${r.timestamp},${r.temperature ?? ""},${r.humidity ?? ""},${r.wifi_rssi ?? ""},${r.status ?? ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${device?.device_name || "device"}_readings.csv`;
    a.click();
  };

  if (isLoading) return <DashboardLayout><div className="text-muted-foreground">Loading...</div></DashboardLayout>;
  if (!device) return <DashboardLayout><div>Device not found</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <PageHeader title={device.device_name} description={`Serial: ${device.serial_number}`}>
        <StatusBadge lastSeen={device.last_seen} isOnline={device.is_online} />
      </PageHeader>

      {/* Device Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">Device ID</p>
          <p className="text-xs font-mono break-all">{device.id}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">Node Number</p>
          <p className="text-lg font-bold">{device.node_number ?? "N/A"}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
          <p className="text-sm">{device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never"}</p>
        </div>
      </div>

      {/* Sensors */}
      {device.sensors && device.sensors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Sensors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {device.sensors.map((s) => (
              <div key={s.id} className="stat-card">
                <p className="font-medium text-sm">{s.sensor_name}</p>
                <p className="text-xs text-muted-foreground">{s.sensor_type} · {s.unit} · Range: {s.min_value}–{s.max_value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Filter */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Historical Data</h2>
        <div className="flex gap-1 ml-auto">
          {timeFilters.map((tf) => (
            <button
              key={tf.label}
              onClick={() => { setTimeFilter(tf.hours); setPage(0); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                timeFilter === tf.hours ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <h3 className="text-sm font-semibold mb-4">Temperature (°C)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="temperature" stroke="hsl(152, 60%, 48%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold mb-4">Humidity (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="humidity" stroke="hsl(199, 70%, 55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Readings Table */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Readings ({readings?.length ?? 0})</h2>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1">
          <Download className="w-3 h-3" /> Export CSV
        </Button>
      </div>
      <div className="card-glow rounded-xl bg-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>RSSI</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pagedReadings.map((r) => (
              <tr key={r.id}>
                <td className="text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                <td>{r.temperature?.toFixed(1) ?? "—"}</td>
                <td>{r.humidity?.toFixed(1) ?? "—"}</td>
                <td>{r.wifi_rssi ?? "—"}</td>
                <td>
                  <span className={`text-xs ${r.status === "online" ? "text-success" : "text-destructive"}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </DashboardLayout>
  );
}

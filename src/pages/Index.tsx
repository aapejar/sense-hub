import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/StatusBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useDashboardSummary, useAllReadings, useDevices } from "@/hooks/useIoTData";
import { isDeviceOnline } from "@/lib/api";
import { Cpu, Wifi, Radio, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useMemo } from "react";

const timeFilters = [
  { label: "1H", hours: 1 },
  { label: "6H", hours: 6 },
  { label: "24H", hours: 24 },
  { label: "7D", hours: 168 },
];

const nodeColors: Record<string, string> = {
  "7f9fb627-4bec-454b-b55e-f0e9b42ecbb9": "hsl(152, 60%, 48%)",
  "0acbf433-e6aa-4074-adb0-9c6171b97fd3": "hsl(199, 70%, 55%)",
  "2c431941-c470-45cd-b049-f632c6cc5b6d": "hsl(38, 92%, 55%)",
};

const nodeNames: Record<string, string> = {
  "7f9fb627-4bec-454b-b55e-f0e9b42ecbb9": "Node A",
  "0acbf433-e6aa-4074-adb0-9c6171b97fd3": "Node B",
  "2c431941-c470-45cd-b049-f632c6cc5b6d": "Node C",
};

export default function Dashboard() {
  const { data: summary, isLoading } = useDashboardSummary();
  const [timeFilter, setTimeFilter] = useState(24);
  const fromTime = useMemo(() => new Date(Date.now() - timeFilter * 3600 * 1000).toISOString(), [timeFilter]);
  const { data: readings } = useAllReadings(500, fromTime);

  const chartData = useMemo(() => {
    if (!readings) return [];
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Group by timestamp buckets
    const map = new Map<string, any>();
    sorted.forEach((r) => {
      const t = new Date(r.timestamp);
      const key = `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
      const name = nodeNames[r.device_id] || r.device_id.slice(0, 6);
      if (!map.has(r.timestamp)) {
        map.set(r.timestamp, { time: key, timestamp: r.timestamp });
      }
      const entry = map.get(r.timestamp)!;
      entry[`temp_${name}`] = r.temperature;
      entry[`hum_${name}`] = r.humidity;
    });
    return Array.from(map.values()).slice(-100);
  }, [readings]);

  const latestReadings = useMemo(() => {
    if (!readings) return [];
    const seen = new Set<string>();
    return readings.filter((r) => {
      if (seen.has(r.device_id)) return false;
      seen.add(r.device_id);
      return true;
    });
  }, [readings]);

  const stats = [
    { label: "Total Devices", value: summary?.total_devices ?? 0, icon: Cpu, color: "text-primary" },
    { label: "Online", value: summary?.online_devices ?? 0, icon: Wifi, color: "text-success" },
    { label: "Sensors", value: summary?.total_sensors ?? 0, icon: Radio, color: "text-chart-2" },
    { label: "Readings Today", value: summary?.readings_today ?? 0, icon: BarChart3, color: "text-warning" },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" description="Real-time WSN IoT Monitoring Overview" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{isLoading ? "—" : s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Device Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Registered Devices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {summary?.devices.map((d) => (
            <Link
              key={d.id}
              to={`/devices/${d.id}`}
              className="stat-card group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{d.device_name}</span>
                <StatusBadge lastSeen={d.last_seen} isOnline={d.is_online} />
              </div>
              {d.node_number && (
                <p className="text-xs text-muted-foreground">Node {d.node_number}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono">{d.serial_number}</p>
              {d.last_seen && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Last: {new Date(d.last_seen).toLocaleString()}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Readings */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Latest Activity</h2>
        <div className="card-glow rounded-xl bg-card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>RSSI (dBm)</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {latestReadings.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{nodeNames[r.device_id] || r.device_id.slice(0, 8)}</td>
                  <td>{r.temperature?.toFixed(1) ?? "—"}</td>
                  <td>{r.humidity?.toFixed(1) ?? "—"}</td>
                  <td>{r.wifi_rssi ?? "—"}</td>
                  <td className="text-muted-foreground text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Charts</h2>
        <div className="flex gap-1 ml-auto">
          {timeFilters.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTimeFilter(tf.hours)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                timeFilter === tf.hours ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stat-card">
          <h3 className="text-sm font-semibold mb-4">Temperature (°C)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px" }}
                labelStyle={{ color: "hsl(210, 20%, 92%)" }}
              />
              {Object.entries(nodeNames).map(([id, name]) => (
                <Line key={id} type="monotone" dataKey={`temp_${name}`} name={name} stroke={nodeColors[id]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="text-sm font-semibold mb-4">Humidity (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
              <Tooltip
                contentStyle={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: "8px" }}
                labelStyle={{ color: "hsl(210, 20%, 92%)" }}
              />
              {Object.entries(nodeNames).map(([id, name]) => (
                <Line key={id} type="monotone" dataKey={`hum_${name}`} name={name} stroke={nodeColors[id]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}

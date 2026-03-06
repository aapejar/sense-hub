import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/StatusBadge";

const API_URL = `${window.location.origin}/functions/v1/iot-devices`;

const nodeMapping = [
  { node: 401, name: "Node A", device_id: "7f9fb627-4bec-454b-b55e-f0e9b42ecbb9" },
  { node: 402, name: "Node B", device_id: "0acbf433-e6aa-4074-adb0-9c6171b97fd3" },
  { node: 403, name: "Node C", device_id: "2c431941-c470-45cd-b049-f632c6cc5b6d" },
];

export default function IntegrationPage() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-project.supabase.co";
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "your-anon-key";
  const endpoint = `${supabaseUrl}/functions/v1/iot-devices`;

  return (
    <DashboardLayout>
      <PageHeader title="Integration Guide" description="Connect your ESP32 to the WSN IoT Monitoring System" />

      <div className="space-y-6 max-w-3xl">
        {/* Endpoint */}
        <section className="stat-card">
          <h2 className="text-lg font-semibold mb-2">API Endpoint</h2>
          <code className="block bg-background p-3 rounded-lg text-sm font-mono text-primary break-all">
            POST {endpoint}
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Required header: <code className="text-foreground">apikey: {apiKey.slice(0, 20)}...</code>
          </p>
        </section>

        {/* JSON Format */}
        <section className="stat-card">
          <h2 className="text-lg font-semibold mb-2">Request Body (JSON)</h2>
          <pre className="bg-background p-4 rounded-lg text-sm font-mono overflow-x-auto">{`{
  "device_id": "7f9fb627-4bec-454b-b55e-f0e9b42ecbb9",
  "temperature": 29.2,
  "humidity": 80.8,
  "wifi_rssi": -55,
  "status": "online",
  "timestamp": "2026-03-05T10:15:00Z"
}`}</pre>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p><strong>device_id</strong> — Required. UUID of the registered device.</p>
            <p><strong>temperature</strong> — Optional. Numeric value in °C.</p>
            <p><strong>humidity</strong> — Optional. Numeric, 0–100.</p>
            <p><strong>wifi_rssi</strong> — Optional. Signal strength in dBm.</p>
            <p><strong>status</strong> — Optional. "online" or "offline".</p>
            <p><strong>timestamp</strong> — Optional. ISO 8601. Uses server time if omitted.</p>
          </div>
        </section>

        {/* Node Mapping */}
        <section className="stat-card">
          <h2 className="text-lg font-semibold mb-2">Node → Device ID Mapping</h2>
          <div className="card-glow rounded-lg overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Node #</th>
                  <th>Name</th>
                  <th>Device ID</th>
                </tr>
              </thead>
              <tbody>
                {nodeMapping.map((n) => (
                  <tr key={n.node}>
                    <td className="font-bold">{n.node}</td>
                    <td>{n.name}</td>
                    <td className="font-mono text-xs break-all">{n.device_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* cURL Example */}
        <section className="stat-card">
          <h2 className="text-lg font-semibold mb-2">cURL Example</h2>
          <pre className="bg-background p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">{`curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey.slice(0, 20)}..." \\
  -d '{
    "device_id": "7f9fb627-4bec-454b-b55e-f0e9b42ecbb9",
    "temperature": 28.5,
    "humidity": 75.3,
    "wifi_rssi": -48,
    "status": "online"
  }'`}</pre>
        </section>

        {/* ESP32 Code */}
        <section className="stat-card">
          <h2 className="text-lg font-semibold mb-2">ESP32 HTTP POST Example (Arduino)</h2>
          <pre className="bg-background p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">{`#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

const char* serverUrl = "${endpoint}";
const char* apiKey = "${apiKey.slice(0, 20)}...";

// Node to Device ID mapping
struct NodeMapping {
  int nodeId;
  const char* deviceId;
};

NodeMapping nodes[] = {
  {401, "7f9fb627-4bec-454b-b55e-f0e9b42ecbb9"},
  {402, "0acbf433-e6aa-4074-adb0-9c6171b97fd3"},
  {403, "2c431941-c470-45cd-b049-f632c6cc5b6d"}
};

void sendData(int nodeId, float temp, float hum) {
  const char* deviceId = nullptr;
  for (auto& n : nodes) {
    if (n.nodeId == nodeId) {
      deviceId = n.deviceId;
      break;
    }
  }
  if (!deviceId) return;

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);

  StaticJsonDocument<256> doc;
  doc["device_id"] = deviceId;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["status"] = "online";

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.printf("Node %d → HTTP %d\\n", nodeId, code);
  http.end();
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.println("WiFi connected");
}

void loop() {
  // Example: send data from parsed LoRa frames
  sendData(401, 28.5, 75.3);
  sendData(402, 27.1, 80.2);
  sendData(403, 29.8, 68.7);
  delay(30000); // Send every 30 seconds
}`}</pre>
        </section>

        {/* Architecture */}
        <section className="stat-card">
          <h2 className="text-lg font-semibold mb-2">System Architecture</h2>
          <div className="bg-background p-4 rounded-lg font-mono text-xs text-center space-y-2">
            <p className="text-primary">Sensor Node (Arduino UNO + DHT11 + LoRa)</p>
            <p className="text-muted-foreground">↓ LoRa Radio</p>
            <p className="text-chart-2">Gateway (Arduino Mega + LoRa)</p>
            <p className="text-muted-foreground">↓ Serial</p>
            <p className="text-warning">ESP32 Edge Device</p>
            <p className="text-muted-foreground">↓ HTTP POST (WiFi)</p>
            <p className="text-primary font-bold">Web Dashboard (This App)</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

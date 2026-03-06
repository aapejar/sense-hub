import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Edge function is mounted at /iot-devices, so pathParts after function name
  // Routes: POST / (ingest), GET / (list devices), GET /:id, GET /:id/readings, GET /dashboard/summary

  try {
    if (req.method === "POST") {
      return await handleIngest(req, supabase);
    }

    if (req.method === "GET") {
      const path = url.pathname.replace(/^\/iot-devices\/?/, "");
      
      if (path === "dashboard/summary") {
        return await handleDashboardSummary(supabase);
      }
      
      if (path === "" || path === "/") {
        return await handleListDevices(supabase);
      }

      const parts = path.split("/").filter(Boolean);
      if (parts.length === 1) {
        return await handleGetDevice(supabase, parts[0]);
      }
      if (parts.length === 2 && parts[1] === "readings") {
        const limit = parseInt(url.searchParams.get("limit") || "500");
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        return await handleGetReadings(supabase, parts[0], limit, from, to);
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleIngest(req: Request, supabase: any) {
  const body = await req.json();
  const { device_id, temperature, humidity, wifi_rssi, status, timestamp } = body;

  if (!device_id) {
    return jsonResponse({ success: false, error: "device_id is required" }, 400);
  }

  // Validate device exists
  const { data: device, error: deviceError } = await supabase
    .from("devices")
    .select("id")
    .eq("id", device_id)
    .single();

  if (deviceError || !device) {
    return jsonResponse({ success: false, error: "Device not found" }, 404);
  }

  // Validate fields
  if (temperature !== undefined && typeof temperature !== "number") {
    return jsonResponse({ success: false, error: "temperature must be numeric" }, 400);
  }
  if (humidity !== undefined) {
    if (typeof humidity !== "number" || humidity < 0 || humidity > 100) {
      return jsonResponse({ success: false, error: "humidity must be numeric between 0-100" }, 400);
    }
  }
  if (wifi_rssi !== undefined && typeof wifi_rssi !== "number") {
    return jsonResponse({ success: false, error: "wifi_rssi must be numeric" }, 400);
  }
  if (status !== undefined && !["online", "offline"].includes(status)) {
    return jsonResponse({ success: false, error: "status must be 'online' or 'offline'" }, 400);
  }

  const ts = timestamp || new Date().toISOString();

  // Insert reading
  const { error: insertError } = await supabase.from("sensor_readings").insert({
    device_id,
    temperature,
    humidity,
    wifi_rssi,
    status: status || "online",
    timestamp: ts,
  });

  if (insertError) {
    return jsonResponse({ success: false, error: insertError.message }, 500);
  }

  // Update device
  await supabase
    .from("devices")
    .update({ last_seen: ts, is_online: true })
    .eq("id", device_id);

  return jsonResponse({ success: true, message: "Data stored successfully" });
}

async function handleListDevices(supabase: any) {
  const { data, error } = await supabase.from("devices").select("*").order("device_name");
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse(data);
}

async function handleGetDevice(supabase: any, id: string) {
  const { data, error } = await supabase.from("devices").select("*, sensors(*)").eq("id", id).single();
  if (error) return jsonResponse({ error: "Device not found" }, 404);
  return jsonResponse(data);
}

async function handleGetReadings(supabase: any, deviceId: string, limit: number, from: string | null, to: string | null) {
  let query = supabase
    .from("sensor_readings")
    .select("*")
    .eq("device_id", deviceId)
    .order("timestamp", { ascending: false })
    .limit(Math.min(limit, 500));

  if (from) query = query.gte("timestamp", from);
  if (to) query = query.lte("timestamp", to);

  const { data, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse(data);
}

async function handleDashboardSummary(supabase: any) {
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Mark devices offline if no data in 2 minutes
  await supabase
    .from("devices")
    .update({ is_online: false })
    .lt("last_seen", twoMinAgo);

  const [devicesRes, sensorsRes, readingsTodayRes] = await Promise.all([
    supabase.from("devices").select("*"),
    supabase.from("sensors").select("id", { count: "exact" }),
    supabase.from("sensor_readings").select("id", { count: "exact" }).gte("timestamp", todayStart.toISOString()),
  ]);

  const devices = devicesRes.data || [];
  const onlineDevices = devices.filter((d: any) => d.is_online).length;

  return jsonResponse({
    total_devices: devices.length,
    online_devices: onlineDevices,
    total_sensors: sensorsRes.count || 0,
    readings_today: readingsTodayRes.count || 0,
    devices,
  });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
